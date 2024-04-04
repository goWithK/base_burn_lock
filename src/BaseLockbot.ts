import { Bot, GrammyError, HttpError, session } from 'grammy';
import { apiThrottler } from '@grammyjs/transformer-throttler';
import { limit } from '@grammyjs/ratelimiter';
import { hydrateReply } from '@grammyjs/parse-mode';
import type { ParseModeFlavor } from '@grammyjs/parse-mode';
import { emojiParser } from '@grammyjs/emoji';
import Web3 from 'web3';
import { globalConfig, groupConfig, outConfig } from './common/limitsConfig';
import { BotContext } from './types';
import { COMMANDS } from './commands';
import { getLockInfoMoon, getLockInfoUNCX } from './commands/burnLPBase';

//Env vars
const BOT_TOKEN = process.env.LOCK_BASE_BOT || '';
const web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ALCHEMY_ENDPOINT_BASE}`))

//BOT CONFIG
const bot = new Bot<ParseModeFlavor<BotContext>>(BOT_TOKEN);
const throttler = apiThrottler({
    global: globalConfig,
    group: groupConfig,
    out: outConfig,
});

bot.api.setMyCommands(COMMANDS);
bot.use(hydrateReply);
bot.use(emojiParser());
bot.api.config.use(throttler);
//bot.api.config.use(parseMode('')); // Sets default parse_mode for ctx.reply

bot.use(
    session({
        initial() {
            // return empty object for now
            return {};
        },
    })
);

bot.use(
    limit({
        // Allow only 6 messages to be handled every 3 secs.
        timeFrame: 3000,
        limit: 6,
        // This is called when the limit is exceeded.
        onLimitExceeded: async (ctx) => {
            await ctx.reply('Please refrain from sending too many requests!');
        },
        // Note that the key should be a number in string format such as "123456789".
        keyGenerator: (ctx) => {
            return ctx.from?.id.toString();
        },
    })
);

function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

async function getLockInfo(trueOrFalse: boolean, chatId: any, ctx: any) {
    if (trueOrFalse) {
        const currentBlock = await web3.eth.getBlockNumber().then(value => { return Number(value) });
        // const startblock = Number(currentBlock)-3;
        const startblock = 12176231;
        const UrlLockTokenMoon = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=${startblock}&toBlock=${currentBlock}&address=0x77110f67C0EF3c98c43570BADe06046eF6549876&topic0=0x531cba00a411ade37b4ca8175d92c94149f19536bd8e5a83d581aa7f040d192e&page=1&offset=1000&apikey=${process.env.API_BASESCAN_KEY}`

        var responseClone1: any;
        let info1 = await fetch(UrlLockTokenMoon)
        .then(function (response) {
            responseClone1 = response.clone(); 
            return response.json();
        })
        .then(async function (data) {
            await delay(1000);
            let output = [];
            if (data['result'] !== 'Error!' && data['result'].length > 0) {
                // console.log('Lock: ', data['result'])
                for (let i = 0; i < data['result'].length; i++) {
                    const txHash = data['result'][i]['transactionHash'];
                    const lockInfo = await getLockInfoMoon(txHash);
                    output.push(lockInfo)

                    return output
                }
            }
        }, function (rejectionReason) { 
            console.log('Error parsing JSON from response OnlyMoon:', rejectionReason, responseClone1);
            responseClone1.text().then(function (bodyText: any) {
                console.log('Received the following instead of valid JSON:', bodyText); 
            });
        });
        if (info1) {
            var holder_msg = 'Holders: ';
            for (let i = 0; i < info1.length; i++) {
                let eachInfo = info1[i];
                if (eachInfo) {
                    let title = ctx.emoji`${"locked"} <b>LP LOCK</b> | ${eachInfo[8]} | ${eachInfo[9]} \n\n`
                    let ca_msg = `<a href="https://basescan.org/address/${eachInfo[0]}">CA:</a> <code>${eachInfo[0]}</code>\n \n`;
                    let lock_msg = ctx.emoji`<b>${'locked'} Liquidity: **${eachInfo[2]} % of Liquidity Locked for ${eachInfo[1]} days**</b>\n`;
                    let mc_msg = ctx.emoji`${"bar_chart"} MC: <b>${formatter.format(eachInfo[11])}</b>\n`
                    let total_msg = ctx.emoji`${"busts_in_silhouette"} Total holders: ${eachInfo[3]} \n`;
                    let ca_balance_msg = `Contract Balance: ${eachInfo[5]}% \n`;
                    let renounced_msg = ctx.emoji`Renounced: ${"cross_mark"} \n`
                    if (eachInfo[5]) { renounced_msg = ctx.emoji`Renounced: ${"check_mark_button"} \n` }
                    let initLp_msg = ctx.emoji`${"money_with_wings"} Init LP: ${eachInfo[7]} ETH \n`;
                    let holderAddress = Object.keys(eachInfo[4]);
                    let list_msg = [];
                    let holderLimit = 5;
                    if (holderLimit > holderAddress.length) { holderLimit = holderAddress.length }
                    for (let i = 0; i < holderLimit; i++) {
                        list_msg.push(`<a href="https://basescan.org/address/${holderAddress[i]}">${eachInfo[4][holderAddress[i]]}%</a>`)
                    }
                    let tg_msg = title + ca_msg + lock_msg + mc_msg + total_msg + ca_balance_msg + renounced_msg + initLp_msg + holder_msg + list_msg.join(' | ');
                    await bot.api.sendMessage(
                        chatId,
                        tg_msg,
                        { parse_mode: "HTML" },
                    );
                }
            }
        }

        const urlLockUNCX = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=${startblock}&toBlock=${currentBlock}&address=0x231278eDd38B00B07fBd52120CEf685B9BaEBCC1&topic0=0x3bf9c85fbe37d401523942f10940796acef64062e1a1c45647978e32f4969f5c&page=1&offset=1000&apikey=${process.env.API_BASESCAN_KEY}`
        var responseClone2: any;
        let info2 = await fetch(urlLockUNCX)
        .then(function (response) {
            responseClone2 = response.clone(); 
            return response.json();
        })
        .then(async function (data) {
            await delay(1000);
                let output = [];
                if (data['result'] !== 'Error!' && data['result'].length > 0) {
                    // console.log('Lock: ', data['result'])
                    for (let i = 0; i < data['result'].length; i++) {
                        const txHash = data['result'][i]['transactionHash'];
                        const lockInfo = await getLockInfoUNCX(txHash);
                        output.push(lockInfo)

                        return output
                    }
                }
        }, function (rejectionReason) { 
            console.log('Error parsing JSON from response UNCX:', rejectionReason, responseClone2);
            responseClone2.text().then(function (bodyText: any) {
                console.log('Received the following instead of valid JSON:', bodyText); 
            });
        });
        // console.log('Info lock:', info)

        if (info2) {
            var holder_msg = 'Holders: ';
            for (let i = 0; i < info2.length; i++) {
                let eachInfo = info2[i];
                if (eachInfo) {
                    let title = ctx.emoji`${"locked"} <b>LP LOCK</b> | ${eachInfo[8]} | ${eachInfo[9]} \n\n`
                    let ca_msg = `<a href="https://basescan.org/address/${eachInfo[0]}">CA:</a> <code>${eachInfo[0]}</code>\n \n`;
                    let lock_msg = ctx.emoji`<b>${'locked'} Liquidity: **${eachInfo[2]} % of Liquidity Locked for ${eachInfo[1]} days**</b>\n`;
                    let mc_msg = ctx.emoji`${"bar_chart"} MC: <b>${formatter.format(eachInfo[11])}</b>\n`
                    let total_msg = ctx.emoji`${"busts_in_silhouette"} Total holders: ${eachInfo[3]} \n`;
                    let ca_balance_msg = `Contract Balance: ${eachInfo[5]}% \n`;
                    let renounced_msg = ctx.emoji`Renounced: ${"cross_mark"} \n`
                    if (eachInfo[5]) { renounced_msg = ctx.emoji`Renounced: ${"check_mark_button"} \n` }
                    let initLp_msg = ctx.emoji`${"money_with_wings"} Init LP: ${eachInfo[7]} ETH \n`;
                    let holderAddress = Object.keys(eachInfo[4]);
                    let list_msg = [];
                    let holderLimit = 5;
                    if (holderLimit > holderAddress.length) { holderLimit = holderAddress.length }
                    for (let i = 0; i < holderLimit; i++) {
                        list_msg.push(`<a href="https://basescan.org/address/${holderAddress[i]}">${eachInfo[4][holderAddress[i]]}%</a>`)
                    }
                    let tg_msg = title + ca_msg + lock_msg + mc_msg + total_msg + ca_balance_msg + renounced_msg + initLp_msg + holder_msg + list_msg.join(' | ');
                    await bot.api.sendMessage(
                        chatId,
                        tg_msg,
                        { parse_mode: "HTML" },
                    );
                }
            }
        }
        await delay(2500);
        await getLockInfo(trueOrFalse, chatId, ctx);
    }
}

//START COMMAND
bot.command('start', async (ctx) => {
    const chatId = -1002085734483;
    console.log('Lock bot started!!!')
    try {
        try {
            await getLockInfo(true, chatId, ctx);
        } catch (error) {
            console.log(error)
        }
        await delay(1000);
    } catch (error) {
        console.log(error)
    }
});


//HELP COMMAND
bot.command('help', async (ctx) => {
    const chatId = ctx.msg.chat.id;
    await bot.api.sendMessage(
        chatId,
        'Help',
        { parse_mode: "HTML" },
    );
});

// Always exit any conversation upon /cancel
bot.command("stop", async (ctx) => {
    await ctx.reply("Leaving...");
});

//CRASH HANDLER
bot.catch((err) => {
    const ctx = err.ctx;
    console.log(`[bot-catch][Error while handling update ${ctx.update.update_id}]`, err.error);
    const e = err.error;

    if (e instanceof GrammyError) {
        console.log(`[bot-catch][Error in request ${ctx.update.update_id}]`, e.message, e.stack)
    } else if (e instanceof HttpError) {
        console.log(`[bot-catch][Error in request ${ctx.update.update_id}]`, e.error, e.stack)
    } else {
        console.log(`[bot-catch][Error in request ${ctx.update.update_id}]`, e)
    }
});

export { bot };
