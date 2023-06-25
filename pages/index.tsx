import { useEffect, useState } from 'react'
import {
  ADAPTER_EVENTS,
  CHAIN_NAMESPACES,
  SafeEventEmitterProvider,
  WALLET_ADAPTERS
} from '@web3auth/base'
import { Box, Divider, Grid, Typography } from '@mui/material'
import { OpenloginAdapter } from '@web3auth/openlogin-adapter'
import { EthHashInfo } from '@safe-global/safe-react-components'
import { ethers } from 'ethers'
import { EthersAdapter } from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'
import Safe from '@safe-global/protocol-kit'
import Modal from '@mui/material/Modal'
import Button from '@mui/material/Button'
import AppBar from '../src/AppBar'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { SafeAuthKit, Web3AuthModalPack } from '@safe-global/auth-kit'
import { Web3AuthOptions, Web3AuthEventListener } from '@web3auth/modal'
import CircularProgress from '@mui/material/CircularProgress'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import axios from 'axios'
import Image from 'next/image'
import Lottie from 'react-lottie'
import * as AnalyzeAnimationData from './analyze_lottie.json'
import * as SuccessAnimationData from './success_lottie.json'
import * as FailureAnimationData from './failure_lottie.json'
import * as ExecuteAnimationData from './execute_lottie.json'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import Paper from '@mui/material/Paper'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import { TX_DATA } from '../src/txData'

const STEP_ANALYSIS = 'analysis'
const STEP_EXECUTE = 'execute'
const STEP_ANALYSIS_FAILED = 'analysis_failed'
const STEP_ANALYSIS_PASSED = 'analysis_passed'
const STEP_ANALYSIS_OVERRIDE_PASSED = 'analysis_override_passed'
const STEP_OVERRIDE = 'override'

const TxButton = ({ buttonText, safeSDK, safeService, safeAddress, txData, ip }) => {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(undefined)
  const [tx, setTx] = useState(undefined)
  const [txTriggered, setTxTriggered] = useState(false)
  const [fraudDetectionResult, setFraudDetectionResult] = useState(undefined)
  const [txHash, setTxHash] = useState(undefined)

  const onClickOverride = async () => {
    setTxTriggered(true)
    const safeTransaction = await safeSDK.createTransaction({ safeTransactionData: txData })
    const safeTxHash = await safeSDK.getTransactionHash(safeTransaction)
    const senderSignature = await safeSDK.signTransactionHash(safeTxHash)
    await safeService.proposeTransaction({
      safeAddress: safeAddress,
      safeTransactionData: safeTransaction.data,
      safeTxHash: safeTxHash,
      senderAddress: '0xcE712B9989f49126f7F7A355097769Aedde3Ccb8',
      senderSignature: senderSignature.data
    })
    setTxTriggered(false)
    setStep(STEP_ANALYSIS_OVERRIDE_PASSED)
    console.log('proposed')
  }

  const onClickExecuteOverride = async () => {
    setTxTriggered(true)
    const pendingTransactions = (await safeService.getPendingTransactions(safeAddress))?.results
    const transaction = pendingTransactions[0]
    setTx(transaction)
    const executeTxResponse = await safeSDK.executeTransaction(transaction)
    setTxHash(executeTxResponse.hash)
    console.log(executeTxResponse)
    setStep(STEP_EXECUTE)
    setTxTriggered(false)
  }

  const onClickExecute = async () => {
    setTxTriggered(true)
    const executeTxResponse = await safeSDK.executeTransaction(tx)
    setTxHash(executeTxResponse.hash)
    console.log(executeTxResponse)
    //const receipt = await executeTxResponse.transactionResponse?.wait()
    setStep(STEP_EXECUTE)
    setTxTriggered(false)
    // console.log('Transaction executed:')
    // console.log(`https://goerli.etherscan.io/tx/${receipt.transactionHash}`)
  }
  const DIALOG = {
    [STEP_ANALYSIS]: {
      title: (
        <Box
          sx={{
            width: '100%',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            p: 2
          }}
        >
          <Typography variant='h4' component='div'>
            Risk Assessment
          </Typography>
        </Box>
      ),
      content: (
        <DialogContentText id='alert-dialog-description'>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Lottie
              options={{
                loop: true,
                autoplay: true,
                animationData: AnalyzeAnimationData,
                rendererSettings: {
                  preserveAspectRatio: 'xMidYMid slice'
                }
              }}
              height={200}
              width={400}
              isStopped={false}
              isPaused={false}
            />
            <Typography variant='h6' component='div'>
              Transaction is being analyzed for risk by our fraud detection service, please wait...
            </Typography>
          </Box>
        </DialogContentText>
      )
    },
    [STEP_ANALYSIS_FAILED]: {
      title: (
        <Box
          sx={{
            width: '100%',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            p: 2
          }}
        >
          <Typography variant='h4' component='div'>
            Risk Assessment
          </Typography>
        </Box>
      ),
      content: (
        <DialogContentText id='alert-dialog-description'>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Lottie
              options={{
                loop: false,
                autoplay: true,
                animationData: FailureAnimationData,
                rendererSettings: {
                  preserveAspectRatio: 'xMidYMid slice'
                }
              }}
              height={200}
              width={200}
              isStopped={false}
              isPaused={false}
            />
            <Box
              sx={{
                width: '100%',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                backgroundColor: '#c62828',
                p: 2,
                gap: 2
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Typography variant='h4' component='div'>
                  Blocked
                </Typography>
                <CheckCircleOutlineIcon />
              </Box>

              <Typography variant='h5' component='div'>
                {fraudDetectionResult?.reason}
              </Typography>
              {txTriggered && <CircularProgress />}
              {!txTriggered && (
                <Button variant='contained' fullWidth onClick={() => onClickOverride()}>
                  Override
                </Button>
              )}
            </Box>
          </Box>
        </DialogContentText>
      )
    },
    [STEP_ANALYSIS_PASSED]: {
      title: (
        <Box
          sx={{
            width: '100%',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            p: 2
          }}
        >
          <Typography variant='h4' component='div'>
            Risk Assessment
          </Typography>
        </Box>
      ),
      content: (
        <DialogContentText id='alert-dialog-description'>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Lottie
              options={{
                loop: false,
                autoplay: true,
                animationData: SuccessAnimationData,
                rendererSettings: {
                  preserveAspectRatio: 'xMidYMid slice'
                }
              }}
              height={200}
              width={200}
              isStopped={false}
              isPaused={false}
            />
            <Box
              sx={{
                width: '100%',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                backgroundColor: '#4caf50',
                p: 2,
                gap: 2
              }}
            >
              <Typography variant='h6' component='div'>
                The transaction has passed the risk assessment and has been co-signed by the Super
                Guardian
              </Typography>
            </Box>
            {txTriggered && (
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress />
                </Box>
            )}
            {!txTriggered && (
              <Button variant='contained' fullWidth onClick={onClickExecute}>
                Sign and Execute
              </Button>
            )}
          </Box>
        </DialogContentText>
      )
    },
    [STEP_ANALYSIS_OVERRIDE_PASSED]: {
      title: (
        <Box
          sx={{
            width: '100%',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            p: 2
          }}
        >
          <Typography variant='h4' component='div'>
            Override Successful
          </Typography>
        </Box>
      ),
      content: (
        <DialogContentText id='alert-dialog-description'>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Lottie
              options={{
                loop: false,
                autoplay: true,
                animationData: SuccessAnimationData,
                rendererSettings: {
                  preserveAspectRatio: 'xMidYMid slice'
                }
              }}
              height={200}
              width={200}
              isStopped={false}
              isPaused={false}
            />
            <Box
              sx={{
                width: '100%',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                backgroundColor: '#4caf50',
                p: 2,
                gap: 2
              }}
            >
              <Typography variant='h6' component='div'>
                You can now bypass our fraud detection service and execute the transaction
              </Typography>
            </Box>
            {txTriggered && (
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress />
                </Box>
            )}
            {!txTriggered && (
              <Button variant='contained' fullWidth onClick={onClickExecuteOverride}>
                Sign and Execute
              </Button>
            )}
          </Box>
        </DialogContentText>
      )
    },
    [STEP_EXECUTE]: {
      title: (
        <Box
          sx={{
            width: '100%',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            p: 2
          }}
        >
          <Typography variant='h4' component='div'>
            Transaction Submitted
          </Typography>
        </Box>
      ),
      content: (
        <DialogContentText id='alert-dialog-description'>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Lottie
              options={{
                loop: true,
                autoplay: true,
                animationData: ExecuteAnimationData,
                rendererSettings: {
                  preserveAspectRatio: 'xMidYMid slice'
                }
              }}
              height={200}
              width={200}
              isStopped={false}
              isPaused={false}
            />
            <Button
              variant='contained'
              fullWidth
              target="_blank" 
              href={`https://goerli.etherscan.io/tx/${txHash}`}
            >
              View on Block Explorer
            </Button>
          </Box>
        </DialogContentText>
      )
    }
  }

  const handleClose = () => {
    setOpen(false)
  }

  const onClick = async () => {
    if (!safeSDK || !safeService) return
    setStep('analysis')
    setOpen(true)

    const safeTransactionData = txData
    // const safeTransactionData: MetaTransactionData = {
    //   to: '0x555F002008e744eB131Fb252bE0ae086BCEe9713',
    //   data: '0x',
    //   value: ethers.utils.parseUnits('0.0001', 'ether').toString()
    // }

    const safeTransaction = await safeSDK.createTransaction({ safeTransactionData })
    const safeTxHash = await safeSDK.getTransactionHash(safeTransaction)

    const fraudDetectionServiceResponse = await axios.post('/api/tx', {
      transactionData: safeTransactionData,
      walletAddress: safeAddress,
      ip
    })

    setFraudDetectionResult(fraudDetectionServiceResponse.data)

    if (fraudDetectionServiceResponse.data.status === 'PASSED') {
      setStep(STEP_ANALYSIS_PASSED)
      const pendingTransactions = (await safeService.getPendingTransactions(safeAddress))?.results
      const transaction = pendingTransactions[0]
      setTx(transaction)

      // const senderSignature = await safeSDK.signTransactionHash(transaction.safeTxHash)
      // const signature: SignatureResponse = await safeService.confirmTransaction(safeTxHash, senderSignature.data)
    } else {
      setStep(STEP_ANALYSIS_FAILED)
    }

    // const resp = await safeService.proposeTransaction({
    //   safeAddress,
    //   safeTransactionData: safeTransaction.data,
    //   safeTxHash,
    //   senderAddress: await safeSDK.getAddress(),
    //   senderSignature: senderSignature.data,
    // })
    // console.log(safeTransaction, resp)
  }
  return (
    <div>
      <Button variant='contained' onClick={onClick} sx={{width: 190}}>
        {buttonText}
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
        sx={{
          '& .MuiDialog-container': {
            justifyContent: 'flex-center',
            alignItems: 'flex-center'
          }
        }}
      >
        <DialogTitle
          id='alert-dialog-title'
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box sx={{ height: 100, width: 180, position: 'relative' }}>
            <Image src='/logo2.png' alt='Safe' fill style={{ objectFit: 'contain' }} />
          </Box>
          <IconButton aria-label='close' onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{pb: 5}}>
          {step && (
            <>
              {DIALOG[step].title}
              {DIALOG[step].content}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function App() {
  const [safeAuthSignInResponse, setSafeAuthSignInResponse] = useState<SafeAuthSignInData | null>(
    null
  )
  const [safeAuth, setSafeAuth] = useState<SafeAuthKit<Web3AuthAdapter>>()
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null)
  const [safeSDK, setSafeSDK] = useState<Safe | null>(null)
  const [safeService, setSafeService] = useState<SafeApiKit | null>(null)

  useEffect(() => {
    ;(async () => {
      const options: Web3AuthOptions = {
        clientId: process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID,
        web3AuthNetwork: 'testnet',
        chainConfig: {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: '0x5',
          rpcTarget: `https://goerli.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`
        },
        uiConfig: {
          theme: 'dark',
          loginMethodsOrder: ['google', 'facebook']
        }
      }

      const modalConfig = {
        [WALLET_ADAPTERS.TORUS_EVM]: {
          label: 'torus',
          showOnModal: false
        },
        [WALLET_ADAPTERS.METAMASK]: {
          label: 'metamask',
          showOnDesktop: true,
          showOnMobile: false
        }
      }

      const openloginAdapter = new OpenloginAdapter({
        loginSettings: {
          mfaLevel: 'none'
        },
        adapterSettings: {
          uxMode: 'popup',
          whiteLabel: {
            name: 'Safe'
          }
        }
      })

      const pack = new Web3AuthModalPack(options, [openloginAdapter], modalConfig)

      const safeAuthKit = await SafeAuthKit.init(pack, {
        clientId: process.env.REACT_APP_WEB3_AUTH_CLIENT_ID,
        txServiceUrl: 'https://safe-transaction-goerli.safe.global'
      })

      setSafeAuth(safeAuthKit)
    })()
  }, [])

  const login = async () => {
    if (!safeAuth) return

    const response = await safeAuth.signIn()
    console.log('SIGN IN RESPONSE: ', response)

    setSafeAuthSignInResponse(response)
    setProvider(safeAuth.getProvider() as SafeEventEmitterProvider)

    const _provider = new ethers.providers.Web3Provider(safeAuth.getProvider())
    const _signer = _provider.getSigner()
    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: _signer
    })

    const safeSDK = await Safe.create({
      ethAdapter,
      safeAddress: response.safes[0]
    })

    const txServiceUrl = 'https://safe-transaction-goerli.safe.global'
    setSafeService(new SafeApiKit({ txServiceUrl, ethAdapter }))
    setSafeSDK(safeSDK)
  }

  const logout = async () => {
    if (!safeAuth) return

    await safeAuth.signOut()

    setProvider(null)
    setSafeAuthSignInResponse(null)
  }

  const cards = [
    {
      title: 'Transfer to a Whitelisted Address',
      subtitle: 'Transfer funds to a whitelisted address',
      buttonText: 'Send',
      txData: TX_DATA.find(tx => tx.label === 'WHITELISTED_ADDRESS')?.txData,
      ip: TX_DATA.find(tx => tx.label === 'WHITELISTED_ADDRESS')?.ip
    },
    {
      title: 'Transfer to a Blacklisted Address',
      subtitle: 'Transfer funds to a blacklisted address',
      buttonText: 'Send',
      txData: TX_DATA.find(tx => tx.label === 'BLACKLISTED_ADDRESS')?.txData,
      ip: TX_DATA.find(tx => tx.label === 'BLACKLISTED_ADDRESS')?.ip
    },
    {
      title: 'Transfer to a new address',
      subtitle: 'Transfer funds to a new address',
      buttonText: 'Send',
      txData: TX_DATA.find(tx => tx.label === 'NEW_ADDRESS')?.txData,
      ip: TX_DATA.find(tx => tx.label === 'NEW_ADDRESS')?.ip
    },
    {
      title: 'Malicious Airdrop Contract',
      subtitle: 'Interaction with a malicious airdrop contract',
      buttonText: 'Mint Free NFT',
      txData: TX_DATA.find(tx => tx.label === 'MALICIOUS_AIRDROP_CONTRACT')?.txData,
      ip: TX_DATA.find(tx => tx.label === 'MALICIOUS_AIRDROP_CONTRACT')?.ip
    },
    {
      title: 'IP address from a different country',
      subtitle: 'IP address from a different country',
      buttonText: 'Swap Tokens',
      txData: TX_DATA.find(tx => tx.label === 'IP_ADDRESS_NOT_THE_SAME_COUNTRY')?.txData,
      ip: TX_DATA.find(tx => tx.label === 'IP_ADDRESS_NOT_THE_SAME_COUNTRY')?.ip
    }
  ]

  return (
    <>
      <AppBar onLogin={login} onLogout={logout} isLoggedIn={!!provider} />
      {safeAuthSignInResponse?.eoa && (
        <Grid container sx={{ pl: 10, pr: 10 }}>
          <Grid item p={2}>
              <Card sx={{ p: 2, height: 320, width: 400 }}>
                <CardContent sx={{ height: '100%', width: '100%' }}>
                  <Box
                    sx={{
                      height: '100%',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Typography variant='h4' component='div'>
                        Transfer Funds
                      </Typography>
                      <Typography variant='h8'>Send tokens to another address</Typography>
                    </Box>
                    <Box>
                      <TxButton
                        txData={cards[0].txData}
                        ip={cards[0].ip}
                        buttonText={'whitelisted address'}
                        safeSDK={safeSDK}
                        safeService={safeService}
                        safeAddress={safeAuthSignInResponse.safes[0]}
                      />
                    </Box>
                    <Box>
                      <TxButton
                        txData={cards[0].txData}
                        ip={cards[0].ip}
                        buttonText={'backlisted address'}
                        safeSDK={safeSDK}
                        safeService={safeService}
                        safeAddress={safeAuthSignInResponse.safes[0]}
                      />
                    </Box>
                    <Box>
                      <TxButton
                        txData={cards[0].txData}
                        ip={cards[0].ip}
                        buttonText={'new address'}
                        safeSDK={safeSDK}
                        safeService={safeService}
                        safeAddress={safeAuthSignInResponse.safes[0]}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          {cards.slice(3).map((card, index) => (
            <Grid item p={2} key={index}>
              <Card sx={{ p: 2, height: 320, width: 400 }}>
                <CardContent sx={{ height: '100%', width: '100%' }}>
                  <Box
                    sx={{
                      height: '100%',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Typography variant='h4' component='div'>
                        {card.title}
                      </Typography>
                      <Typography variant='h8'>{card.subtitle}</Typography>
                    </Box>
                    <Box>
                      <TxButton
                        txData={card.txData}
                        ip={card.ip}
                        buttonText={card.buttonText}
                        safeSDK={safeSDK}
                        safeService={safeService}
                        safeAddress={safeAuthSignInResponse.safes[0]}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  )
}

const getPrefix = (chainId: string) => {
  switch (chainId) {
    case '0x1':
      return 'eth'
    case '0x5':
      return 'gor'
    case '0x100':
      return 'gno'
    case '0x137':
      return 'matic'
    default:
      return 'eth'
  }
}

export default App
