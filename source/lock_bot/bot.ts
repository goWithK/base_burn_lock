import Web3 from "web3";
import TelegramBot from "../shared/bot";
import { BaseScanAPI } from "../shared/BaseScanApi";

export class LockBot extends TelegramBot {

    private _web3: Web3

    public constructor () {
        super();

        this._web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ALCHEMY_ENDPOINT_BASE}`))
    }

    protected override _registerCommands(): void {
        this._bot.command('start', async (ctx) => {
            const chatId = -4114916111;
            const tgMsg = ctx.emoji`${"locked"} <b>LP LOCK</b> | Test | Test \n\n`

            await this._getLockInfo(true, chatId, ctx);

            await this._delay(1000);
        });

        this._bot.command('help', async (ctx) => {
            const chatId = ctx.msg.chat.id;

            await this._bot.api.sendMessage(
                chatId,
                'Help',
                { parse_mode: "HTML" },
            );
        });

        this._bot.command("stop", async (ctx) => {
            await ctx.reply("Leaving...");
        });
    }

    private async _delay(time: number): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, time));
    }

    private async _getLockInfo(trueOrFalse: boolean, chatId: any, ctx: any): Promise<void> {
        if (!trueOrFalse) {
            return;
        }

        const currentBlock = await this._web3.eth.getBlockNumber().then(value => { return Number(value) });
        // const startblock = Number(currentBlock)-3;
        const startblock = 12176231;

        const tokenMoon = await BaseScanAPI.getTokenMoon(currentBlock, startblock);
        console.log(tokenMoon);

        

        // var responseClone1: any;
        // let info1 = await fetch(UrlLockTokenMoon)
        // .then(function (response) {
        //     responseClone1 = response.clone(); 
        //     return response.json();
        // })
        // .then(async function (data) {
        //     await this._delay(1000);
        //     let output = [];
        //     if (data['result'] !== 'Error!' && data['result'].length > 0) {
        //         // console.log('Lock: ', data['result'])
        //         for (let i = 0; i < data['result'].length; i++) {
        //             const txHash = data['result'][i]['transactionHash'];
        //             const lockInfo = await getLockInfoMoon(txHash);
        //             output.push(lockInfo)

        //             return output
        //         }
        //     }
        // }, function (rejectionReason) { 
        //     console.log('Error parsing JSON from response OnlyMoon:', rejectionReason, responseClone1);
        //     responseClone1.text().then(function (bodyText: any) {
        //         console.log('Received the following instead of valid JSON:', bodyText); 
        //     });
        // });
        // if (info1) {
        //     var holder_msg = 'Holders: ';
        //     for (let i = 0; i < info1.length; i++) {
        //         let eachInfo = info1[i];
        //         if (eachInfo) {
        //             let title = ctx.emoji`${"locked"} <b>LP LOCK</b> | ${eachInfo[8]} | ${eachInfo[9]} \n\n`
        //             let ca_msg = `<a href="https://basescan.org/address/${eachInfo[0]}">CA:</a> <code>${eachInfo[0]}</code>\n \n`;
        //             let lock_msg = ctx.emoji`<b>${'locked'} Liquidity: **${eachInfo[2]} % of Liquidity Locked for ${eachInfo[1]} days**</b>\n`;
        //             let mc_msg = ctx.emoji`${"bar_chart"} MC: <b>${formatter.format(eachInfo[11])}</b>\n`
        //             let total_msg = ctx.emoji`${"busts_in_silhouette"} Total holders: ${eachInfo[3]} \n`;
        //             let ca_balance_msg = `Contract Balance: ${eachInfo[5]}% \n`;
        //             let renounced_msg = ctx.emoji`Renounced: ${"cross_mark"} \n`
        //             if (eachInfo[5]) { renounced_msg = ctx.emoji`Renounced: ${"check_mark_button"} \n` }
        //             let initLp_msg = ctx.emoji`${"money_with_wings"} Init LP: ${eachInfo[7]} ETH \n`;
        //             let holderAddress = Object.keys(eachInfo[4]);
        //             let list_msg = [];
        //             let holderLimit = 5;
        //             if (holderLimit > holderAddress.length) { holderLimit = holderAddress.length }
        //             for (let i = 0; i < holderLimit; i++) {
        //                 list_msg.push(`<a href="https://basescan.org/address/${holderAddress[i]}">${eachInfo[4][holderAddress[i]]}%</a>`)
        //             }
        //             let tg_msg = title + ca_msg + lock_msg + mc_msg + total_msg + ca_balance_msg + renounced_msg + initLp_msg + holder_msg + list_msg.join(' | ');
        //             await bot.api.sendMessage(
        //                 chatId,
        //                 tg_msg,
        //                 { parse_mode: "HTML" },
        //             );
        //         }
        //     }
        // }

        // const urlLockUNCX = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=${startblock}&toBlock=${currentBlock}&address=0x231278eDd38B00B07fBd52120CEf685B9BaEBCC1&topic0=0x3bf9c85fbe37d401523942f10940796acef64062e1a1c45647978e32f4969f5c&page=1&offset=1000&apikey=${process.env.API_BASESCAN_KEY}`
        // var responseClone2: any;
        // let info2 = await fetch(urlLockUNCX)
        // .then(function (response) {
        //     responseClone2 = response.clone(); 
        //     return response.json();
        // })
        // .then(async function (data) {
        //     await delay(1000);
        //         let output = [];
        //         if (data['result'] !== 'Error!' && data['result'].length > 0) {
        //             // console.log('Lock: ', data['result'])
        //             for (let i = 0; i < data['result'].length; i++) {
        //                 const txHash = data['result'][i]['transactionHash'];
        //                 const lockInfo = await getLockInfoUNCX(txHash);
        //                 output.push(lockInfo)

        //                 return output
        //             }
        //         }
        // }, function (rejectionReason) { 
        //     console.log('Error parsing JSON from response UNCX:', rejectionReason, responseClone2);
        //     responseClone2.text().then(function (bodyText: any) {
        //         console.log('Received the following instead of valid JSON:', bodyText); 
        //     });
        // });
        // // console.log('Info lock:', info)

        // if (info2) {
        //     var holder_msg = 'Holders: ';
        //     for (let i = 0; i < info2.length; i++) {
        //         let eachInfo = info2[i];
        //         if (eachInfo) {
        //             let title = ctx.emoji`${"locked"} <b>LP LOCK</b> | ${eachInfo[8]} | ${eachInfo[9]} \n\n`
        //             let ca_msg = `<a href="https://basescan.org/address/${eachInfo[0]}">CA:</a> <code>${eachInfo[0]}</code>\n \n`;
        //             let lock_msg = ctx.emoji`<b>${'locked'} Liquidity: **${eachInfo[2]} % of Liquidity Locked for ${eachInfo[1]} days**</b>\n`;
        //             let mc_msg = ctx.emoji`${"bar_chart"} MC: <b>${formatter.format(eachInfo[11])}</b>\n`
        //             let total_msg = ctx.emoji`${"busts_in_silhouette"} Total holders: ${eachInfo[3]} \n`;
        //             let ca_balance_msg = `Contract Balance: ${eachInfo[5]}% \n`;
        //             let renounced_msg = ctx.emoji`Renounced: ${"cross_mark"} \n`
        //             if (eachInfo[5]) { renounced_msg = ctx.emoji`Renounced: ${"check_mark_button"} \n` }
        //             let initLp_msg = ctx.emoji`${"money_with_wings"} Init LP: ${eachInfo[7]} ETH \n`;
        //             let holderAddress = Object.keys(eachInfo[4]);
        //             let list_msg = [];
        //             let holderLimit = 5;
        //             if (holderLimit > holderAddress.length) { holderLimit = holderAddress.length }
        //             for (let i = 0; i < holderLimit; i++) {
        //                 list_msg.push(`<a href="https://basescan.org/address/${holderAddress[i]}">${eachInfo[4][holderAddress[i]]}%</a>`)
        //             }
        //             let tg_msg = title + ca_msg + lock_msg + mc_msg + total_msg + ca_balance_msg + renounced_msg + initLp_msg + holder_msg + list_msg.join(' | ');
        //             await bot.api.sendMessage(
        //                 chatId,
        //                 tg_msg,
        //                 { parse_mode: "HTML" },
        //             );
        //         }
        //     }
        // }
        // await delay(2500);
        // await getLockInfo(trueOrFalse, chatId, ctx);
    }
}