// Used to build & send Telegram Message
import { DataPool } from './pool/OM.pool';
import { formatter } from '../shared/helpers/utils';

export class Message {


    private _dataPool: DataPool;
    private _ctx: any;

    public constructor(dataPool: DataPool, ctx: any) {
        this._dataPool = dataPool;
        this._ctx = ctx
    }

    public async getMsgContent(): Promise<string> {
        const contractAddress = await this._dataPool.contractAddress;
        if (contractAddress) {
            const tokenName = await this._dataPool.tokenName;
            const tokenSymbol = await this._dataPool.tokenSymbol;
            const lockDays = await this._dataPool.lockDays;
            const lockPercent = await this._dataPool.lockPercent;
            const marketCapLock = await this._dataPool.marketCapLock;
            const totalTxns = await this._dataPool.totalTxns;
            const totalHolders = await this._dataPool.totalHolders;
            const topHolders = await this._dataPool.topHolders;
            const liveTime = await this._dataPool.liveTime;
            const contractAddress = await this._dataPool.contractAddress;
            const clog = await this._dataPool.clog;
            const devBalance = await this._dataPool.deployerBalance;
            const renounced = await this._dataPool.renounced;
            const verified = await this._dataPool.verified;
            const initialLp = await this._dataPool.initialLp;

            let title = this._ctx.emoji`${"locked"} <b>LP LOCK</b> | ${tokenName} | ${tokenSymbol} \n\n`
            let ca_msg = `<a href="https://basescan.org/address/${contractAddress}">CA:</a> <code>${contractAddress}</code>\n`;
            let lock_msg = this._ctx.emoji`<b>${'locked'} Liquidity: **${lockPercent.toFixed(2)} % of Liquidity Locked for ${lockDays.toFixed(0)} days**</b>\n`;
            let mc_msg = this._ctx.emoji`${"bar_chart"} MC: <b>${formatter.format(marketCapLock)}</b>\n`
            let initLp_msg = this._ctx.emoji`${"money_with_wings"} Initial LP: ${initialLp} ETH - Current LP: (-) \n`;
            let stats_msg = this._ctx.emoji`${"left_arrow_curving_right"} Live: ${liveTime} ${"left_arrow_curving_right"} Holders: ${totalHolders} ${"left_arrow_curving_right"} Txns: ${totalTxns}\n`;
            let ca_balance_msg = `Clog: ${clog}% \n`;
            let renounced_msg = this._ctx.emoji`Renounced: ${"cross_mark"} \n`
            if (renounced) { renounced_msg = this._ctx.emoji`Renounced: ${"check_mark_button"} \n` }
            let verified_msg = this._ctx.emoji`Verified: ${"cross_mark"} \n`
            if (verified) { verified_msg = this._ctx.emoji`Verified: ${"check_mark_button"} \n` }
            let devBalance_msg = `Dev Balance: ${devBalance.toFixed(2)}ETH`
            
            let holderAddress: any = Object.keys(topHolders);
            let list_msg: any = [];
            let holderLimit = 5;
            if (holderLimit > holderAddress.length) { holderLimit = holderAddress.length }
            for (let i = 0; i < holderLimit; i++) {
                list_msg.push(`<a href="https://basescan.org/address/${holderAddress[i]}">${topHolders[holderAddress[i]]}%</a>`)
            }
            let holder_msg = 'Holders: ';
            let tg_msg = title + ca_msg + lock_msg + mc_msg + initLp_msg + stats_msg + ca_balance_msg + devBalance_msg + verified_msg + renounced_msg + holder_msg + list_msg.join(' | ');

            return tg_msg
        } else {
            return ''
        }
    }
}
