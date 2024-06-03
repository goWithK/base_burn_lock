import Web3 from "web3";
import { BotContext } from "../shared/type";
import { Bot } from "grammy";
import { ParseModeFlavor } from "@grammyjs/parse-mode";


export class PumpFilterBotHandler{

    private _web3: Web3;

    public constructor() {
        this._web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ALCHEMY_ENDPOINT_BASE}`))
    }

    public registerStartCommand(bot: Bot<ParseModeFlavor<BotContext>>): void {
        console.log('PUMP')
        bot.on(':text', async (ctx: any) => {
            this.executeStartCommand(bot, ctx);
        });
    }

    public async executeStartCommand(bot: Bot<ParseModeFlavor<BotContext>>, ctx: any): Promise<void> {
        if (ctx.update.channel_post) {
            const content = ctx.update.channel_post.text;
            const chatId = ctx.update.channel_post.chat.id;
            const messageId = ctx.update.channel_post.message_id;
    
            const regex = /[+-]?\d+(\.\d+)?/g;
            const stringList = content.split('\n');
            console.log(stringList)
            // console.log('---', stringList[7])
            if (stringList[7].includes('SOL')) {
                let boughtAmount = parseFloat(String(stringList[7].match(regex)));
                if (boughtAmount < 10) {
                    await bot.api.deleteMessage(chatId, messageId)
                    return 
                }
            } else {
                await bot.api.deleteMessage(chatId, messageId)
                return 
            }
        }
    }
}