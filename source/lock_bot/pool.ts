// Store & Provide data to Message

import Web3 from "web3";
import { ethers } from 'ethers';
import OM_ABI from '../../src/JSON/Only_moons_ABI.json';
import { BaseScanAPI } from "../shared/apis/basescan.api";
import { ChainBaseAPI } from "../shared/apis/chainbase.api";
import { DexScreenerAPI } from "../shared/apis/dexscreener.api";
import { 
    convertSeconds,
    getInitLPbyPair, 
    getInitLPbyDeployer
} from "../shared/helpers/utils"

export class DataPool {

    private _web3;

    private _transactionHash: any;
    private _deployer: string;
    private _isCaRenounced: boolean;
    private _transactionInput: string;
    private _infoOM: any;
    private _pairAddressOM: string;
    private _contractAddress: string;
    private _lockPercentOM: number;
    private _lockDaysOM: number;
    private _tokenName: string;
    private _tokenSymbol: string;
    private _tokenDecimal: number;
    private _tokenTotalSupply: number;
    private _totalHolders: number;
    private _holderBalance: object;
    private _initLp: number;
    private _totalTxns: number;
    private _priceToken: number;
    private _liveTime: string;
    private _marketCapLock: number;
    private _marketCapBurn: number;

    public constructor(transactionHash: any) {

        this._web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ALCHEMY_ENDPOINT_BASE}`))

        this._transactionHash = transactionHash;
    }

    public get caRenou(): Promise<string> {
        return (async () => {
            if (this._contractAddress) {
                return this._contractAddress;
            }

            if (!(await this.deployer)) {
                console.error('[DataPool] Cannot get CARenounce by missing Deployer');
            }

            this._isCaRenounced = false;

            const currentBlock = await this._web3.eth.getBlockNumber().then(value => { return Number(value) });
            const resp = await BaseScanAPI.getTxnbyAddress(currentBlock, await this.deployer);
            let isLatest = false;

            for (let i = 0; i < resp['result'].length; i++) {
                if (!resp?.result[i]?.input || resp?.result[i]?.input == '') {
                    continue;
                }
                
                if (resp['result'][i]['input'].slice(0, 10) === '0x60806040'
                    || resp['result'][i]['input'].slice(0, 10) === '0x61016060'
                    || resp['result'][i]['input'].slice(0, 10) === '0x60a06040'
                    || resp['result'][i]['input'].slice(0, 10) === '0x60c06040'
                    || resp['result'][i]['input'].slice(0, 10) === '0x6b204fce'
                    || resp['result'][i]['input'].slice(0, 10) === '0x6b033b2e'
                    || resp['result'][i]['input'].slice(0, 10) === '0x6bdef376'
                    && isLatest === false
                ) {
                    const createTxn = resp['result'][i];
                    const getCa = (keyName: keyof typeof createTxn) => {
                        return createTxn[keyName]
                    };

                    isLatest = true;
                    this._contractAddress = getCa('contractAddress');
                    break;

                } 
                else if (resp['result'][i]['input'].slice(0, 10) === '0xf346c18d') {
                    const createTxn = resp['result'][i];
                    const getCa = (keyName: keyof typeof createTxn) => {
                        return createTxn[keyName]
                    };

                    const logs = await this._web3.eth.getTransactionReceipt(getCa('hash'))
                    const caHex = logs['logs'][0]['topics']
                    if (caHex) {
                        this._contractAddress = '0x' + `${caHex[2].slice(26, caHex[2].length)}`;
                        break;
                    }
                } 
                else if (resp['result'][i]['input'].slice(0, 10) === '0x715018a6') {
                    this._isCaRenounced = true;
                }
            }

            return this._contractAddress;
        })();
    }

    public get deployer(): Promise<string> {
        return (async () => {
            if (this._deployer) {
                return this._deployer;
            }

            await this._fulFillTransactionData();

            return this._deployer;
        })();
    }

    public get transactionInput(): Promise<string> {
        return (async () => {
            if (this._transactionInput) {
                return this._transactionInput;
            }

            await this._fulFillTransactionData();

            return this._transactionInput;
        })();
    }

    public get lockInfoOM(): Promise<any> {
        return (async () => {
            if (this._infoOM) {
                return this._infoOM
            }

            await this._fulFillTransactionData;
            await this._fulfillInfoOM();

            return this._infoOM;
        })();
    }

    public get pairAddressOM(): Promise<string> {
        return (async () => {
            if (this._pairAddressOM) {
                return this._pairAddressOM
            }

            const infoOM = await this.lockInfoOM;
            this._pairAddressOM = infoOM['args'][0]

            return this._pairAddressOM
        })();
    }

    public get lockPercentOM(): Promise<number> {
        return (async () => {
            if (this._lockPercentOM) {
                return this._lockPercentOM;
            }

            const infoOM = await this.lockInfoOM;
            const lockAmount = infoOM['args'][1];

            const currentBlock = await this._web3.eth.getBlockNumber().then(value => { return Number(value) });
            const resp = await BaseScanAPI.getLpAmount(currentBlock, await this.pairAddressOM ,await this.deployer);
            const totalLp = Number(resp['result'][0]['value'])
            this._lockPercentOM = Number(lockAmount) / Number(totalLp) * 100;

            return this._lockPercentOM
        })();
    }

    public get lockDaysOM(): Promise<number> {
        return (async () => {
            if (this._lockDaysOM) {
                return this._lockDaysOM;
            }

            const infoOM = await this.lockInfoOM;
            const unlockTime = Number(infoOM['args'][2]);
            let current = new Date();
            let date = current.getFullYear() + '-' + ('0' + (current.getMonth() + 1)).slice(-2) + '-' + ('0' + current.getDate()).slice(-2);
            let time = ('0' + current.getHours()).slice(-2) + ":00:00";
            let currentTime = Date.parse(date + 'T' + time);
            this._lockDaysOM = ((unlockTime - Number(currentTime) / 1000) / (60 * 60 * 24));

            return this._lockDaysOM
        })();
    }

    //need advice for this function due to contract address
    public get contractAddressOM(): Promise<string> {
        return (async () => {
            if (this._contractAddress) {
                return this._contractAddress
            }

            const transactionReceipt = await this._web3.eth.getTransactionReceipt(this._transactionHash);
            let needTopic: any = [];
            let topics = transactionReceipt['logs'][transactionReceipt['logs'].length - 1]['topics'];
            for (let i = 0; i < 4; i++) {
                if (String(topics[i]) !== '0x531cba00a411ade37b4ca8175d92c94149f19536bd8e5a83d581aa7f040d192e'
                    && String(topics[i]) !== '0x0000000000000000000000004200000000000000000000000000000000000006'
                    && String(topics[i]) !== `0x000000000000000000000000${this._pairAddressOM.slice(2, this._pairAddressOM.length).toLowerCase()}`
                    && String(topics[i]) !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
                    needTopic.push(topics[i])
                }
            }
            
            if (needTopic.length !== 0) {
                this._contractAddress = '0x' + `${needTopic[0].slice(26, needTopic[0].length)}`
            } else {
                this._contractAddress = await this.caRenou
            }

            return this._contractAddress
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
            let contract = new this._web3.eth.Contract(abi, this._contractAddress);
            this._tokenName = await contract.methods.name().call();

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
            let contract = new this._web3.eth.Contract(abi, this._contractAddress);
            this._tokenSymbol = await contract.methods.symbol().call();

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
            let contract = new this._web3.eth.Contract(abi, this._contractAddress);
            this._tokenDecimal = await contract.methods.name().call();

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
            let contract = new this._web3.eth.Contract(abiTotalSupply, this._contractAddress);
            let totalSupply = await contract.methods.totalSupply().call();
            this._tokenTotalSupply = Number(totalSupply) / 10**18

            return this._tokenTotalSupply
        })();
    }

    public get totalHolders(): Promise<number> {
        return (async () => {
            if (this._totalHolders) {
                return this._totalHolders
            }

            const chainId = await this._web3.eth.getChainId().then(value => { return Number(value) });
            const resp = await ChainBaseAPI.getTotalHolders(chainId, this._contractAddress);
            this._totalHolders = resp['count'];

            return this._totalHolders
        })();
    }

    public get topHolders(): Promise<object> {
        return (async () => {
            if (this._holderBalance) {
                return this._holderBalance
            }

            const chainId = await this._web3.eth.getChainId().then(value => { return Number(value) });
            const resp = await ChainBaseAPI.getTopHolders(chainId, this._contractAddress)

            let holderLimit = resp.data.length;
            let holdersBalance: any = {};
            if (resp.data.length > 8) {
                holderLimit = 8
            }
            for (let i = 0; i < holderLimit; i++) {
                if (resp.data[i]['wallet_address'] === await this.deployer) {
                    let balance = resp.data[i]['original_amount'];
                    holdersBalance[resp.data[i]['wallet_address']] = `Creator - ${(Number(balance) / Number(await this.tokenTotalSupply) * 100).toFixed(2)}`;
                } else if (resp.data[i]['wallet_address'] !== '0x000000000000000000000000000000000000dead') {
                    let balance = resp.data[i]['original_amount'];
                    holdersBalance[resp.data[i]['wallet_address']] = (Number(balance) / Number(await this.tokenTotalSupply) * 100).toFixed(2);
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

            let LPinEth: any = await getInitLPbyPair(this._contractAddress, await this.deployer)
            if (LPinEth === undefined) {
                console.log('Get LP by Deployer Txns')
                LPinEth = await getInitLPbyDeployer(await this.deployer)
            }
            this._initLp = LPinEth

            return this._initLp
        })();
    }

    public totalTxns(pairAddress: string): Promise<number> {
        return (async () => {
            if (this._totalTxns) {
                return this._totalTxns
            }

            const resp = await DexScreenerAPI.getDexData(pairAddress)
            let txns24h = resp['pair']['txns']['h24']
            let buyTxns = Number(txns24h['buys']);
            let sellTxns = Number(txns24h['sells']);
            this._totalTxns = buyTxns + sellTxns
            return this._totalTxns
        })();
    }

    public priceToken(pairAddress: string): Promise<number> {
        return (async () => {
            if (this._priceToken) {
                return this._priceToken
            }

            const resp = await DexScreenerAPI.getDexData(pairAddress)
            this._priceToken = Number(resp['pair']['priceUsd'])
            return this._priceToken
        })();
    }

    public liveTime(pairAddress: string): Promise<string> {
        return (async () => {
            if (this._liveTime) {
                return this._liveTime
            }

            const resp = await DexScreenerAPI.getDexData(pairAddress)
            let pairCreatedAt = Number(resp['pair']['pairCreatedAt'])
            let currentTime = new Date();
            this._liveTime =  convertSeconds(((Number(currentTime) - pairCreatedAt) / 1000 / 60))
            return this._liveTime
        })();
    }

    public marketCapLock(priceToken: number, totalSupply: number, burnAmount: number   = 0): Promise<number> {
        return (async () => {
            if (this._marketCapLock) {
                return this._marketCapLock
            }

            return (priceToken * ((totalSupply - burnAmount) / 10**18))
        })();
    }

    

    private async _fulFillTransactionData(): Promise<void> {
        const transaction = await this._web3.eth.getTransaction(this._transactionHash);
        this._deployer = transaction?.from.toString();
        this._transactionInput = transaction?.input.toString();
    }

    private async _fulfillInfoOM(): Promise<void> {
        const inter = new ethers.Interface(OM_ABI);
        const value = ethers.parseEther("1.0");
        this._infoOM = inter.parseTransaction({ data: this._transactionInput, value });
    }

}
