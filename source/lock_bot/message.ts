// Used to build & send Telegram Message
import { DataPool } from './pool';

export class Message {


    private _dataPool: DataPool;


    public constructor(dataPool: DataPool) {
        this._dataPool = dataPool;
    }

    // public async fillData(): Promise<void> {
    //     const title = this._chatCtx.emoji`${"locked"} <b>LP LOCK</b> | ${await this._dataPool.tokenName} | ${await this._dataPool.tokenSymbol} \n\n`
    //     const lock = this._chatCtx.emoji`<b>${'locked'} Liquidity: **${await this._dataPool.liquidity} % of Liquidity Locked for ${await this._dataPool.lockDays} days**</b>\n`;

    //     this._content = title + lock;
    // }

    public async getMsgContent(): Promise<string> {
        const caRenou = await this._dataPool.caRenou;
        const caContent = `<a href="https://basescan.org/address/${caRenou}">CA:</a> <code>${caRenou}</code>\n \n`;

        return caContent;
    }
}
