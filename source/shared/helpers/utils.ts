import Web3, { Bytes, eth } from 'web3';
import { ethers, lock } from 'ethers';
import { BaseScanAPI } from "../apis/basescan.api";
import * as dotenv from 'dotenv';
dotenv.config();

const web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ALCHEMY_ENDPOINT_BASE}`))

export const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

export const convertSeconds = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
  
    return `${hours}h : ${minutes}m`
}

export async function getPairSushiV2(contractAddress: string) {
    //sushi V3: 0xc35DADB65012eC5796536bD9864eD8773aBc74C4 - TODO
    const abiGetPair = [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "getPair",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ] as const;
    var pairAddress: string;

    try {
        let contract = new web3.eth.Contract(abiGetPair, '0x71524B4f93c58fcbF659783284E38825f0622859');
        pairAddress = await contract.methods.getPair(contractAddress, '0x4200000000000000000000000000000000000006').call();
    } catch(e) {
        console.error(e)
        throw Error('[utils.getPairSushiV2] Error while getting pair address')
    }

    if (pairAddress === '0x0000000000000000000000000000000000000000') {
        return undefined
    } else {
        return pairAddress
    }
}

export async function getPairUniV3(contractAddress: string) {
    const abiGetPair = [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "uint24",
                    "name": "",
                    "type": "uint24"
                }
            ],
            "name": "getPool",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ] as const;
    var pairAddress: string;

    try {
        let contract = new web3.eth.Contract(abiGetPair, '0x33128a8fC17869897dcE68Ed026d694621f6FDfD');
        pairAddress = await contract.methods.getPool(contractAddress, '0x4200000000000000000000000000000000000006', 100).call();
    } catch(e) {
        console.error(e)
        throw Error('[utils.getPairUniV3] Error while getting pair address')
    }
    
    if (pairAddress === '0x0000000000000000000000000000000000000000') {
        return undefined
    } else {
        return pairAddress
    }
}

export async function getPairUniV2(contractAddress: string) {
    const abiGetPair = [
        {
            "constant": true,
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "getPair",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        }
    ] as const;
    var pairAddress: string;

    try {
        let contract = new web3.eth.Contract(abiGetPair, '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6');
        pairAddress = await contract.methods.getPair(contractAddress, '0x4200000000000000000000000000000000000006').call();
    } catch(e) {
        console.error(e)
        throw Error('[utils.getPairUniV2] Error while getting pair address')
    }
    

    if (pairAddress === '0x0000000000000000000000000000000000000000') {
        return undefined
    } else {
        return pairAddress
    }
}

export async function getPairSwapBasedv2(contractAddress: string) {
    const abiGetPair = [
        {
            "constant": true,
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "getPair",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        }
    ] as const;
    var pairAddress

    try {
        let contract = new web3.eth.Contract(abiGetPair, '0x04C9f118d21e8B767D2e50C946f0cC9F6C367300');
        pairAddress = await contract.methods.getPair(contractAddress, '0x4200000000000000000000000000000000000006').call();
    } catch(e) {
        console.error(e)
        throw Error('[utils.getPairSwapBasedv2] Error while getting pair address')
    }

    if (pairAddress === '0x0000000000000000000000000000000000000000') {
        return undefined
    } else {
        return pairAddress
    }
}

export async function getFirstReceiptPair(pairAddress: any) {
    var txReceipt: any;
    try {
        const currentBlock = await web3.eth.getBlockNumber().then(value => { return Number(value) });
        const txHash = await BaseScanAPI.getFirstInternalTxn(currentBlock, pairAddress);
        txReceipt = await web3.eth.getTransactionReceipt(txHash);
    } catch(e) {
        console.error(e)
        throw Error('[utils.getFirstReceiptPair] Error while getting first internal txn')
    }
    
    return txReceipt?.logs
}

async function filterAddLiquidityTxn(txns: any) {
    let isLatest = false;
    let initLp: any = [];
    for (let i = 0; i < txns?.result.length; i++) {
        if (txns?.result[i]?.input) {
            if (txns?.result[i]?.input.slice(0, 10) === '0xf305d719'
                || txns?.result[i]?.input.slice(0, 10) === '0xe8e33700'
                || txns?.result[i]?.input.slice(0, 10) === '0x51c6590a'
                || txns?.result[i]?.input.slice(0, 10) === '0xac9650d8'
                && isLatest === false) {
                const createTxn = txns['result'][i];
                const getCa = (keyName: keyof typeof createTxn) => {
                    return createTxn[keyName]
                };
                isLatest = true;
                initLp.push(Number(getCa('value')) / 10 ** 18)
            }
        }
    }

    return initLp[0]
}

async function getCAinTxns(txns: any) {
    var isLatest =  false;
    const createCAMethods = ['0x60806040', '0x61016060', '0x60a06040', '0x60c06040', '0x6b204fce', '0x6b033b2e', '0x6bdef376']
    for (let i = 0; i < txns?.result.length; i++) {
        if (txns?.result[i]?.input) {
            if (txns?.result[i]?.input.slice(0, 10) === '0x60806040'
                || txns?.result[i]?.input.slice(0, 10) === '0x61016060'
                || txns?.result[i]?.input.slice(0, 10) === '0x60a06040'
                || txns?.result[i]?.input.slice(0, 10) === '0x60c06040'
                || txns?.result[i]?.input.slice(0, 10) === '0x6b204fce'
                || txns?.result[i]?.input.slice(0, 10) === '0x6b033b2e'
                || txns?.result[i]?.input.slice(0, 10) === '0x6bdef376'
                && isLatest === false) {
                const createTxn = txns['result'][i];
                const getCa = (keyName: keyof typeof createTxn) => {
                    return createTxn[keyName]
                };
                isLatest = true;
                return getCa('contractAddress')
            } else if (txns?.result[i]?.input.slice(0, 10) === '0xf346c18d') {
                const createTxn = txns['result'][i];
                const getCa = (keyName: keyof typeof createTxn) => {
                    return createTxn[keyName]
                };
                const logs = await web3.eth.getTransactionReceipt(getCa('hash'))
                const caHex = logs['logs'][0]['topics']
                if (caHex) {
                    const caDec = '0x' + `${caHex[2].slice(26, caHex[2].length)}`
                    return caDec
                }
            }
        }
    }
}

export async function getPairAddress(contractAddress: string, deployerAddress: string) {
    var currentBlock: number;
    var firstITxnUniV2 : any;
    var firstITxnUniV3 : any;
    var firstITxnSushi : any;
    var firstITxnSB : any;

    try {
        currentBlock = await web3.eth.getBlockNumber().then(value => { return Number(value) });
    } catch(e) {
        throw Error('[utils.getPairAddress] Cannot get current block')
    }
    
    let pairAddressUniV2 = await getPairUniV2(contractAddress);

    try {
        if (pairAddressUniV2) {
            let firstITxnUniV2hash = await BaseScanAPI.getFirstInternalTxn(currentBlock, pairAddressUniV2);
            if (firstITxnUniV2hash) {
                firstITxnUniV2 = await web3.eth.getTransaction(firstITxnUniV2hash);
            }
        }
    } catch(e) {
        console.error(e)
        throw Error('[utils.getPairAddress] Cannot get first internal txn uniV2')
    }

    let pairAddressUniV3 = await getPairUniV3(contractAddress);
    
    try {
        if (pairAddressUniV3) {
            let firstITxnUniV3hash = await BaseScanAPI.getFirstInternalTxn(currentBlock, pairAddressUniV3);
            if (firstITxnUniV3hash) {
                firstITxnUniV3 = await web3.eth.getTransaction(firstITxnUniV3hash);
            }
        }
    } catch(e) {
        console.error(e)
        throw Error('[utils.getPairAddress] Cannot get first internal txn uniV3')
    }

    let pairAddressSushi = await getPairSushiV2(contractAddress);
    try {
        if (pairAddressSushi) {
            let firstITxnSushihash = await BaseScanAPI.getFirstInternalTxn(currentBlock, pairAddressSushi);
            if (firstITxnSushihash) {
                firstITxnSushi = await web3.eth.getTransaction(firstITxnSushihash);
            }
        }
    } catch(e) {
        console.error(e)
        throw Error('[utils.getPairAddress] Cannot get first internal txn sushi')
    }

    let pairAddressSB = await getPairSwapBasedv2(contractAddress);
    try {
        if (pairAddressSB) {
            let firstITxnSBhash = await BaseScanAPI.getFirstInternalTxn(currentBlock, pairAddressSB);
            if (firstITxnSBhash) {
                firstITxnSB = await web3.eth.getTransaction(firstITxnSBhash);
            }
        }
    } catch(e) {
        console.error(e)
        throw Error('[utils.getPairAddress] Cannot get first internal txn Swap based')
    }

    if (firstITxnUniV2) {
        let deployerPair = firstITxnUniV2['from'];
        if (deployerPair === deployerAddress) {
            return [pairAddressUniV2, 'UniSwapV2']
        }
    }
    else if (firstITxnUniV3) {
        let deployerPair = firstITxnUniV3['from'];
        if (deployerPair === deployerAddress) {
            return [pairAddressUniV3, 'UniSwapV3']
        } 
    } 
    else if (firstITxnSushi) {
        let deployerPair = firstITxnSushi['from'];
        if (deployerPair === deployerAddress) {
            return [pairAddressSushi, 'SushiSwapV2']
        } 
    }
    else if (firstITxnSB) {
        let deployerPair = firstITxnSB['from'];
        if (deployerPair === deployerAddress) {
            return [pairAddressSB, 'SwapBasedV2']
        }
    }
}

export async function getInitLPbyPair(contractAddress: string, deployerAddress: string) {
    const pairObject = await getPairAddress(contractAddress, deployerAddress);
    if (pairObject) {
        const pairAddress: string | undefined = pairObject[0];
        const exchange: string | undefined = pairObject[1];

        if (exchange === 'UniSwapV2' || exchange === 'SwapBasedV2') {
            let txnLogs = await getFirstReceiptPair(pairAddress);

            for (let i=0; i < txnLogs.length; i++) {
                let topics: any = txnLogs[i]?.topics;
                if (topics[0] === '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c'
                    && topics[1] === '0x000000000000000000000000aaa3b1f1bd7bcc97fd1917c18ade665c5d31f066'
                    || topics[1] === '0x0000000000000000000000004752ba5dbc23f44d87826276bf6fd6b1c372ad24')
                {
                    return (parseInt(String(txnLogs[i]?.data), 16)/10**18).toFixed(2)
                } 
            }
        } 
        if (exchange === 'UniSwapV3') {
            let txnLogs = await getFirstReceiptPair(pairAddress);

            for (let i=0; i < txnLogs.length; i++) {
                let topics: any = txnLogs[i]?.topics;
                if (topics[0] === '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c'
                    && topics[1] === '0x0000000000000000000000004752ba5dbc23f44d87826276bf6fd6b1c372ad24')
                {
                    return (parseInt(String(txnLogs[i]?.data), 16)/10**18).toFixed(2)
                }
            }
        } 
        if (exchange === 'SushiSwapV2') {
            let txnLogs = await getFirstReceiptPair(pairAddress);

            for (let i=0; i < txnLogs.length; i++) {
                let topics: any = txnLogs[i]?.topics;
                if (topics[0] === '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c'
                    && topics[1] === '0x0000000000000000000000006bded42c6da8fbf0d2ba55b2fa120c5e0c8d7891')
                {
                    return (parseInt(String(txnLogs[i]?.data), 16)/10**18).toFixed(2)
                }  
            }
        }
    }
}

export async function getInitLPbyDeployer(deployerAddress: string) {
    var resp: any;
    try {
        const currentBlock = await web3.eth.getBlockNumber().then(value => { return Number(value) });
        resp = await BaseScanAPI.getTxnbyAddress(currentBlock, deployerAddress);
    } catch (e) {
        console.error(e)
        throw Error('[utils.getInitLPbyDeployer] Cannot get txn by address')
    }
    
    let initLp = await filterAddLiquidityTxn(resp);

    return initLp
}

export async function getCAbyPair(pairAddress: string){
    const abi = [
        {
            "constant": true,
            "inputs": [],
            "name": "token0",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "token1",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        }
    ] as const;
    var token0: string;
    var token1: string;

    try {
        let contract = new web3.eth.Contract(abi, pairAddress);
        token0 = await contract.methods.token0().call();
        token1 = await contract.methods.token1().call();
    } catch(e) {
        console.error(e)
        throw Error(`[utils.getCAbyPair] Cannot get CA from pair address ${pairAddress}`)
    }

    if (token0 != '0x4200000000000000000000000000000000000006') {
        return token0
    } else {
        return token1
    }
}

export async function getExchange(pairAddress: string){
    const abi = [
        {
            "constant": true,
            "inputs": [],
            "name": "symbol",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        }
    ] as const;
    var symbol: string;

    try {
        let contract = new web3.eth.Contract(abi, pairAddress);
        symbol = await contract.methods.symbol().call();
    } catch(e) {
        console.error(e)
        throw Error('[utils.getExchange] Cannot get symbol from pair address')
    } 

    return symbol
}

export async function checkFactoryV3(pairAddress: string) {
    const abi = [
        {
            "inputs": [],
            "name": "factory",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ] as const;
    var factory: string;

    try{
        let contract = new web3.eth.Contract(abi, pairAddress);
        factory = await contract.methods.factory().call();
    } catch(e) {
        console.error(e)
        throw Error(`[utils.checkFactoryV3] Error while getting factory address of ${pairAddress}`)
    }

    if (factory == '0x33128a8fC17869897dcE68Ed026d694621f6FDfD') {
        return true
    } else {
        return false
    }
}

export async function getInfobyLockId(lockId: number) {
    const abi = [
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_lockId",
                    "type": "uint256"
                }
            ],
            "name": "getLock",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "lock_id",
                            "type": "uint256"
                        },
                        {
                            "internalType": "contract INonfungiblePositionManager",
                            "name": "nftPositionManager",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "pool",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "nft_id",
                            "type": "uint256"
                        },
                        {
                            "internalType": "address",
                            "name": "owner",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "pendingOwner",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "additionalCollector",
                            "type": "address"
                        },
                        {
                            "internalType": "address",
                            "name": "collectAddress",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "unlockDate",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint16",
                            "name": "countryCode",
                            "type": "uint16"
                        },
                        {
                            "internalType": "uint256",
                            "name": "ucf",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct IUNCX_LiquidityLocker_UniV3.Lock",
                    "name": "_lock",
                    "type": "tuple"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ] as const;
    var lockData: any;

    try {
        let contract = new web3.eth.Contract(abi, '0x231278eDd38B00B07fBd52120CEf685B9BaEBCC1');
        lockData = await contract.methods.getLock(lockId).call();
    } catch(e) {
        console.error(e)
        throw Error('[utils.getInfobyLockId] Cannot get lock data from UNCX uniV3')
    }

    return lockData
}

export async function getCAbyDeployer(deployerAddress: string) {
    var txns: any;
    try {
        const currentBlock = await web3.eth.getBlockNumber().then(value => { return Number(value) });
        txns = await BaseScanAPI.getTxnbyAddress(currentBlock, deployerAddress);
    } catch(e) {
        console.error(e)
        throw Error('[utils.getCAbyDeployer] Cannot get txns from deployer address')
    }
    let contractAddress = await getCAinTxns(txns);

    return contractAddress
}

export async function transferGwei2Eth(gwei: number) {
    var ethBalance: any;
    try {
        ethBalance = web3.utils.fromWei(gwei, 'ether');
    } catch(e) {
        console.error(e)
        throw Error('[utils.transferGwei2Eth] Cannot convert gwei to eth')
    }
    
    return Number(ethBalance)
}

export async function checkAbi(abi: string) {
    try {
        const _ = JSON.parse(abi)
        return true
    } catch (error) {
        console.log('Parse ABI error - ', abi)
        return false
    }
}

export async function getClog(contractAddress: string) {
    const abiBalanceof = [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ] as const;
    var clog: number;

    try{
        let contract = new web3.eth.Contract(abiBalanceof, contractAddress);
        clog = await contract.methods.balanceOf(contractAddress).call();
    } catch (e) {
        console.error(e)
        throw Error(`[utils.getClog] Cannot get Clog of contract ${contractAddress}`)
    }

    return clog
}