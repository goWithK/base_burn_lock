import Web3, { Bytes, eth } from 'web3';
import { ethers, lock } from 'ethers';
import { BaseScanAPI } from "../apis/basescan.api";
import * as dotenv from 'dotenv';
dotenv.config();

const web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ALCHEMY_ENDPOINT_BASE_DEV}`))

export const convertSeconds = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
  
    return `${hours}h : ${minutes}m`
}

async function getPairSushiV2(contractAddress: string) {
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
    let contract = new web3.eth.Contract(abiGetPair, '0x71524B4f93c58fcbF659783284E38825f0622859');
    let pairAddress = await contract.methods.getPair(contractAddress, '0x4200000000000000000000000000000000000006').call();

    if (pairAddress === '0x0000000000000000000000000000000000000000') {
        return undefined
    } else {
        return pairAddress
    }
}

async function getPairUniV3(contractAddress: string) {
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
    let contract = new web3.eth.Contract(abiGetPair, '0x33128a8fC17869897dcE68Ed026d694621f6FDfD');
    let pairAddress = await contract.methods.getPool(contractAddress, '0x4200000000000000000000000000000000000006', 100).call();
    
    if (pairAddress === '0x0000000000000000000000000000000000000000') {
        return undefined
    } else {
        return pairAddress
    }
}

async function getPairUniV2(contractAddress: string) {
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
    let contract = new web3.eth.Contract(abiGetPair, '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6');
    let pairAddress = await contract.methods.getPair(contractAddress, '0x4200000000000000000000000000000000000006').call();

    if (pairAddress === '0x0000000000000000000000000000000000000000') {
        return undefined
    } else {
        return pairAddress
    }
}

async function getPairSwapBasedv2(contractAddress: string) {
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
    let contract = new web3.eth.Contract(abiGetPair, '0x04C9f118d21e8B767D2e50C946f0cC9F6C367300');
    let pairAddress = await contract.methods.getPair(contractAddress, '0x4200000000000000000000000000000000000006').call();

    if (pairAddress === '0x0000000000000000000000000000000000000000') {
        return undefined
    } else {
        return pairAddress
    }
}

async function getFirstReceiptPair(pairAddress: any) {
    const currentBlock = await web3.eth.getBlockNumber().then(value => { return Number(value) });
    const txHash = await BaseScanAPI.getFirstInternalTxn(currentBlock, pairAddress);
    const txReceipt = await web3.eth.getTransactionReceipt(txHash);
    
    return txReceipt['logs']
}

async function filterAddLiquidityTxn(txns: any) {
    let isLatest = false;
    let initLp: any = [];
    for (let i = 0; i < txns['result'].length; i++) {
        if (txns['result'][i]['input']) {
            if (txns['result'][i]['input'].slice(0, 10) === '0xf305d719'
                || txns['result'][i]['input'].slice(0, 10) === '0xe8e33700'
                || txns['result'][i]['input'].slice(0, 10) === '0x51c6590a'
                || txns['result'][i]['input'].slice(0, 10) === '0xac9650d8'
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

export async function getPairAddress(contractAddress: string, deployerAddress: string) {
    const currentBlock = await web3.eth.getBlockNumber().then(value => { return Number(value) });
    let pairAddressUniV2 = await getPairUniV2(contractAddress);
    let firstITxnUniV2hash = await BaseScanAPI.getFirstInternalTxn(currentBlock, pairAddressUniV2);
    let firstITxnUniV2 : any;
    if (firstITxnUniV2hash) {
        firstITxnUniV2 = await web3.eth.getTransaction(firstITxnUniV2hash);
    }

    let pairAddressUniV3 = await getPairUniV3(contractAddress);
    let firstITxnUniV3hash = await BaseScanAPI.getFirstInternalTxn(currentBlock, pairAddressUniV3);
    let firstITxnUniV3 : any;
    if (firstITxnUniV3hash) {
        firstITxnUniV3 = await web3.eth.getTransaction(firstITxnUniV3hash);
    }

    let pairAddressSushi = await getPairSushiV2(contractAddress);
    let firstITxnSushihash = await BaseScanAPI.getFirstInternalTxn(currentBlock, pairAddressSushi);
    let firstITxnSushi : any;
    if (firstITxnSushihash) {
        firstITxnSushi = await web3.eth.getTransaction(firstITxnSushihash);
    }

    let pairAddressSB = await getPairSwapBasedv2(contractAddress);
    let firstITxnSBhash = await BaseScanAPI.getFirstInternalTxn(currentBlock, pairAddressSB);
    let firstITxnSB : any;
    if (firstITxnSBhash) {
        firstITxnSB = await web3.eth.getTransaction(firstITxnSBhash);
    }

    if (firstITxnUniV2) {
        let deployerPair = firstITxnUniV2['from'];
        if (deployerPair === deployerAddress) {
            return [pairAddressUniV2, 'UniSwapV2']
        } 
    }
    if (firstITxnUniV3) {
        let deployerPair = firstITxnUniV3['from'];
        if (deployerPair === deployerAddress) {
            return [pairAddressUniV3, 'UniSwapV3']
        } 
    } 
    if (firstITxnSushi) {
        let deployerPair = firstITxnSushi['from'];
        if (deployerPair === deployerAddress) {
            return [pairAddressSushi, 'SushiSwapV2']
        } 
    }
    if (firstITxnSB) {
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
                let topics: any = txnLogs[i]['topics'];
                if (topics[0] === '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c'
                    && topics[1] === '0x000000000000000000000000aaa3b1f1bd7bcc97fd1917c18ade665c5d31f066'
                    || topics[1] === '0x0000000000000000000000004752ba5dbc23f44d87826276bf6fd6b1c372ad24')
                {
                    return (parseInt(String(txnLogs[i]['data']), 16)/10**18).toFixed(2)
                } 
            }
        } 
        if (exchange === 'UniSwapV3') {
            let txnLogs = await getFirstReceiptPair(pairAddress);

            for (let i=0; i < txnLogs.length; i++) {
                let topics: any = txnLogs[i]['topics'];
                if (topics[0] === '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c'
                    && topics[1] === '0x0000000000000000000000004752ba5dbc23f44d87826276bf6fd6b1c372ad24')
                {
                    return (parseInt(String(txnLogs[i]['data']), 16)/10**18).toFixed(2)
                }
            }
        } 
        if (exchange === 'SushiSwapV2') {
            let txnLogs = await getFirstReceiptPair(pairAddress);

            for (let i=0; i < txnLogs.length; i++) {
                let topics: any = txnLogs[i]['topics'];
                if (topics[0] === '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c'
                    && topics[1] === '0x0000000000000000000000006bded42c6da8fbf0d2ba55b2fa120c5e0c8d7891')
                {
                    return (parseInt(String(txnLogs[i]['data']), 16)/10**18).toFixed(2)
                }  
            }
        }
    }
}

export async function getInitLPbyDeployer(deployerAddress: string) {
    const currentBlock = await web3.eth.getBlockNumber().then(value => { return Number(value) });
    const resp = await BaseScanAPI.getTxnbyAddress(currentBlock, deployerAddress);
    let initLp = await filterAddLiquidityTxn(resp);

    return initLp
}