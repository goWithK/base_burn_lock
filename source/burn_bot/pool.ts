// Store & Provide data to Message

import Web3 from "web3";
import { ethers } from 'ethers';
import { BaseScanAPI } from "../shared/apis/basescan.api";
import { ChainBaseAPI } from "../shared/apis/chainbase.api";
import { DexScreenerAPI } from "../shared/apis/dexscreener.api";
import { 
    convertSeconds,
    getInitLPbyPair, 
    getInitLPbyDeployer,
    getExchange,
    getCAbyPair,
    checkFactoryV3,
    getCAbyDeployer,
    transferGwei2Eth,
    checkAbi,
    getClog,
    getPairSwapBasedv2,
    getPairSushiV2,
    getPairUniV2, 
    getPairUniV3
} from "../shared/helpers/utils"

export class DataPool {

    private _web3;

    private _transactionHash: string;
    private _deployerAddress: string;
    private _pairAddress: string;
    private _contractAddress: string;
    private _exchange: string;
    private _burnAmount: number;
    private _burnPercent: number;
    private _tokenName: string;
    private _tokenSymbol: string;
    private _tokenDecimal: number;
    private _tokenTotalSupply: number;
    private _totalHolders: number;
    private _holderBalance: object;
    private _liquidity: number;
    private _initLp: number;
    private _totalTxns: number;
    private _priceToken: number;
    private _liveTime: string;
    private _marketCapBurn: number;
    private _isRenounced: boolean;
    private _deployerBalance: number;
    private _clog: string;
    private _isVerified: boolean;
    private _dexData: any;

    public constructor(transactionHash: string) {

        this._web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ALCHEMY_ENDPOINT_BASE}`))

        this._transactionHash = transactionHash;
    }

    public get renounced(): Promise<boolean> {
        return (async () => {
            if (this._isRenounced) {
                return this._isRenounced;
            }

            if (!(await this.deployerAddress)) {
                console.error('[DataPool] Cannot get CARenounce by missing Deployer');
            }

            this._isRenounced = false;
            var resp: any;

            try {
                const currentBlock = await this._web3.eth.getBlockNumber().then(value => { return Number(value) });
                resp = await BaseScanAPI.getTxnbyAddress(currentBlock, await this.deployerAddress);
            } catch(e) {
                console.error(e)
                throw Error(`[pool.renounced] Error when get transaction by address: ${await this.deployerAddress}`)
            }
            
            var isLatest = false;
            for (let i = 0; i < resp?.result.length; i++) {
                if (!resp?.result[i]?.input || resp?.result[i]?.input == '') {
                    continue;
                }
                
                if (resp?.result[i]?.input.slice(0, 10) === '0x715018a6') {
                    this._isRenounced = true;
                    isLatest = true;
                }
            }

            return this._isRenounced;
        })();
    }

    public get pairAddress(): Promise<string> {
        return (async () => {
            if (this._pairAddress) {
                console.log('Pair: ', this._pairAddress)
                return this._pairAddress
            }

            await this._fulFillTransactionData();
            console.log('Pair: ', this._pairAddress)
            return this._pairAddress
        })();
    }

    public get deployerAddress(): Promise<string> {
        return (async () => {
            if (this._deployerAddress) {
                return this._deployerAddress
            }

            await this._fulFillTransactionData();
            console.log('Deployer: ', this._deployerAddress)
            return this._deployerAddress
        })();
    }

    public get exchange(): Promise<string> {
        return (async () => {
            if (this._exchange){
                return this._exchange
            }

            try {
                this._exchange = await getExchange(await this.pairAddress);
            } catch (error) {
                console.log(error)
                let isV3 = await checkFactoryV3(await this.pairAddress);
                if (isV3) {
                    this._exchange= 'UNI-V3'
                } else {
                    this._exchange = 'Unknown'
                }
            }

            return this._exchange
        })();
    }

    public get contractAddress(): Promise<string> {
        return (async () => {
            if (this._contractAddress) {
                return this._contractAddress
            }

            if (await this.exchange != 'Unknown'){
                this._contractAddress = await getCAbyPair(await this.pairAddress);
            } else {
                this._contractAddress = await getCAbyDeployer(await this.deployerAddress)
            }
            console.log('Contract: ', this._contractAddress)
            return this._contractAddress
        })();
    }

    public get burnPercent(): Promise<number> {
        return (async () => {
            if (this._burnPercent) {
                return this._burnPercent;
            }

            await this._fulFillTransactionData();
            var resp: any;
            try{
                const currentBlock = await this._web3.eth.getBlockNumber().then(value => { return Number(value) });
                resp = await BaseScanAPI.getLpAmount(currentBlock, await this.pairAddress ,await this.deployerAddress);
            } catch(e) {
                console.error(e)
                throw Error(`[pool.burnPercent] Cannot get LP amount of ${await this.pairAddress}`)
            }
            
            const totalLp = Number(resp?.result[0]?.value)
            this._burnPercent = Number(this._burnAmount) / Number(totalLp) * 100;

            return this._burnPercent
        })();
    }

    public get tokenName(): Promise<string> {
        return (async () => {
            if (this._tokenName) {
                return this._tokenName
            }

            const abi = [
                {
                    "inputs": [],
                    "name": "name",
                    "outputs": [
                        {
                            "internalType": "string",
                            "name": "",
                            "type": "string"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                }
            ] as const;
            try {
                let contract = new this._web3.eth.Contract(abi, await this.contractAddress);
                this._tokenName = await contract.methods.name().call();
            } catch(e) {
                console.error(e)
                throw Error(`[pool.tokenName] Cannot get name of token: ${await this.contractAddress}`)
            }

            return this._tokenName
        })();
    }

    public get tokenSymbol(): Promise<string> {
        return (async () => {
            if (this._tokenSymbol) {
                return this._tokenSymbol
            }

            const abi = [
                {
                    "inputs": [],
                    "name": "symbol",
                    "outputs": [
                        {
                            "internalType": "string",
                            "name": "",
                            "type": "string"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                }
            ] as const;
            try{
                let contract = new this._web3.eth.Contract(abi, await this.contractAddress);
                this._tokenSymbol = await contract.methods.symbol().call();
            } catch(e) {
                console.error(e)
                throw Error(`[pool.tokenSymbol] Cannot get symbol of token: ${await this.contractAddress}`)
            }

            return this._tokenSymbol
        })();
    }

    public get tokenDecimal(): Promise<number> {
        return (async () => {
            if (this._tokenDecimal) {
                return this._tokenDecimal
            }

            const abi = [
                {
                    "inputs": [],
                    "name": "decimals",
                    "outputs": [
                        {
                            "internalType": "uint8",
                            "name": "",
                            "type": "uint8"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                }
            ] as const;
            try{
                let contract = new this._web3.eth.Contract(abi, await this.contractAddress);
                this._tokenDecimal = await contract.methods.decimals().call();
            } catch(e) {
                console.error(e)
                throw Error(`[pool.tokenDecimal] Cannot get decimals of token: ${await this.contractAddress}`)
            }

            return this._tokenDecimal
        })();
    }

    public get tokenTotalSupply(): Promise<number> {
        return (async () => {
            if (this._tokenTotalSupply) {
                return this._tokenTotalSupply
            }

            const abiTotalSupply = [
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
            var totalSupply: number;

            try{
                let contract = new this._web3.eth.Contract(abiTotalSupply, await this.contractAddress);
                totalSupply = await contract.methods.totalSupply().call();
            } catch(e) {
                console.error(e)
                throw Error(`[pool.tokenTotalSupply] Cannot get total supply of token: ${await this.contractAddress}`)
            }
            this._tokenTotalSupply = Number(totalSupply) / 10**18

            return this._tokenTotalSupply
        })();
    }

    public get totalHolders(): Promise<number> {
        return (async () => {
            if (this._totalHolders) {
                return this._totalHolders
            }

            var resp: any;
            try{
                const chainId = await this._web3.eth.getChainId().then(value => { return Number(value) });
                resp = await ChainBaseAPI.getTotalHolders(chainId, await this.contractAddress);
            } catch(e) {
                console.error(e)
                throw Error(`[pool.totalHolders] Cannot get total holders of token: ${await this.contractAddress}`)
            }
            this._totalHolders = resp?.count;

            return this._totalHolders
        })();
    }

    public get topHolders(): Promise<object> {
        return (async () => {
            if (this._holderBalance) {
                return this._holderBalance
            }

            var resp: any;
            try{
                const chainId = await this._web3.eth.getChainId().then(value => { return Number(value) });
                resp = await ChainBaseAPI.getTopHolders(chainId, await this.contractAddress)
                
            } catch(e) {
                console.error(e)
                throw Error(`[pool.topHolders] Cannot get top holders of token: ${await this.contractAddress}`)
            }

            if (resp?.data !== null){
                let holderLimit = resp?.data.length;
                let holdersBalance: any = {};
                if (resp.data.length > 8) {
                    holderLimit = 8
                }
                for (let i = 0; i < holderLimit; i++) {
                    if (resp.data[i]?.wallet_address === await this.deployerAddress) {
                        let balance = resp.data[i]?.original_amount;
                        holdersBalance[resp.data[i]?.wallet_address] = `Creator - ${(Number(balance) / Number(await this.tokenTotalSupply) /10**18 * 100).toFixed(2)}`;
                    } else if (resp.data[i]?.wallet_address !== '0x000000000000000000000000000000000000dead') {
                        let balance = resp.data[i]?.original_amount;
                        holdersBalance[resp.data[i]?.wallet_address] = (Number(balance) / Number(await this.tokenTotalSupply) /10**18 * 100).toFixed(2);
                    }
                }
                this._holderBalance = holdersBalance

                return this._holderBalance
            } else {
                this._holderBalance = {'Maybe rug': 'Maybe rug'}
                return this._holderBalance
            }
            
        })();
    }

    public get initialLp(): Promise<number> {
        return (async () => {
            if (this._initLp) {
                return this._initLp
            }

            let LPinEth: any = await getInitLPbyPair(this._contractAddress, await this.deployerAddress)
            if (LPinEth === undefined) {
                console.log('Get LP by Deployer Txns')
                LPinEth = await getInitLPbyDeployer(await this.deployerAddress)
            }
            this._initLp = LPinEth

            return this._initLp
        })();
    }

    public get totalTxns(): Promise<number> {
        return (async () => {
            if (this._totalTxns) {
                return this._totalTxns
            }

            if (!this._dexData) {
                try {
                    this._dexData = await DexScreenerAPI.getDexData(await this.pairAddress)
                } catch(e) {
                    console.error(e)
                    throw Error('[pool.totalTxns] Cannot get data from DexScreener')
                }
            }

            let txns24h = this._dexData?.pair?.txns?.h24;
            let buyTxns = Number(txns24h?.buys);
            let sellTxns = Number(txns24h?.sells);
            this._totalTxns = buyTxns + sellTxns
            return this._totalTxns
        })();
    }

    public get priceToken(): Promise<number> {
        return (async () => {
            if (this._priceToken) {
                return this._priceToken
            }

            if (!this._dexData) {
                try {
                    this._dexData = await DexScreenerAPI.getDexData(await this.pairAddress)
                } catch(e) {
                    console.error(e)
                    throw Error('[pool.priceToken] Cannot get data from DexScreener')
                }
            }
            
            this._priceToken = Number(this._dexData?.pair?.priceUsd)
            return this._priceToken
        })();
    }

    public get liquidity(): Promise<number> {
        return (async () => {
            if (this._liquidity) {
                return this._liquidity
            }

            if (!this._dexData) {
                try {
                    this._dexData = await DexScreenerAPI.getDexData(await this.pairAddress)
                } catch(e) {
                    console.error(e)
                    throw Error('[pool.liquidity] Cannot get data from DexScreener')
                }
            }

            this._liquidity = Number(this._dexData?.pair?.liquidity?.usd)
            return this._liquidity
        })();
    }

    public get liveTime(): Promise<string> {
        return (async () => {
            if (this._liveTime) {
                return this._liveTime
            }

            if (!this._dexData) {
                try {
                    this._dexData = await DexScreenerAPI.getDexData(await this.pairAddress)
                } catch(e) {
                    console.error(e)
                    throw Error('[pool.liveTime] Cannot get data from DexScreener')
                }
                
            }
            
            let pairCreatedAt = Number(this._dexData?.pair?.pairCreatedAt)
            let currentTime = new Date();
            this._liveTime =  convertSeconds(((Number(currentTime) - pairCreatedAt) / 1000))
            return this._liveTime
        })();
    }

    public get marketCapBurn(): Promise<number> {
        return (async () => {
            if (this._marketCapBurn) {
                return this._marketCapBurn
            }

            await this._fulFillTransactionData();
            return (await this.priceToken * ((await this.tokenTotalSupply - this._burnAmount)/10**18))
        })();
    }

    public get deployerBalance(): Promise<number> {
        return (async () => {
            if (this._deployerBalance) {
                return this._deployerBalance
            }

            var resp: any;
            try {
                resp = await BaseScanAPI.getBalanceAddress(await this.deployerAddress);
            } catch(e) {
                console.error(e)
                throw Error(`[pool.deployerBalance] Cannot get balance of deployer: ${await this.deployerAddress}`)
            }
            this._deployerBalance = await transferGwei2Eth(resp.result)

            return this._deployerBalance
        })();
    }

    public get verified(): Promise<boolean> {
        return (async () => {
            if (this._isVerified) {
                return this._isVerified
            }

            var resp: any;
            try {
                resp = await BaseScanAPI.getAbi(await this.contractAddress)
            } catch(e) {
                console.error(e)
                throw Error(`[pool.verified] Cannot get ABI of contract: ${await this.contractAddress}`)
            }
             
            this._isVerified = await checkAbi(resp?.result)

            return this._isVerified
        })();
    }

    public get clog(): Promise<string> {
        return (async () => {
            if (this._clog) {
                return this._clog
            }

            let clog = await getClog(await this.contractAddress);
            this._clog = (Number(clog) / Number(await this.tokenTotalSupply) * 100).toFixed(2);
            if (Number(this._clog) > 100) {
                this._clog = 'SCAM'
            }
            return this._clog;
        })();
    }

    private async _checkPairorContract(address: string) {
        var contract: string;
        try {
            contract = await getCAbyPair(address);
        } catch(e) {
            console.log(`${address} is not pair address`)
            this._contractAddress = address
            await this._getPairAddress(this._contractAddress)
        }
    }

    private async _getPairAddress(contractAddress: string) {
        var currentBlock: number;
        var firstITxnUniV2 : any;
        var firstITxnUniV3 : any;
        var firstITxnSushi : any;
        var firstITxnSB : any;
    
        try {
            currentBlock = await this._web3.eth.getBlockNumber().then(value => { return Number(value) });
        } catch(e) {
            throw Error('[pool._getPairAddress] Cannot get current block')
        }
        
        let pairAddressUniV2 = await getPairUniV2(contractAddress);
        try {
            if (pairAddressUniV2) {
                let firstITxnUniV2hash = await BaseScanAPI.getFirstInternalTxn(currentBlock, pairAddressUniV2);
                if (firstITxnUniV2hash) {
                    firstITxnUniV2 = await this._web3.eth.getTransaction(firstITxnUniV2hash);
                }
            }
        } catch(e) {
            console.error(e)
            throw Error('[pool._getPairAddress] Cannot get first internal txn uniV2')
        }
    
        let pairAddressUniV3 = await getPairUniV3(contractAddress);
        
        try {
            if (pairAddressUniV3) {
                let firstITxnUniV3hash = await BaseScanAPI.getFirstInternalTxn(currentBlock, pairAddressUniV3);
                if (firstITxnUniV3hash) {
                    firstITxnUniV3 = await this._web3.eth.getTransaction(firstITxnUniV3hash);
                }
            }
        } catch(e) {
            console.error(e)
            throw Error('[utils._getPairAddress] Cannot get first internal txn uniV3')
        }
    
        let pairAddressSushi = await getPairSushiV2(contractAddress);
        try {
            if (pairAddressSushi) {
                let firstITxnSushihash = await BaseScanAPI.getFirstInternalTxn(currentBlock, pairAddressSushi);
                if (firstITxnSushihash) {
                    firstITxnSushi = await this._web3.eth.getTransaction(firstITxnSushihash);
                }
            }
        } catch(e) {
            console.error(e)
            throw Error('[pool._getPairAddress] Cannot get first internal txn sushi')
        }
    
        let pairAddressSB = await getPairSwapBasedv2(contractAddress);
        try {
            if (pairAddressSB) {
                let firstITxnSBhash = await BaseScanAPI.getFirstInternalTxn(currentBlock, pairAddressSB);
                if (firstITxnSBhash) {
                    firstITxnSB = await this._web3.eth.getTransaction(firstITxnSBhash);
                }
            }
        } catch(e) {
            console.error(e)
            throw Error('[pool._getPairAddress] Cannot get first internal txn Swap based')
        }
    
        if (firstITxnUniV2) {
            let deployerPair = firstITxnUniV2['from'];
            this._pairAddress = pairAddressUniV2!;
            this._deployerAddress = deployerPair;
            
        }
        else if (firstITxnUniV3) {
            let deployerPair = firstITxnUniV3['from'];
            this._pairAddress = pairAddressUniV3!;
            this._deployerAddress = deployerPair;
        } 
        else if (firstITxnSushi) {
            let deployerPair = firstITxnSushi['from'];
            this._pairAddress = pairAddressSushi!;
            this._deployerAddress = deployerPair;
        }
        else if (firstITxnSB) {
            let deployerPair = firstITxnSB['from'];
            this._pairAddress = pairAddressSB!;
            this._deployerAddress = deployerPair;
        }
    }

    private async _fulFillTransactionData(): Promise<void> {
        console.log('Tx hash: ', this._transactionHash)
        const transaction = await this._web3.eth.getTransaction(this._transactionHash);
        this._deployerAddress = transaction?.from.toString();
        const txReceipt = await this._web3.eth.getTransactionReceipt(this._transactionHash);
        if (txReceipt?.logs[0]){
            this._pairAddress = txReceipt?.logs[0].address!;
            await this._checkPairorContract(this._pairAddress)
            const amountLpBurnHex = txReceipt?.logs[0].data!;
            this._burnAmount = parseInt(String(amountLpBurnHex), 16);
        }
    }

}
