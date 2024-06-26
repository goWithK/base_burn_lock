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
import { getBurnTx } from './commands/burnLPBase';

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

async function getBurnInfo(trueOrFalse: boolean, chatId: any, ctx: any) {
    if (trueOrFalse) {
        const currentBlock = await web3.eth.getBlockNumber().then(value => { return Number(value) });
        // const startblock = Number(currentBlock)-3;
        const startblock = 12176231;
        const UrlTransferBurn = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=${startblock}&toBlock=${currentBlock}&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef&topic0_2_opr=and&topic2=0x000000000000000000000000000000000000000000000000000000000000dead&page=1&offset=100&apikey=${process.env.API_BASESCAN_KEY}`
        var responseClone: any;
        let info = await fetch(UrlTransferBurn)
        .then(function (response) {
            responseClone = response.clone(); 
            return response.json();
        })
        .then(async function (data) {
            await delay(1000);
            if (data['result'] !== 'Error!' && data['result'].length > 0) {
                // console.log('Burn: ', data['result'])
                let output = [];
                for (let i = 0; i < data['result'].length; i++) {
                    const txHash = data['result'][i]['transactionHash'];
                    const burnInfo = await getBurnTx(txHash);
                    output.push(burnInfo)

                    return output
                }
            }
        }, function (rejectionReason) { 
            console.log('Error parsing JSON from response:', rejectionReason, responseClone);
            responseClone.text().then(function (bodyText: any) {
                console.log('Received the following instead of valid JSON:', bodyText); 
            });
        });

        // console.log('Info burn:', info)
        if (info) {
            for (let i = 0; i < info.length; i++) {
                let eachInfo = info[i];
                let holder_msg = 'Holders: ';
                if (eachInfo) {
                    let title = ctx.emoji`${"fire"} <b>LP BURNT</b> | ${eachInfo[7]} | ${eachInfo[8]} \n \n`
                    let ca_msg = `<a href="https://basescan.org/address/${eachInfo[0]}">CA:</a> <code>${eachInfo[0]}</code>\n \n`;
                    console.log(formatter.format(eachInfo[10]))
                    let mc_msg = ctx.emoji`${"bar_chart"} MC: <b>${formatter.format(eachInfo[10])}</b>\n`
                    let burn_msg = `Liquidity: <b>**${eachInfo[1]}% of Liquidity Burnt**</b>\n`
                    let total_msg = ctx.emoji`${"busts_in_silhouette"} Total holders: ${eachInfo[2]} \n`;
                    let ca_balance_msg = `Clog: ${eachInfo[4]} \n`;
                    let renounced_msg = ctx.emoji`Renounced: ${"cross_mark"} \n`
                    if (eachInfo[5]) { renounced_msg = ctx.emoji`Renounced: ${"check_mark_button"} \n` }
                    let initLp_msg = ctx.emoji`${"money_with_wings"} Init LP: ${eachInfo[6]} ETH\n`;
                    let holderAddress = Object.keys(eachInfo[3]);
                    let list_msg = [];
                    let holderLimit = 5;
                    if (holderLimit > holderAddress.length) { holderLimit = holderAddress.length }
                    for (let i = 0; i < holderLimit; i++) {
                        list_msg.push(`<a href="https://basescan.org/address/${holderAddress[i]}">${eachInfo[3][holderAddress[i]]}</a>`)
                    }
                    let tg_msg = title + ca_msg + burn_msg + mc_msg +total_msg + ca_balance_msg + renounced_msg + initLp_msg + holder_msg + list_msg.join(' | ');
                    await bot.api.sendMessage(
                        chatId,
                        tg_msg,
                        { parse_mode: "HTML" },
                    );
                }
            }
        }
        await delay(4000);
        await getBurnInfo(trueOrFalse, chatId, ctx);
    }
}

//START COMMAND
bot.command('start', async (ctx) => {
    console.log('Burn bot started!!!')
    const chatId = -1002085734483;
    try {
        try {
            await getBurnInfo(true, chatId, ctx);
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
