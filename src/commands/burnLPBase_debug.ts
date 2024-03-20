import Web3, { Bytes } from 'web3';
import {ethers} from 'ethers';
import UNCX_ABI from '../JSON/UNCX_ABI.json';
import * as dotenv from 'dotenv';
dotenv.config();
const web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ALCHEMY_ENDPOINT}`))
const etherProv = ethers.getDefaultProvider('mainnet');
// const txHash = '0xb7b960e3269081870e0cc4984b362e8354e2fdeababb275a26a277b819433657';
// const txHash = '0x215a971ae7d6d18de7dcb13f2ff12d7e96cd763de1de1c00d217c8d77f7db349';
// const txHash = '0x795193da34128a9b81ab7c1cf3ee52f6f07e4341dc5cfc609ea7c6199ea6a312'; //Burn

async function getLpPercent(amountLpInt: number, lpAddress: any, deployer: string) {
    const urlGetInitLp = `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${lpAddress}&address=${deployer}&page=1&offset=100&startblock=latest&endblock=latest&sort=asc&apikey=${process.env.API_ETHERSCAN_KEY}`
    let lpPercent = await fetch(urlGetInitLp).then(
        response => response.json()
    ).then(
        async data => {
            const initLp = data['result'][0]['value'];
            return amountLpInt / initLp * 100;
        }
    )
    return lpPercent
}

async function getCAbyDeployer(deployer: string){
    const currentBlock = web3.eth.getBlockNumber().then(value => { return Number(value) });
    const urlGetCA = `https://api.etherscan.io/api?module=account&action=tokentx&address=${deployer}&page=1&offset=200&startblock=0&endblock=${currentBlock}&sort=asc&apikey=${process.env.API_ETHERSCAN_KEY}`

    const CA = await fetch(urlGetCA).then(
        response => response.json()
    ).then(response => {
        const txns = response['result'][response['result'].length - 1];
        const getCa = (keyName: keyof typeof txns) => {
            return txns[keyName]
        };
        return getCa('contractAddress')
    })
    
    return CA
}

async function getTopHolders(CA: string, n: number) {
    const requestHeaders: HeadersInit = new Headers();
    requestHeaders.set('accept', 'application/json');
    requestHeaders.set('x-api-key', `${process.env.CHAINBASE_API_KEY}`);
    const chainId = await web3.eth.getChainId().then(value => {return Number(value)});
    console.log('Connected chain: ', chainId);
    const holderAddress = await fetch(`https://api.chainbase.online/v1/token/holders?chain_id=${chainId}&contract_address=${CA}&page=1&limit=${n}`, {
        method: 'GET',
        headers: requestHeaders
    }).then(response => response.json())
    .then(data => {
        return data.data
    })
    .catch(error => console.error(error));

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
        },
        {
            "inputs": [],
            "name": "totalSupply",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "pure",
            "type": "function"
        }
    ] as const;
    let contract = new web3.eth.Contract(abiBalanceof, CA);
    let totalSupply = await contract.methods.totalSupply().call();
    let holdersBalance: any = {};
    for (let i = 0; i < holderAddress.length; i++) {
        let balance = await contract.methods.balanceOf(holderAddress[i]).call();
        holdersBalance[holderAddress[i]] = Number(balance)/Number(totalSupply)*100;
    }

    return holdersBalance
}

async function getBurnTx(txHash: Bytes) {
    const txData = await web3.eth.getTransaction(txHash);
    const txInput = txData['input'].toString();
    
    if (txInput.slice(0, 10) === '0xa9059cbb') {
        console.log(txHash)
        const deployer = txData['from'].toString();
        const txReceipt = await web3.eth.getTransactionReceipt(txHash);
        const lpAddress = txReceipt['logs'][0]['address'];
        const amountLpBurnHex = txReceipt['logs'][0]['data'];
        const amountLpBurnInt = parseInt(String(amountLpBurnHex), 16);
        const burnPercent = await getLpPercent(amountLpBurnInt, lpAddress, deployer)
        const CA = await getCAbyDeployer(deployer);
        const holdersBalance = await getTopHolders(CA, 10)
        console.log('CA: ', CA)
        console.log('Deployer: ', deployer)

        return [CA, burnPercent, holdersBalance]
    }
}

async function getLockInfoUNCX(txHash: any) {
    const txData = await web3.eth.getTransaction(txHash);
    const deployer = txData['from'].toString();
    const txInput = txData['input'].toString();
    const inter = new ethers.Interface(UNCX_ABI);
    const value = ethers.parseEther("1.0");
    const decodedInput = inter.parseTransaction({ data: txInput, value});

    if (decodedInput) {
        const lpAddress = decodedInput['args'][0];
        const lockAmount = decodedInput['args'][1];
        const unlockTimestamp = Number(decodedInput['args'][2]);
        let current = new Date();
        let date = current.getFullYear()+'-'+('0' + (current.getMonth()+1)).slice(-2)+'-'+('0' + current.getDate()).slice(-2) ;
        let time = current.getHours() + ":00:00";
        let currentTime = Date.parse(date+'T'+time);

        let lockDays = (unlockTimestamp-currentTime/1000) / (60 * 60 * 24);
        const lockPercent = await getLpPercent(lockAmount, lpAddress, deployer)
        const CA = await getCAbyDeployer(deployer);
        const holdersBalance = await getTopHolders(CA, 10)
        
        return [CA, lockDays, lockPercent, holdersBalance]
    }
}

const UrlTransferBurn = `https://api.etherscan.io/api?module=logs&action=getLogs&&fromBlock=latest&toBlock=latest&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef&topic0_2_opr=and&topic2=0x000000000000000000000000000000000000000000000000000000000000dead&page=1&offset=100&apikey=${process.env.API_ETHERSCAN_KEY}`
const UrlLockTokenPink = `https://api.etherscan.io/api?module=logs&action=getLogs&&fromBlock=latest&toBlock=latest&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef&topic0_2_opr=and&topic2=0x00000000000000000000000071b5759d73262fbb223956913ecf4ecc51057641&page=1&offset=100&apikey=${process.env.API_ETHERSCAN_KEY2}`
const UrlLockTokenUNCX = `https://api.etherscan.io/api?module=logs&action=getLogs&&fromBlock=latest&toBlock=latest&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef&topic0_2_opr=and&topic2=0x000000000000000000000000663A5C229c09b049E36dCc11a9B0d4a8Eb9db214&page=1&offset=100&apikey=${process.env.API_ETHERSCAN_KEY3}`
// const UrlLockTokenTrust = `https://api.etherscan.io/api?module=logs&action=getLogs&&fromBlock=latest&toBlock=latest&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef&topic0_2_opr=and&topic2=0x000000000000000000000000E2fE530C047f2d85298b07D9333C05737f1435fB&page=1&offset=100&apikey=${process.env.API_ETHERSCAN_KEY}`

// var fetchNow = function(trueOrFalse: boolean) {
//     try {
//         if(trueOrFalse) {
//             fetch(UrlTransferBurn).then(
//                 response => response.json()
//             ).then(
//                 async data => {
//                     if (data['result'].length > 0) {
//                         console.log('burn', data)
//                         let output = data['result'].forEach(async (item: any) => {
//                             const txHash = item['transactionHash'];
//                             return await getBurnTx(txHash)
//                         })
//                         return 0
//                     }
//                 } 
//             );
//             fetch(UrlLockTokenPink).then(
//                 response => response.json()
//             ).then(
//                 async data => {
//                     if (data['result'].length > 0) {
//                         console.log('Lock pink: ', data)
//                         // let output = data['result'].forEach(async (item: any) => {
//                         //     const txHash = item['transactionHash'];
//                         //     return await getBurnTx(txHash)
//                         // })   
//                     }
//                 } 
//             );
//             fetch(UrlLockTokenUNCX).then(
//                 response => response.json()
//             ).then(
//                 async data => {
//                     if (data['result'].length > 0) {
//                         console.log('Lock UNCX: ', data)
//                         // let output = data['result'].forEach(async (item: any) => {
//                         //     const txHash = item['transactionHash'];
//                         //     return await getBurnTx(txHash)
//                         // })    
//                     }
//                     fetchNow(trueOrFalse);
//                 }
//             );
//             fetch(UrlLockTokenTrust).then(
//                 response => response.json()
//             ).then(
//                 async data => {
//                     console.log('Lock Trust: ', data)
//                     // let output = data['result'].forEach(async (item: any) => {
//                     //     const txHash = item['transactionHash'];
//                     //     return await getBurnTx(txHash)
//                     // })
//                     fetchNow(trueOrFalse);     
//                 } 
//             );
//         }
        
//     } catch (error) {
//         console.log(error)
//     }
// }
// fetchNow(true)

//lock wallet trustswap: 0xE2fE530C047f2d85298b07D9333C05737f1435fB
//lock wallet pinksale: 0x71B5759d73262FBb223956913ecF4ecC51057641 
//lock wallet uncx: 0x663A5C229c09b049E36dCc11a9B0d4a8Eb9db214
//lock wallet onlymoons: 0x77110f67C0EF3c98c43570BADe06046eF6549876
//burn
// get txn in Token transfer of creator which send token to 0x000000000000000000000000000000000000dEaD
// compare với value được nhận khi opentrading -> % burn
// Lấy list top holders
// Lấy MC hiện tại
// Lấy Liquidity hiện tại


