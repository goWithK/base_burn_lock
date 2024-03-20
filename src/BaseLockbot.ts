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
import { getBurnTx, getLockInfoMoon } from './commands/burnLPBase';

//Env vars
const BOT_TOKEN = process.env.BURN_ETH_BOT || '';
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
// bot.use(emojiParser);
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

function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function getBurnInfo(trueOrFalse: boolean, chatId: any) {
    try {
        if(trueOrFalse) {
            const currentBlock = await web3.eth.getBlockNumber().then(value => { return Number(value) });
            const UrlTransferBurn = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=${Number(currentBlock)-3}&toBlock=${currentBlock}&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef&topic0_2_opr=and&topic2=0x000000000000000000000000000000000000000000000000000000000000dead&page=1&offset=100&apikey=${process.env.API_BASESCAN_KEY4}`
            let info = await fetch(UrlTransferBurn).then(
                response => response.json()
            ).then(
                async data => {
                    if (data['result'] !== 'Error!' && data['result'].length > 0) {
                        // console.log('Burn: ', data['result'])
                        let output = [];
                        for (let i = 0; i < data['result'].length;  i++) {
                            const txHash = data['result'][i]['transactionHash'];
                            const lockInfo = await getBurnTx(txHash);
                            output.push(lockInfo)
                        }
    
                        return output
                    }
                } 
            );
            if (info){
                for (let i = 0; i < info.length; i++) {
                    let eachInfo = info[i];
                    let holder_msg = 'Holders: ';
                    if (eachInfo){
                        let ca_msg = `<a href="https://basescan.org/address/${eachInfo[0]}">CA:</a> <b>${eachInfo[0]}</b>\n \n`;
                        let burn_msg = `Liquidity: <b> <strong>${eachInfo[1]}% of Liquidity Burnt</strong>.</b>\n`
                        let total_msg = `Total holders: ${eachInfo[2]} \n`;
                        let ca_balance_msg = `Contract Balance: ${eachInfo[4]} \n`;
                        let renounced_msg = `Renounced: Not yet \n`
                        if (eachInfo[5]) {renounced_msg = `Renounced: Yes \n`}
                        // let initLp_msg = `Init LP: ${eachInfo[6]}`
                        let holderAddress = Object.keys(eachInfo[3]);
                        let list_msg = [];
                        let holderLimit = 10;
                        if (holderLimit > holderAddress.length) { holderLimit = holderAddress.length}
                        for (let i=0; i < holderLimit; i++) {
                            list_msg.push(`<a href="https://basescan.org/address/${holderAddress[i]}">${eachInfo[3][holderAddress[i]]}</a>`)
                        }
                        let tg_msg = ca_msg + burn_msg + total_msg + ca_balance_msg + renounced_msg + holder_msg + list_msg.join(' | ');
                        await bot.api.sendMessage(
                            chatId,
                            tg_msg,
                            { parse_mode: "HTML" },
                        );
                    }
                }
            }
            await delay(5000);
            await getBurnInfo(trueOrFalse, chatId);
        }
        
    } catch (error) {
        console.log(error)
    }
}

async function getLockInfo(trueOrFalse: boolean, chatId: any) {
    try {
        if(trueOrFalse) {
            const currentBlock = await web3.eth.getBlockNumber().then(value => { return Number(value) });
            const UrlLockTokenMoon = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=${Number(currentBlock)-3}&toBlock=${currentBlock}&address=0x77110f67C0EF3c98c43570BADe06046eF6549876&topic0=0x531cba00a411ade37b4ca8175d92c94149f19536bd8e5a83d581aa7f040d192e&page=1&offset=1000&apikey=${process.env.API_BASESCAN_KEY}`

            let info = await fetch(UrlLockTokenMoon).then(
                response => response.json()
            ).then(
                async data => {
                    if (data['result'] !== 'Error!' && data['result'].length > 0) {
                        // console.log('Lock: ', data['result'])
                        let output = [];
                        for (let i = 0; i < data['result'].length;  i++) {
                            const txHash = data['result'][i]['transactionHash'];
                            if (txHash) {
                                const lockInfo = await getLockInfoMoon(txHash);
                                output.push(lockInfo)
                            } else {
                                console.log(data['result'])
                            }
                            
                        }
    
                        return output
                    }
                }
            );
            if (info){
                var holder_msg = 'Holders: ';
                for (let i = 0; i < info.length; i++) {
                    let eachInfo = info[i];
                    if (eachInfo){
                        let ca_msg = `<a href="https://basescan.org/address/${eachInfo[0]}">CA:</a> <b>${eachInfo[0]}</b>\n \n`;
                        let lock_msg = `<b>Liquidity: <strong>${eachInfo[2]} % of Liquidity Locked for ${Math.round(eachInfo[1])} days</strong>.</b>\n`;
                        let total_msg = `Total holders: ${eachInfo[2]} \n`;
                        let ca_balance_msg = `Contract Balance: ${eachInfo[5]} \n`;
                        let renounced_msg = `Renounced: Not yet\n`
                        if (eachInfo[6]) {renounced_msg = `Renounced: Yes\n`}
                        // let initLp_msg = `Init LP: ${eachInfo[6]}`
                        let holderAddress = Object.keys(eachInfo[4]);
                        let list_msg = [];
                        let holderLimit = 10;
                        if (holderLimit > holderAddress.length) { holderLimit = holderAddress.length}
                        for (let i=0; i < holderLimit; i++) {
                            list_msg.push(`<a href="https://basescan.org/address/${holderAddress[i]}">${eachInfo[4][holderAddress[i]]}%</a>`)
                        }
                        let tg_msg = ca_msg + lock_msg + total_msg + ca_balance_msg + renounced_msg + holder_msg + list_msg.join(' | ');
                        await bot.api.sendMessage(
                            chatId,
                            tg_msg,
                            { parse_mode: "HTML" },
                        );
                    }
                }
            }
            await delay(5000);
            await getLockInfo(trueOrFalse, chatId);
        }
        
    } catch (error) {
        console.log(error)
    }
}

//START COMMAND
bot.command('start', async (ctx) => {
    const chatId = ctx.msg.chat.id;
    await getLockInfo(true, chatId); 
    await getBurnInfo(true, chatId);  
    await delay(1000);    
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
