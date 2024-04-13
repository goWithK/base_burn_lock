// Store & Provide data to Message

import Web3, { MethodNotImplementedError } from "web3";
import { ethers } from 'ethers';
import { BaseScanAPI } from "../../shared/apis/basescan.api";
import { ChainBaseAPI } from "../../shared/apis/chainbase.api";
import { DexScreenerAPI } from "../../shared/apis/dexscreener.api";
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
    getClog
} from "../../shared/helpers/utils"
import { IDataPool } from "../../shared/type";

export class Univ3DataPool implements IDataPool {

    private _web3;

    private _transactionHash: string;
    private _eventData: any;
    private _deployerAddress: string;
    private _transactionInput: string;
    private _infoLock: any;
    private _pairAddress: string;
    private _contractAddress: string;
    private _exchange: string;
    private _lockId: number;
    private _lockPercent: number;
    private _lockDays: number;
    private _tokenName: string;
    private _tokenSymbol: string;
    private _tokenDecimal: number;
    private _tokenTotalSupply: number;
    private _totalHolders: number;
    private _holderBalance: {[index: string]: any};
    private _initLp: number;
    private _totalTxns: number;
    private _priceToken: number;
    private _liveTime: string;
    private _marketCapLock: number;
    private _isRenounced: boolean;
    private _deployerBalance: number;
    private _clog: string;
    private _isVerified: boolean;
    private _lockAmount: number;
    private _liquidity: number;
    private _dexData: any;

    public constructor(transactionHash: string, eventData: any) {

        this._web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ALCHEMY_ENDPOINT_BASE}`))

        this._transactionHash = transactionHash;
        this._eventData = eventData;
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
                throw Error(`[univ3.pool.renounced] Error when get transaction by address: ${await this.deployerAddress}`)
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

    public get lockInfo(): Promise<any> {
        return (async () => {
            if (this._infoLock) {
                return this._infoLock
            }

            await this._fulfillInfoLock();

            return this._infoLock;
        })();
    }

    public get pairAddress(): Promise<string> {
        return (async () => {
            if (this._pairAddress) {
                return this._pairAddress
            }

            const lockData = await this.lockInfo;
            this._pairAddress = lockData?.pool;

            return this._pairAddress
        })();
    }

    public get deployerAddress(): Promise<string> {
        return (async () => {
            if (this._deployerAddress) {
                return this._deployerAddress
            }

            const lockData = await this.lockInfo;
            this._deployerAddress = lockData?.collectAddress;

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

            return this._contractAddress
        })();
    }

    public get lockPercent(): Promise<number> {
        return (async () => {
            if (this._lockPercent) {
                return this._lockPercent;
            }

            await this._fulfillInfoLock()
            var resp: any;

            try {
                const currentBlock = await this._web3.eth.getBlockNumber().then(value => { return Number(value) });
                resp = await BaseScanAPI.getLpAmount(currentBlock, await this.pairAddress ,await this.deployerAddress);
            } catch(e) {
                console.error(e)
                throw Error(`[univ3.pool.lockPercent] Cannot get LP of pair: ${await this.pairAddress}`)
            }
            
            const totalLp = Number(resp?.result[0]?.value)
            this._lockPercent = Number(this._lockAmount) / Number(totalLp) * 100;

            return this._lockPercent
        })();
    }

    public get lockDays(): Promise<number> {
        return (async () => {
            if (this._lockDays) {
                return this._lockDays;
            }

            await this._fulfillInfoLock();
            const lockData = await this.lockInfo;
            const unlockTime = Number(lockData?.unlockDate);
            let current = new Date();
            let date = current.getFullYear() + '-' + ('0' + (current.getMonth() + 1)).slice(-2) + '-' + ('0' + current.getDate()).slice(-2);
            let time = ('0' + current.getHours()).slice(-2) + ":00:00";
            let currentTime = Date.parse(date + 'T' + time);
            this._lockDays = ((unlockTime - Number(currentTime) / 1000) / (60 * 60 * 24));

            return this._lockDays
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
                throw Error(`[univ3.pool.tokenName] Cannot get name of token: ${await this.contractAddress}`)
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
                throw Error(`[univ3.pool.tokenSymbol] Cannot get symbol of token: ${await this.contractAddress}`)
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
                throw Error(`[univ3.pool.tokenDecimal] Cannot get decimals of token: ${await this.contractAddress}`)
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
                throw Error(`[univ3.pool.tokenTotalSupply] Cannot get total supply of token: ${await this.contractAddress}`)
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
                throw Error(`[univ3.pool.totalHolders] Cannot get total holders of token: ${await this.contractAddress}`)
            }
            this._totalHolders = resp?.count;

            return this._totalHolders
        })();
    }

    public get topHolders(): Promise<{[index: string]: any}> {
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
                throw Error(`[univ3.pool.topHolders] Cannot get top holders of token: ${await this.contractAddress}`)
            }

            let holderLimit = resp.data.length;
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
                    throw Error('[univ3.pool.totalTxns] Cannot get data from DexScreener')
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
                    throw Error('[univ3.pool.priceToken] Cannot get data from DexScreener')
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
                    throw Error('[univ3.pool.liquidity] Cannot get data from DexScreener')
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
                    throw Error('[unv3.pool.liveTime] Cannot get data from DexScreener')
                }
                
            }
            let pairCreatedAt = Number(this._dexData?.pair?.pairCreatedAt)
            let currentTime = new Date();
            this._liveTime =  convertSeconds(((Number(currentTime) - pairCreatedAt) / 1000 / 60))
            return this._liveTime
        })();
    }

    public get marketCapLock(): Promise<number> {
        return (async () => {
            if (this._marketCapLock) {
                return this._marketCapLock
            }

            let burnAmount = 0;
            return (await this.priceToken * ((await this.tokenTotalSupply - burnAmount)))
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
                throw Error(`[univ3.pool.deployerBalance] Cannot get balance of deployer: ${await this.deployerAddress}`)
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
                throw Error(`[univ3.pool.verified] Cannot get ABI of contract: ${await this.contractAddress}`)
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

    // TODO: Define this method execution
    public get transactionInput(): Promise<string> {
        throw new MethodNotImplementedError();
    }

    private async _getLockbyId(lockId: number): Promise<any> {
        return (async () => {
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

            try{
                let contract = new this._web3.eth.Contract(abi, '0x231278eDd38B00B07fBd52120CEf685B9BaEBCC1');
                lockData = await contract.methods.getLock(lockId).call();
            } catch(e) {
                console.error(e)
                throw Error(`[univ3.pool._getLockbyId] Cannot get data by lockId: ${lockId}`)
            }

            return lockData
        })();
    }

    private async _fulfillInfoLock(): Promise<void> {
        this._lockId = parseInt(this._eventData?.slice(2, 64 + 2), 16)
        let lockAmountHex = this._eventData?.slice(64 * 17 + 2, 64 * 18 + 2);
        this._lockAmount = parseInt(lockAmountHex, 16);
        this._infoLock = await this._getLockbyId(this._lockId)
    }

}
