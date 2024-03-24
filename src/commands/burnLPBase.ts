import Web3, { Bytes } from 'web3';
import { ethers } from 'ethers';
import OM_ABI from '../JSON/Only_moons_ABI.json';
import * as dotenv from 'dotenv';
dotenv.config();
const web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ALCHEMY_ENDPOINT_BASE}`))
// const txHash = '0xb7b960e3269081870e0cc4984b362e8354e2fdeababb275a26a277b819433657';
// const txHash = '0x215a971ae7d6d18de7dcb13f2ff12d7e96cd763de1de1c00d217c8d77f7db349';
// const txHash = '0x795193da34128a9b81ab7c1cf3ee52f6f07e4341dc5cfc609ea7c6199ea6a312'; //Burn
// added LP, token name, token symbol, display holders, sticker, buy tax, sell tax, MC


async function getLpPercent(amountLpInt: number, lpAddress: any, deployer: string) {
    const currentBlock = web3.eth.getBlockNumber().then(value => { return Number(value) });
    const urlGetInitLp = `https://api.basescan.org/api?module=account&action=tokentx&contractaddress=${lpAddress}&address=${deployer}&page=1&offset=100&startblock=0&endblock=${currentBlock}&sort=asc&apikey=${process.env.API_BASESCAN_KEY3}`
    let lpPercent = await fetch(urlGetInitLp).then(
        response => response.json()
    ).then(
        async data => {
            const initLp: number = Number(data['result'][0]['value']);
            const lpPerc = Number(amountLpInt) / initLp * 100;
            return lpPerc
        }
    )
    return lpPercent
}

async function getCAbyDeployer(deployer: string) {
    const currentBlock = web3.eth.getBlockNumber().then(value => { return Number(value) });
    const urlGetCA = `https://api.basescan.org/api?module=account&action=txlist&address=${deployer}&page=1&offset=50&startblock=0&endblock=${currentBlock}&sort=desc&apikey=${process.env.API_BASESCAN_KEY3}`
    let isRenounced = false;

    const CA = await fetch(urlGetCA).then(
        response => response.json()
    ).then(async response => {
        let isLatest = false;
        for (let i = 0; i < response['result'].length; i++) {
            if (response['result'][i]['input']) {
                if (response['result'][i]['input'].slice(0, 10) === '0x60806040'
                    || response['result'][i]['input'].slice(0, 10) === '0x61016060'
                    || response['result'][i]['input'].slice(0, 10) === '0x60a06040'
                    || response['result'][i]['input'].slice(0, 10) === '0x60c06040'
                    || response['result'][i]['input'].slice(0, 10) === '0x6b204fce'
                    || response['result'][i]['input'].slice(0, 10) === '0x6b033b2e'
                    && isLatest === false) {
                    const createTxn = response['result'][i];
                    const getCa = (keyName: keyof typeof createTxn) => {
                        return createTxn[keyName]
                    };
                    isLatest = true;
                    return getCa('contractAddress')
                } else if (response['result'][i]['input'].slice(0, 10) === '0xf346c18d') {
                    const createTxn = response['result'][i];
                    const getCa = (keyName: keyof typeof createTxn) => {
                        return createTxn[keyName]
                    };
                    const logs = await web3.eth.getTransactionReceipt(getCa('hash'))
                    const caHex = logs['logs'][0]['topics']
                    if (caHex) {
                        const caDec = '0x' + `${caHex[2].slice(26, caHex[2].length)}`
                        return caDec
                    }
                } else if (response['result'][i]['input'].slice(0, 10) === '0x715018a6') {
                    isRenounced = true;
                }
            }
        }
    })

    return [CA, isRenounced]
}

async function getTotalHolders(CA: any) {
    const requestHeaders: HeadersInit = new Headers();
    requestHeaders.set('accept', 'application/json');
    requestHeaders.set('x-api-key', `${process.env.CHAINBASE_API_KEY}`);
    const chainId = await web3.eth.getChainId().then(value => { return Number(value) });
    // console.log('Connected chain: ', chainId);
    const totalHolders = await fetch(`https://api.chainbase.online/v1/token/holders?chain_id=${chainId}&contract_address=${CA}&page=1&limit=20`, {
        method: 'GET',
        headers: requestHeaders
    }).then(response => response.json())
        .then(data => {
            return data.count
        })
        .catch(error => console.error(error));

    return totalHolders
}

async function getInitialLp(CA: any, deployer: string, lpAddress: any) {
    const currentBlock = await web3.eth.getBlockNumber().then(value => { return Number(value) });
    const UrlGetRouterAddress = `https://api.basescan.org/api?module=account&action=tokentx&fromBlock=0&toBlock=${currentBlock}&
    contractAddress=${CA}&address=${CA}&page=1&offset=100&apikey=${process.env.API_BASESCAN_KEY3}`

    let routerAddress = await fetch(UrlGetRouterAddress).then(
        response => response.json()
    ).then(
        async data => {
            var address = [];
            for (let i = 0; i < data['result'].length; i++) {
                let eachInfo = data['result'][i];
                if (eachInfo['from'] === CA.toLowerCase() 
                    && eachInfo['to'] !== '0x000000000000000000000000000000000000dead') {
                    address.push(eachInfo['to'])
                }
            }
            return address[address.length - 1]
        }
    );

    if (routerAddress) {
        //uniswap
        const UrlInitLp = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=0&toBlock=${currentBlock}&address=0x4200000000000000000000000000000000000006&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef&topic0_1_opr=and&topic1=0x0000000000000000000000004752ba5dbc23f44d87826276bf6fd6b1c372ad24&topic0_2_opr=and&topic2=0x000000000000000000000000${routerAddress.slice(2, routerAddress.length)}&page=1&offset=100&apikey=${process.env.API_BASESCAN_KEY3}`

        let initLP = await fetch(UrlInitLp).then(
            response => response.json()
        ).then(
            async data => {
                if (data['result'][0]) {
                    return parseInt(data['result'][0]['data'], 16) / 10 ** 18
                }
            }
        );

        if (initLP === undefined) {
            //sushiswap
            const UrlInitLp = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=0&toBlock=${currentBlock}&address=0x4200000000000000000000000000000000000006&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef&topic0_1_opr=and&topic1=0x0000000000000000000000006BDED42c6DA8FBf0d2bA55B2fa120C5e0c8D7891&topic0_2_opr=and&topic2=0x000000000000000000000000${routerAddress.slice(2, routerAddress.length)}&page=1&offset=100&apikey=${process.env.API_BASESCAN_KEY3}`

            initLP = await fetch(UrlInitLp).then(
                response => response.json()
            ).then(
                async data => {
                    if (data['result'][0]) {
                        return parseInt(data['result'][0]['data'], 16) / 10 ** 18
                    }
                }
            );
        }

        if (initLP === undefined) {
            const urlGetLiquidity = `https://api.basescan.org/api?module=account&action=txlist&address=${deployer}&page=1&offset=50&startblock=0&endblock=${currentBlock}&sort=desc&apikey=${process.env.API_BASESCAN_KEY3}`

            initLP = await fetch(urlGetLiquidity).then(
                response => response.json()
            ).then(response => {
                let isLatest = false;
                let initLpTemp = [];
                for (let i = 0; i < response['result'].length; i++) {
                    if (response['result'][i]['input']) {
                        if (response['result'][i]['input'].slice(0, 10) === '0xf305d719'
                            ||response['result'][i]['input'].slice(0, 10) === '0xe8e33700'
                            || response['result'][i]['input'].slice(0, 10) === '0x51c6590a'
                            && response['result'][i]['to'] === CA
                            && isLatest === false) {
                            const createTxn = response['result'][i];
                            const getCa = (keyName: keyof typeof createTxn) => {
                                return createTxn[keyName]
                            };
                            isLatest = true;
                            initLpTemp.push(Number(getCa('value')) / 10**18)
                        }
                    }
                }

                return initLpTemp[0]
            })
        }

        return initLP
    } else {
        const urlGetLiquidity = `https://api.basescan.org/api?module=account&action=txlist&address=${deployer}&page=1&offset=50&startblock=0&endblock=${currentBlock}&sort=desc&apikey=${process.env.API_BASESCAN_KEY3}`

        let initLp = await fetch(urlGetLiquidity).then(
            response => response.json()
        ).then(response => {
            let isLatest = false;
            let initLpTemp = [];
            for (let i = 0; i < response['result'].length; i++) {
                if (response['result'][i]['input']) {
                    if (response['result'][i]['input'].slice(0, 10) === '0xf305d719'
                        || response['result'][i]['input'].slice(0, 10) === '0xe8e33700'
                        || response['result'][i]['input'].slice(0, 10) === '0x51c6590a'
                        && isLatest === false) {
                        const createTxn = response['result'][i];
                        const getCa = (keyName: keyof typeof createTxn) => {
                            return createTxn[keyName]
                        };
                        isLatest = true;
                        initLpTemp.push(Number(getCa('value')) / 10**18)
                    }
                }
            }
            return initLpTemp[0]
        })

        if (initLp === 0 || initLp === undefined) {
            const UrlInitLp = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=0&toBlock=${currentBlock}&address=0x4200000000000000000000000000000000000006&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef&topic0_1_opr=and&topic1=0x000000000000000000000000${deployer.slice(2, deployer.length)}&topic0_2_opr=and&topic2=0x000000000000000000000000${lpAddress.slice(2, lpAddress.length)}&page=1&offset=100&apikey=${process.env.API_BASESCAN_KEY3}`

            initLp = await fetch(UrlInitLp).then(
                response => response.json()
            ).then(
                async data => {
                    if (data['result'][0]) {
                        return parseInt(data['result'][0]['data'], 16) / 10 ** 18
                    } else {
                        return 0.1
                    }
                }
            );
        }

        return initLp
    }
}

async function getTopHolders(deployer: string, CA: any, n: number) {
    const requestHeaders: HeadersInit = new Headers();
    requestHeaders.set('accept', 'application/json');
    requestHeaders.set('x-api-key', `${process.env.CHAINBASE_API_KEY}`);
    const chainId = await web3.eth.getChainId().then(value => { return Number(value) });
    // console.log('Connected chain: ', chainId);
    const holderAddress = await fetch(`https://api.chainbase.online/v1/token/top-holders?chain_id=${chainId}&contract_address=${CA}&page=1&limit=20`, {
        method: 'GET',
        headers: requestHeaders
    }).then(response => response.json())
        .then(async data => {
            return await data.data
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
    if (holderAddress) {
        let holderLimit = holderAddress.length;
        if (n < holderAddress.length) {
            holderLimit = n
        }
        for (let i = 0; i < holderLimit; i++) {
            if (holderAddress[i]['wallet_address'] === deployer) {
                let balance = holderAddress[i]['original_amount'];
                holdersBalance[holderAddress[i]['wallet_address']] = `Creator - ${(Number(balance) / Number(totalSupply) * 100).toFixed(2)}`
            } else if (holderAddress[i]['wallet_address'] !== '0x000000000000000000000000000000000000dead') {
                let balance = holderAddress[i]['original_amount'];
                holdersBalance[holderAddress[i]['wallet_address']] = (Number(balance) / Number(totalSupply) * 100).toFixed(2);
            }
        }
        let clog = await contract.methods.balanceOf(CA).call();
        let clogPerc = (Number(clog) / Number(totalSupply) * 100).toFixed(2);
        if (Number(clogPerc) > 100) {
            clogPerc = 'Infinity'
        }

        return [holdersBalance, clogPerc]
    } else {
        try {
            return await getTopHolders(deployer, CA, n)
        } catch (error) {
            console.log('Cannot retrive holder data')
            console.log(error)
        } finally {
            let clog = await contract.methods.balanceOf(CA).call();
            let clogPerc = (Number(clog) / Number(totalSupply) * 100).toFixed(2);
            if (Number(clogPerc) > 100) {
                clogPerc = 'Infinity'
            }

            return [{'Updating': -1}, clogPerc]
        }
    }
}

async function getCAbyTxLock(txHash: string, lpAddress: string, deployer: string) {
    const txReceipt = await web3.eth.getTransactionReceipt(txHash);
    let needTopic = [];
    if (txReceipt['logs'][txReceipt['logs'].length-1]){
        let topics = txReceipt['logs'][txReceipt['logs'].length-1]['topics'];
        if (topics){
            for (let i=0; i < 4; i++) {
                if (String(topics[i]) !== '0x531cba00a411ade37b4ca8175d92c94149f19536bd8e5a83d581aa7f040d192e'
                && String(topics[i]) !== '0x0000000000000000000000004200000000000000000000000000000000000006'
                && String(topics[i]) !== `0x000000000000000000000000${lpAddress.slice(2, lpAddress.length).toLowerCase()}`
                && String(topics[i]) !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
                    needTopic.push(topics[i])
                }
            }
        }
    }

    const currentBlock = web3.eth.getBlockNumber().then(value => { return Number(value) });
    const urlGetRenoun = `https://api.basescan.org/api?module=account&action=txlist&address=${deployer}&page=1&offset=50&startblock=0&endblock=${currentBlock}&sort=desc&apikey=${process.env.API_BASESCAN_KEY3}`
    let isRenounced = false;

    await fetch(urlGetRenoun).then(
        response => response.json()
    ).then(async response => {
        let isLatest = false;
        for (let i = 0; i < response['result'].length; i++) {
            if (response['result'][i]['input']) {
                if (response['result'][i]['input'].slice(0, 10) === '0x715018a6') {
                    isRenounced = true;
                }
            }
        }
    })

    if (needTopic.length !== 0) {
        return ['0x' + `${needTopic[0].slice(26, needTopic[0].length)}`, isRenounced]
    } else {
        return [undefined, isRenounced]
    }
}

export async function getBurnTx(txHash: Bytes) {
    const txData = await web3.eth.getTransaction(txHash);
    const txInput = txData['input'].toString();

    if (txInput.slice(0, 10) === '0xa9059cbb') {
        console.log('Burn tx', txHash)
        const deployer = txData['from'].toString();
        const txReceipt = await web3.eth.getTransactionReceipt(txHash);
        const lpAddress = txReceipt['logs'][0]['address'];
        const amountLpBurnHex = txReceipt['logs'][0]['data'];
        const amountLpBurnInt = parseInt(String(amountLpBurnHex), 16);
        const burnPercent = await getLpPercent(amountLpBurnInt, lpAddress, deployer)
        console.log('Burn Perc: ', burnPercent)
        const CA_renou = await getCAbyDeployer(deployer);
        console.log('CA: ', CA_renou[0])
        if (CA_renou[0]) {
            const totalHolders = await getTotalHolders(CA_renou[0]);
            console.log('Total Holders: ', totalHolders)
            const holders_clog = await getTopHolders(deployer, CA_renou[0], 10);
            console.log('Holders: ', holders_clog[0])
            const initLp = await getInitialLp(CA_renou[0], deployer, lpAddress);
            console.log('LP: ', initLp)
            const holdersBalance = holders_clog[0]
            const clog = holders_clog[1]

            return [CA_renou[0], burnPercent, totalHolders, holdersBalance, clog, CA_renou[1], initLp]
        } else {
            console.log(`${deployer} is not an owner!!!`)
        }
    }
}

export async function getLockInfoMoon(txHash: any) {
    console.log('Lock tx: ', txHash)
    const txData = await web3.eth.getTransaction(txHash);
    const deployer = txData['from'].toString();
    const txInput = txData['input'].toString();

    const inter = new ethers.Interface(OM_ABI);
    const value = ethers.parseEther("1.0");
    const decodedInput = inter.parseTransaction({ data: txInput, value });

    if (decodedInput) {
        const lpAddress = decodedInput['args'][0];
        const lockAmount = decodedInput['args'][1];
        const unlockTimestamp = Number(decodedInput['args'][2]);
        let current = new Date();
        let date = current.getFullYear() + '-' + ('0' + (current.getMonth() + 1)).slice(-2) + '-' + ('0' + current.getDate()).slice(-2);
        let time = current.getHours() + ":00:00";
        let currentTime = Date.parse(date + 'T' + time);

        let lockDays = ((unlockTimestamp - Number(currentTime) / 1000) / (60 * 60 * 24)).toFixed(2);
        console.log('Lock days: ', lockDays)
        const lockPercent = await getLpPercent(lockAmount, lpAddress, deployer)
        console.log('Lock Percent: ', lockPercent)
        let CA_renou = await getCAbyTxLock(txHash, lpAddress, deployer)
        if (CA_renou[0] === undefined){
            CA_renou = await getCAbyDeployer(deployer);
        }
        console.log('CA: ', CA_renou[0])
        if (CA_renou[0]) {
            const totalHolders = await getTotalHolders(CA_renou[0]);
            console.log('Total Holders: ', totalHolders)
            const holders_clog = await getTopHolders(deployer, CA_renou[0], 10);
            console.log('Holders: ', holders_clog[0])
            const initLp = await getInitialLp(CA_renou[0], deployer, lpAddress);
            console.log('LP: ', initLp)
            const holdersBalance = holders_clog[0]
            const clog = holders_clog[1]

            return [CA_renou[0], lockDays, lockPercent, totalHolders, holdersBalance, clog, CA_renou[1], initLp]
        }
    }
}

// const txHash = '0xacd3a1c44da8342f3f9b9f90c15b7a20e168284e1603c78400ed68d3468cb317';
// getBurnTx(txHash)
// getLockInfoMoon(txHash)

//uniswap base address: 0x28AD36f1869d4c1Cc90083059d95C76C6b10A01e
//uni router v2: 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24
//pnacake router: 0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb

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


