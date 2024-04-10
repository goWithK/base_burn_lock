import Web3 from "web3";
import { BaseScanAPI } from "../shared/apis/basescan.api";
import { Message } from "./message";
import { DataPool } from "./pool/OM.pool";
import { TimeHelper } from "../shared/helpers/time.helper";
import { BotContext, IBotCommand } from "../shared/type";
import { Bot } from "grammy";
import { ParseModeFlavor } from "@grammyjs/parse-mode";


export class LockBotHandler implements IBotCommand {

    private _web3: Web3;

    public constructor() {
        this._web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ALCHEMY_ENDPOINT_BASE}`))
    }

    public start(bot: Bot<ParseModeFlavor<BotContext>>): void {
        bot.command('start', async (ctx: any) => {
            console.log('LOCK IS RUNNING')
            console.log(typeof ctx);
            const chatId = -4114916111;
            // const tgMsg = ctx.emoji`${"locked"} <b>LP LOCK</b> | Test | Test \n\n`

            while (true) {
                await this._startSendingMessages(true, chatId, ctx, bot);
                await TimeHelper.delay(2.5);
            }

            // await bot.api.sendMessage(
            //     chatId,
            //     tgMsg,
            //     { parse_mode: "HTML" },
            // );

            // await TimeHelper.delay(3.5);
        });
    }

    public help(bot: Bot<ParseModeFlavor<BotContext>>): void {
        bot.command('help', async (ctx: any) => {
            const chatId = ctx.msg.chat.id;

            await bot.api.sendMessage(
                chatId,
                'Help',
                { parse_mode: "HTML" },
            );
        });
    }

    public stop(bot: Bot<ParseModeFlavor<BotContext>>): void {
        bot.command("stop", async (ctx: any) => {
            await ctx.reply("Leaving...");
        });
    }

    private async _startSendingMessages(trueOrFalse: boolean, chatId: any, ctx: any, bot: any): Promise<void> {
        if (!trueOrFalse) {
            return;
        }

        const currentBlock = await this._web3.eth.getBlockNumber().then(value => { return Number(value) });
        // const startblock = Number(currentBlock)-3;
        const startblock = 12176231;

        const resp = await BaseScanAPI.getLockOM(currentBlock, startblock);

        if (!(resp?.result !== 'Error!' && resp?.result?.length > 0)) {
            return;
        }

        const transactionHash: string = resp.result[0]?.transactionHash;
        const dataPool = new DataPool(transactionHash, 'OM');
        const message = new Message(dataPool, ctx);

        const msgContent = await message.getMsgContent();

        if (msgContent != ''){
            await bot.api.sendMessage(
                chatId,
                msgContent,
                { parse_mode: "HTML" },
            );
        }
    }
}