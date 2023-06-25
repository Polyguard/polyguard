import { ethers } from 'ethers'

const TX_DATA = [
     {
        action: 'Transfer to a Whitelisted Address',
        label: 'WHITELISTED_ADDRESS',
        labelStr: null,
        status: 'PASSED',
        txData: {
            to: '0x555F002008e744eB131Fb252bE0ae086BCEe9713',
            data: '0x',
            value: ethers.utils.parseUnits('0.0001', 'ether').toString()
        },
        ip: "66.23.10.151"
    },
    {
        action: 'Transfer to a Blacklisted Address',
        label: 'BLACKLISTED_ADDRESS',
        labelStr: "Transferring to a blacklisted address is not allowed",
        status: 'FAILED',
        txData: {
            to: '0x311E3AD56b443AF1dE920e49A7B5A2616e9d2466',
            data: '0x',
            value: ethers.utils.parseUnits('0.0001', 'ether').toString()
        },
        ip: "66.23.10.151"
    },
    {
        action: 'Transfer to a new address',
        label: 'NEW_ADDRESS',
        status: 'FAILED',
        labelStr: "You have never transfered to this address before",
        txData: {
            to: '0x16cb89A78C281aCBBc334dd318e90d0ce4E91A7e',
            data: '0x',
            value: ethers.utils.parseUnits('0.0001', 'ether').toString()
        },
        ip: "66.23.10.151"
    },
    {
        action: 'Malicious Airdrop Contract',
        label: 'MALICIOUS_AIRDROP_CONTRACT',
        status: 'FAILED',
        labelStr: "This contract is known to be malicious",
        txData: {
            to: '0x2D8B5D794742a9e6b56b0B68B7680E996AFAA073',
            data: '0x',
            value: ethers.utils.parseUnits('0.0001', 'ether').toString()
        },
        ip: "66.23.10.151"
    },
    {
        action: "IP address from a different country",
        label: 'IP_ADDRESS_NOT_THE_SAME_COUNTRY',
        labelStr: "Your IP address is not from the same country as your past transactions",
        status: 'FAILED',
        txData: {
            to: '0x8EB9d030AE4ef2249ef5eFd8BF7c642a798adB8c',
            data: '0x',
            value: ethers.utils.parseUnits('0.0001', 'ether').toString()
        },
        ip: "103.204.124.0"
    }
]

export { TX_DATA }