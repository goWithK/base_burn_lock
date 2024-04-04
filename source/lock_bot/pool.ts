// Store & Provide data to Message

import ScanBaseAPI from "../shared/BaseScanApi";

class DataPool {

    private _tokenName: Promise<string>;
    private _tokenSymbol: Promise<string>;
    private _liquidity: Promise<string>;
    private _lockDays: Promise<string>;
    private _abc: Promise<string>;



    public get tokenName(): Promise<string> {
        if (this._tokenName) {
            return this._tokenName;
        }

        this._tokenName = new Promise((tokenName) => {return tokenName});
        return this._tokenName;
    }

    public get tokenSymbol(): Promise<string> {
        if (this._tokenSymbol) {
            return this._tokenSymbol;
        }

        this._tokenSymbol = new Promise(async (tokenSymbol) => {return await this.tokenName + tokenSymbol});
        return this._tokenSymbol;
    }

    public get liquidity(): Promise<string> {
        if (this._liquidity) {
            return this._liquidity;
        }

        this._liquidity = new Promise(async () => {
            const abc, liquidity = await ScanBaseAPI.getLockDays();

            return await this.tokenName + lockDays;
        });
        return this._lockDays;
        return this._liquidity;
    }

    public get lockDays(): Promise<string> {
        if (this._lockDays) {
            return this._lockDays;
        }

        this._lockDays = new Promise(async () => {
            const lockDays = await ScanBaseAPI.getLockDays();
            
            return await this.tokenName + lockDays;
        });
        return this._lockDays;
    }
}

export default DataPool;