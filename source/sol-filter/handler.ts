import Web3 from "web3";
import { BotContext } from "../shared/type";
import { Bot } from "grammy";
import { ParseModeFlavor } from "@grammyjs/parse-mode";
import { matchingTickers } from './matchingTickers';


export class FilterBotHandler{

    private _web3: Web3;

    public constructor() {
        this._web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ALCHEMY_ENDPOINT_BASE}`))
    }

    public registerStartCommand(bot: Bot<ParseModeFlavor<BotContext>>): void {
        bot.on(':text', async (ctx: any) => {
            this.executeStartCommand(bot, ctx);
        });
    }

    public async executeStartCommand(bot: Bot<ParseModeFlavor<BotContext>>, ctx: any): Promise<void> {
        if (ctx.update.channel_post) {
            const content = ctx.update.channel_post.text;
            const chatId = ctx.update.channel_post.chat.id;
            const messageId = ctx.update.channel_post.message_id;
    
            // const regex = /[+-]?\d+(\.\d+)?/g;
            const stringList = content.split('\n');
            // console.log(stringList)
            // console.log('CA: ', stringList[1])
            if (!stringList[0].includes('New OpenBook')) {
                await bot.api.deleteMessage(chatId, messageId)
                return 
            }
            // console.log('----', stringList.includes('Web'))
            if (!stringList.includes('Web') || !stringList.includes('WEB')) {
                await bot.api.deleteMessage(chatId, messageId)
                return 
            }
    
            for (let i=0; i < stringList.length; i++) {
                if (!stringList[i].includes('Web') || !stringList[i].includes('WEB')) {
                    continue
                }
                
                var url = stringList[i].substring(
                    stringList[i].indexOf("/") + 2, 
                    stringList[i].lastIndexOf("/")
                );
                const tickerUrls = Object.keys(matchingTickers);
                if (!tickerUrls.includes(url)) {
                    await bot.api.deleteMessage(chatId, messageId)
                } else {
                    let ticker = stringList[2].substring(
                        stringList[2].indexOf("$") + 1, 
                        stringList[2].lastIndexOf(")")
                    )
                    if (!matchingTickers[url].includes(ticker)) {
                        await bot.api.deleteMessage(chatId, messageId)
                    }
                }
            }
        }
    }
}