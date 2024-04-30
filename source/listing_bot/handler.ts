import Web3 from "web3";
import { BaseScanAPI } from "../shared/apis/basescan.api";
import { Message } from "./message";
import { TimeHelper } from "../shared/helpers/time.helper";
import { BotContext, IBotCommand } from "../shared/type";
import { Bot } from "grammy";
import { ParseModeFlavor } from "@grammyjs/parse-mode";
import { ListingDataPool } from "../listing_bot/pool";


export class ListingBotHandler implements IBotCommand {

    private _web3: Web3;

    public constructor() {
        this._web3 = new Web3(new Web3.providers.HttpProvider(`${process.env.ALCHEMY_ENDPOINT_BASE}`))
    }

    public registerStartCommand(bot: Bot<ParseModeFlavor<BotContext>>): void {
        bot.command('start', async (ctx: any) => {
            this.executeStartCommand(bot, ctx);
        });
    }

    public async executeStartCommand(bot: Bot<ParseModeFlavor<BotContext>>, ctx: any): Promise<void> {
        console.log('LISTING IS RUNNING');
        const chatId = process.env.CHAT_ID ? process.env.CHAT_ID : -4114916111

        while (true) {
            try {
                await this._startSendingMessagesUniv2(true, chatId, ctx, bot);
                await this._startSendingMessagesUniv3(true, chatId, ctx, bot);
                await this._startSendingMessagesSushi(true, chatId, ctx, bot);
                await TimeHelper.delay(1.5);
            }
            catch (e) {
                console.error(e);
                continue
            }
        }

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

    private async _startSendingMessagesUniv2(trueOrFalse: boolean, chatId: any, ctx: any, bot: any): Promise<void> {
        if (!trueOrFalse) {
            return;
        }

        const currentBlock = await this._web3.eth.getBlockNumber().then(value => { return Number(value) });
        const startblock = Number(currentBlock)-3;
        // const currentBlock = 13751334;
        // const startblock = 13835431;
        await TimeHelper.delay(1);
        const resp = await BaseScanAPI.getListingUniV2(currentBlock, startblock);

        if (!(resp?.result !== 'Error!' && resp?.result?.length > 0)) {
            return;
        }
        
        for (let i = 0; i < resp?.result.length; i++) {
            const transactionHash: string = resp?.result[i]?.transactionHash;
            var contractAddress: string = '0x' + `${resp?.result[i]?.topics[2].slice(26, resp?.result[i]?.topics[2].length)}`;
            if (contractAddress == '0x4200000000000000000000000000000000000006') {
                contractAddress= '0x' + `${resp?.result[i]?.topics[1].slice(26, resp?.result[i]?.topics[1].length)}`;
            }
            const pairAddress: string = '0x' + `${resp?.result[i]?.data.slice(26,66)}`;

            const dataPool = new ListingDataPool(transactionHash, contractAddress, pairAddress);
            const message = new Message(dataPool, ctx);
            
            const msgContent = await message.getMsgContent();
            
            if (msgContent != ''){
                await bot.api.sendMessage(
                    chatId,
                    msgContent,
                    { parse_mode: "HTML" },
                );
            } else {
                console.log(`Error in tx: ${transactionHash} or holders <= 5`)
            }
        }
    }

    private async _startSendingMessagesUniv3(trueOrFalse: boolean, chatId: any, ctx: any, bot: any): Promise<void> {
        if (!trueOrFalse) {
            return;
        }

        const currentBlock = await this._web3.eth.getBlockNumber().then(value => { return Number(value) });
        const startblock = Number(currentBlock)-3;
        // const startblock = 13712267;
        // const currentBlock = 13712268;
        await TimeHelper.delay(1);
        const resp = await BaseScanAPI.getListingUniV3(currentBlock, startblock);

        if (!(resp?.result !== 'Error!' && resp?.result?.length > 0)) {
            return;
        }
        
        for (let i = 0; i < resp?.result.length; i++) {
            const transactionHash: string = resp?.result[i]?.transactionHash;
            var contractAddress: string = '0x' + `${resp?.result[i]?.topics[2].slice(26, resp?.result[i]?.topics[2].length)}`;
            if (contractAddress == '0x4200000000000000000000000000000000000006') {
                contractAddress= '0x' + `${resp?.result[i]?.topics[1].slice(26, resp?.result[i]?.topics[1].length)}`;
            }
            const pairAddress: string = '0x' + `${resp?.result[i]?.data.slice(90,130)}`;

            const dataPool = new ListingDataPool(transactionHash, contractAddress, pairAddress);
            const message = new Message(dataPool, ctx);
            
            const msgContent = await message.getMsgContent();
            
            if (msgContent != ''){
                await bot.api.sendMessage(
                    chatId,
                    msgContent,
                    { parse_mode: "HTML" },
                );
            } else {
                console.log(`Error in tx: ${transactionHash} or holders <= 5`)
            }
        }
    }

    private async _startSendingMessagesSushi(trueOrFalse: boolean, chatId: any, ctx: any, bot: any): Promise<void> {
        if (!trueOrFalse) {
            return;
        }

        const currentBlock = await this._web3.eth.getBlockNumber().then(value => { return Number(value) });
        const startblock = Number(currentBlock)-3;
        // const startblock = 13746414;
        await TimeHelper.delay(1);
        const resp = await BaseScanAPI.getListingSushi(currentBlock, startblock);

        if (!(resp?.result !== 'Error!' && resp?.result?.length > 0)) {
            return;
        }
        
        for (let i = 0; i < resp?.result.length; i++) {
            const transactionHash: string = resp?.result[i]?.transactionHash;
            var contractAddress: string = '0x' + `${resp?.result[i]?.topics[2].slice(26, resp?.result[i]?.topics[2].length)}`;
            if (contractAddress == '0x4200000000000000000000000000000000000006') {
                contractAddress= '0x' + `${resp?.result[i]?.topics[1].slice(26, resp?.result[i]?.topics[1].length)}`;
            }
            const pairAddress: string = '0x' + `${resp?.result[i]?.data.slice(26,66)}`;

            const dataPool = new ListingDataPool(transactionHash, contractAddress, pairAddress);
            const message = new Message(dataPool, ctx);
            
            const msgContent = await message.getMsgContent();
            
            if (msgContent != ''){
                await bot.api.sendMessage(
                    chatId,
                    msgContent,
                    { parse_mode: "HTML" },
                );
            } else {
                console.log(`Error in tx: ${transactionHash} or holders <= 5`)
            }
        }
    }
}