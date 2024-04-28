// Used to build & send Telegram Message
import { formatter } from '../shared/helpers/utils';
import { IDataPoolListing } from '../shared/type';

export class Message {


    private _dataPool: IDataPoolListing;
    private _ctx: any;

    public constructor(dataPool: IDataPoolListing, ctx: any) {
        this._dataPool = dataPool;
        this._ctx = ctx
    }

    public async getMsgContent(): Promise<string> {
        console.log('Start gathering message info')
        const contractAddress = await this._dataPool.contractAddress;
        const tokenName = await this._dataPool.tokenName;
        const tokenSymbol = await this._dataPool.tokenSymbol;
        const marketCap = await this._dataPool.marketCap;
        const totalTxns = await this._dataPool.totalTxns;
        const totalHolders = await this._dataPool.totalHolders;
        const topHolders = await this._dataPool.topHolders;
        const clog = await this._dataPool.clog;
        const devBalance = await this._dataPool.deployerBalance;
        const renounced = await this._dataPool.renounced;
        const verified = await this._dataPool.verified;
        const initialLp = await this._dataPool.initialLp;
        if (initialLp < 0.01) {
            return ''
        }
        const liquidity = await this._dataPool.liquidity;
        
        console.log('Finish gathering message info')

        let title = this._ctx.emoji`<b>LISTING</b> | ${tokenName} | ${tokenSymbol} \n\n`
        let ca_msg = `<a href="https://basescan.org/address/${contractAddress}">CA:</a> <code>${contractAddress}</code>\n`;
        let mc_msg = this._ctx.emoji`${"bar_chart"} MC: <b>${formatter.format(marketCap)}</b>\n`
        let initLp_msg = this._ctx.emoji`${"money_with_wings"} Initial LP: ${initialLp}E ${"left_arrow_curving_right"} Current LP: ${formatter.format(liquidity)} \n`;
        let stats_msg = this._ctx.emoji` ${"left_arrow_curving_right"} Holders: ${totalHolders} ${"left_arrow_curving_right"} Txns: ${totalTxns}\n`;
        let ca_balance_msg = `Clog: ${clog}% \n`;
        let renounced_msg = this._ctx.emoji`Renounced: ${"cross_mark"} \n`
        if (renounced) { renounced_msg = this._ctx.emoji`Renounced: ${"check_mark_button"} \n` }
        let verified_msg = this._ctx.emoji`Verified: ${"cross_mark"} \n`
        if (verified) { verified_msg = this._ctx.emoji`Verified: ${"check_mark_button"} \n` }
        let devBalance_msg = this._ctx.emoji`Dev Balance: ${devBalance.toFixed(2)}E - `
        
        let holderAddress: any = Object.keys(topHolders);
        let list_msg: any = [];
        let holderLimit = 5;
        if (holderLimit > holderAddress.length) { holderLimit = holderAddress.length }
        for (let i = 0; i < holderLimit; i++) {
            list_msg.push(`<a href="https://basescan.org/address/${holderAddress[i]}">${topHolders[holderAddress[i]]}</a>`)
        }
        let holder_msg = 'Holders: ';
        let tg_msg = title + ca_msg + mc_msg + initLp_msg + stats_msg + ca_balance_msg + devBalance_msg + verified_msg + renounced_msg + holder_msg + list_msg.join(' | ');

        return tg_msg
    }
}
