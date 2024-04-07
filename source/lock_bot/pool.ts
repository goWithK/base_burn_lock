// Store & Provide data to Message

import Web3 from "web3";
import { BaseScanAPI } from "../shared/apis/basescan.api";


export class DataPool {

    private _web3;

    private _transactionHash: any;
    private _caRenou: string;
    private _deployer: string;
    private _isCaRenounced: boolean;
    private _transactionInput: string;

    public constructor(transactionHash: any) {

        this._web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ALCHEMY_ENDPOINT_BASE}`))

        this._transactionHash = transactionHash;
    }

    public get caRenou(): Promise<string> {
        return (async () => {
            if (this._caRenou) {
                return this._caRenou;
            }

            if (!(await this.deployer)) {
                console.error('[DataPool] Cannot get CARenounce by missing Deployer');
            }

            this._isCaRenounced = false;

            const currentBlock = await this._web3.eth.getBlockNumber().then(value => { return Number(value) });
            const resp = await BaseScanAPI.getCa(currentBlock, await this.deployer);
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
                    this._caRenou = getCa('contractAddress');
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
                        this._caRenou = '0x' + `${caHex[2].slice(26, caHex[2].length)}`;
                        break;
                    }
                } 
                else if (resp['result'][i]['input'].slice(0, 10) === '0x715018a6') {
                    this._isCaRenounced = true;
                }
            }

            return this._caRenou;
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

    private async _fulFillTransactionData(): Promise<void> {
        const transaction = await this._web3.eth.getTransaction(this._transactionHash);
        this._deployer = transaction?.from.toString();
        this._transactionInput = transaction?.input.toString();
    }

}
