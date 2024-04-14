import Web3 from "web3";
import { BaseScanAPI } from "../shared/apis/basescan.api";
import { Message } from "./message";
import { TimeHelper } from "../shared/helpers/time.helper";
import { BotContext, IBotCommand } from "../shared/type";
import { Bot } from "grammy";
import { ParseModeFlavor } from "@grammyjs/parse-mode";
import { TFDataPool } from "./pool/TF.pool";


export class LockBotHandlerTF implements IBotCommand {

    private _web3: Web3;

    public constructor() {
        this._web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ALCHEMY_ENDPOINT_BASE}`))
    }

    public registerStartCommand(bot: Bot<ParseModeFlavor<BotContext>>): void {
        bot.command('start', async (ctx: any) => {
            
            this.executeStartCommand(bot, ctx);
        });
    }

    public registerHelpCommand(bot: Bot<ParseModeFlavor<BotContext>>): void {
        bot.command('help', async (ctx: any) => {
            const chatId = ctx.msg.chat.id;

            await bot.api.sendMessage(
                chatId,
                'Help',
                { parse_mode: "HTML" },
            );
        });
    }

    public registerStopCommand(bot: Bot<ParseModeFlavor<BotContext>>): void {
        bot.command("stop", async (ctx: any) => {
            await ctx.reply("Leaving...");
        });
    }

    public async executeStartCommand(bot: Bot<ParseModeFlavor<BotContext>>, ctx: any): Promise<void> {
        console.log('LOCK TF IS RUNNING');
        const chatId = process.env.CHAT_ID ? process.env.CHAT_ID : -4114916111

        while (true) {
            try {
                await this._startSendingMessagesTF(true, chatId, ctx, bot);
                await TimeHelper.delay(4.5);
            }
            catch (e) {
                console.error(e);
                continue
            }
        }
    }

    private async _startSendingMessagesTF(trueOrFalse: boolean, chatId: any, ctx: any, bot: any): Promise<void> {
        if (!trueOrFalse) {
            return;
        }

        const currentBlock = await this._web3.eth.getBlockNumber().then(value => { return Number(value) });
        // const startblock = Number(currentBlock)-3;
        const startblock = 13124147;

        const resp = await BaseScanAPI.getLockTF(currentBlock, startblock);

        if (!(resp?.result !== 'Error!' && resp?.result?.length > 0)) {
            return;
        }

        for (let i = 0; i < resp?.result.length; i++) {
            const transactionHash: string = resp.result[0]?.transactionHash;
            const dataPool = new TFDataPool(transactionHash, 'TF');
            const message = new Message(dataPool, ctx);

            const msgContent = await message.getMsgContent(bot);

            if (msgContent != ''){
                await bot.api.sendMessage(
                    chatId,
                    msgContent,
                    { parse_mode: "HTML" },
                );
            } else {
                console.log(`Error in tx: ${transactionHash}`)
            }
        }
    }
}