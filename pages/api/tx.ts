import SafeApiKit from '@safe-global/api-kit'
import Safe from '@safe-global/protocol-kit'
import { ethers } from 'ethers'
import { EthersAdapter } from '@safe-global/protocol-kit'
import { TX_DATA } from '../../src/txData'

const RPC_URL = `https://goerli.infura.io/v3/${process.env.INFURA_KEY}`
const txServiceUrl = 'https://safe-transaction-goerli.safe.global'
const provider = new ethers.providers.JsonRpcProvider(RPC_URL)
const superguardianSigner = new ethers.Wallet(process.env.SUPERGUARDIAN_PRIVATE_KEY!, provider)
const ethAdapterSuperguardian = new EthersAdapter({
  ethers,
  signerOrProvider: superguardianSigner
})

const PastIpAddress = '66.23.10.151'
const detectFraud = ({ walletAddress, transactionData, ip }) => {
  // detect ip address changes
  if (ip != PastIpAddress) {
    return {
      status: 'FAILED',
      reason: 'Your IP address is not from the same country as your past transactions'
    }
  }

  // check transaction data
  var txData = null
  for (const _txData of TX_DATA) {
    if (_txData.txData.to === transactionData.to) {
      txData = _txData
    }
  }
  return { status: txData.status, reason: txData.labelStr }
}

const proposeTransaction = async ({ walletAddress, transactionData }) => {
  const safeSDK = await Safe.create({
    ethAdapter: ethAdapterSuperguardian,
    safeAddress: walletAddress
  })
  const safeService = new SafeApiKit({ txServiceUrl, ethAdapter: ethAdapterSuperguardian })

  const safeTransaction = await safeSDK.createTransaction({ safeTransactionData: transactionData })
  // Deterministic hash based on transaction parameters
  const safeTxHash = await safeSDK.getTransactionHash(safeTransaction)

  // Sign transaction to verify that the transaction is coming from owner 1
  const senderSignature = await safeSDK.signTransactionHash(safeTxHash)

  await safeService.proposeTransaction({
    safeAddress: walletAddress,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: superguardianSigner.address,
    senderSignature: senderSignature.data
  })
  return { txHash: safeTxHash }
}

function sleep(milliseconds: number): Promise {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { walletAddress, transactionData, ip } = req.body
    const { status, reason } = detectFraud({ walletAddress, transactionData, ip })
    if (status === 'PASSED') {
      await proposeTransaction({ walletAddress, transactionData })
    }
    await sleep(2000)
    res.status(200).json({ status, reason })
  }
}
