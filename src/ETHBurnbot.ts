import { Bot, GrammyError, HttpError, session } from 'grammy';
import { apiThrottler } from '@grammyjs/transformer-throttler';
import { limit } from '@grammyjs/ratelimiter';
import { hydrateReply } from '@grammyjs/parse-mode';
import type { ParseModeFlavor } from '@grammyjs/parse-mode';
import { globalConfig, groupConfig, outConfig } from './common/limitsConfig';
import { BotContext } from './types';
import { COMMANDS } from './commands';
import { getBurnInfo, getLockInfo } from './commands/burnLPBase';

//Env vars
const BOT_TOKEN = process.env.BURN_ETH_BOT || '';

//BOT CONFIG
const bot = new Bot<ParseModeFlavor<BotContext>>(BOT_TOKEN);
const throttler = apiThrottler({
    global: globalConfig,
    group: groupConfig,
    out: outConfig,
});

bot.api.setMyCommands(COMMANDS);
bot.use(hydrateReply);
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
        // Allow only 3 messages to be handled every 2 seconds.
        timeFrame: 2000,
        limit: 3,
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

//START COMMAND
bot.command('start', async (ctx) => {
    const chatId = ctx.msg.chat.id;
    const UrlTransferBurn = `https://api.etherscan.io/api?module=logs&action=getLogs&&fromBlock=latest&toBlock=latest&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef&topic0_2_opr=and&topic2=0x000000000000000000000000000000000000000000000000000000000000dead&page=1&offset=100&apikey=${process.env.API_ETHERSCAN_KEY}`
    while(true) {
        try {
            let info = await fetch(UrlTransferBurn).then(
                response => response.json()
            ).then(
                async data => {
                    let output = data['result'].forEach(async (item: any) => {
                        const txHash = item['transactionHash'];
                        return await getBurnInfo(txHash)
                    })

                    return output
                }
            );
            
            let ca_msg = `<a href="https://etherscan.io/address/${info[0]}">CA:</a> <b>${info[0]}</b>`;
            let burn_msg = `<p>LP: <strong>${info[1]} % of Liquidity Burnt</strong>.</p>`
            let holder_msg = 'Holders: ';
            let holderAddress = Object.keys(info[2]);
            for (let i=0; i < holderAddress.length; i++) {
                holder_msg.concat(`<a href="https://etherscan.io/address/${holderAddress[i]}">${info[2][holderAddress[i]]}</a> |`)
            }
            await bot.api.sendMessage(
                chatId,
                `${ca_msg} <br> ${burn_msg} <br> ${holder_msg}`,
                { parse_mode: "HTML" },
            );
            
        } catch (error) {
            console.log(error)
        }
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
