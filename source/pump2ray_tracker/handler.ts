import Web3 from "web3";
import { Connection, PublicKey } from '@solana/web3.js';
import { TimeHelper } from "../shared/helpers/time.helper";
import { BotContext, IBotCommand } from "../shared/type";
import { Bot } from "grammy";
import { ParseModeFlavor } from "@grammyjs/parse-mode";
import { formatter, convertSeconds } from '../shared/helpers/utils';
import "dotenv/config";

export class FilterBotHandler implements IBotCommand {

    private _web3: Connection;

    public constructor() {
        this._web3 = new Connection(process.env.HTTP_URL!, {wsEndpoint: process.env.WSS_URL});
    }

    public registerStartCommand(bot: Bot<ParseModeFlavor<BotContext>>): void {
        bot.command('start', async (ctx: any) => {
            this.executeStartCommand(bot, ctx);
        });
    }

    public async executeStartCommand(bot: Bot<ParseModeFlavor<BotContext>>, ctx: any): Promise<void> {
        console.log('FILTERING IS RUNNING');
        const chatId = process.env.CHAT_ID
        var previousAddress: any = [];

        while (true) {
            try {
                await TimeHelper.delay(5);
                const minSocial: number  = 0;
                const topHolder: number = 0;
                const prevExchange: string = 'pump';
                const tokenAgeTo: number = Math.floor(Date.now()/1000);
                const tokenAgeFrom: number = tokenAgeTo - 86400;
                const volumeFrom: number = 299_000;
                const volumeTo: number = 400_000;
                const mktCapFrom: number = 99_000;
                const orderBy: string = 'listraydium';
                const interval: number = 1440;
                const limit: number = 20;

                const resp =  await this._getData(
                    minSocial,
                    topHolder,
                    prevExchange,
                    volumeFrom,
                    volumeTo,
                    mktCapFrom,
                    tokenAgeFrom,
                    tokenAgeTo,
                    orderBy,
                    interval,
                    limit
                )
                // console.log(resp) 

                for (let i=0; i<resp.length; i++) {
                    let tokenAddress:string = resp[i]?.address;
                    let topHolderPerc = resp[i]?.top10HolderPercent;
                    if(topHolderPerc < 50) {
                        // currentAddress.push(tokenAddress)
                        if (previousAddress.includes(tokenAddress) != true) {
                            previousAddress.push(tokenAddress)
                            await this._startSendingMessages(chatId, ctx, bot, resp[i]);
                        }
                    }
                }
                if (previousAddress.length > 10) {
                    previousAddress.shift()
                }
            }
            catch (e) {
                console.error('Error when getting event', e);
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

    private async _startSendingMessages(chatId: any, ctx: any, bot: any, data: any): Promise<void> {
        //Name + Symbol
        let title = ctx.emoji`${"bullseye"}<a href="https://solscan.io/token/${data?.address}">${data?.name} | ${data?.symbol}</a>\n\n`
        //MktCap
        let line4msg = `<b>Marketcap:</b> <code>${formatter.format(data?.marketCap)}</code> \n`
        //CA
        let line1msg = ctx.emoji`${"money_bag"} <b>CA:</b> <code>${data?.address}</code> \n\n`;
        //Dev Stats
        let line2msg = `<b>Dev Address:</b> <code>${data?.owner}</code> \n`
        //Total Hold
        let line3msg = `<b>Top 10 hold:</b> ${Math.round(data?.top10HolderPercent)}%\n`;
        let line5msg = `<b>Holders:</b> ${Math.round(data?.holder)}\n`;
        let line6msg = `<b>Trading volume:</b> ${formatter.format(data?.txns?.all?.volume)}\n\n`;

        let line7msg = `<b>Buy Now:</b> <a href="">STB</a> | <a href="">MevX (Bot)</a> | <a href="">MevX (Web)</a> \n\n`
        let line8msg = `<b>Chart:</b> https://mevx.io/solana/${data?.address}\n`;
        let line9msg = `Copyright © 4AM`
        let line10msg = `<b>Age:</b> ${convertSeconds((Date.now() / 1000) - data?.createTime)}\n`;
        
        let msgContent = title + line4msg + line1msg + line10msg + line2msg + line3msg + line5msg + line6msg + line7msg + line8msg + line9msg;
        if (msgContent != '') {
            await bot.api.sendMessage(
                chatId,
                msgContent,
                { parse_mode: "HTML" },
            );
        } else {
            console.log(`Error at time: ${Date.now()/1000}`)
        }
    }

    private async _getTopHolderPercent (tokenAddress: string) {
        const tokenMintPublicKey = new PublicKey(tokenAddress);

        const largestAccounts = await this._web3.getTokenLargestAccounts(tokenMintPublicKey, 'finalized');
        const accountData: any = largestAccounts?.value;
        var top10HoldPercent = 0;
        const limitHolders = 10;
        const totalSupply = 1_000_000_000;
        for(let i=0; i < limitHolders; i++) {
            let holdPercent = accountData[i+1]?.uiAmount / totalSupply *100;
            top10HoldPercent += holdPercent
        }
        
        return top10HoldPercent
    }

    private async _getData (
        minSocial: number,
        topHoler: number,
        prevExchange: string,
        volumeFrom: number,
        volumeTo: number,
        mktCapFrom: number,
        tokenAgeFrom: number,
        tokenAgeTo: number,
        orderBy: string,
        interval: number,
        limit: number
    ) {
        const getDataEndpoint = `https://api.mevx.io/trade/memezone?minSocial=${minSocial}&topHolder=${topHoler}&prevExchange=${prevExchange}&volumeFrom=${volumeFrom}&volumeTo=${volumeTo}&mktCapFrom=${mktCapFrom}&tokenAgeFrom=${tokenAgeFrom}&tokenAgeTo=${tokenAgeTo}&orderBy=${orderBy}&interval=${interval}&limit=${limit}`;
        // console.log(getDataEndpoint)
    
        const resp = await fetch(getDataEndpoint, {
            headers: {
                'accept': '*/*',
                'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
                'content-type': 'application/json',
                'origin': 'https://mevx.io',
                'priority': 'u=1, i',
                'referer': 'https://mevx.io/',
                'sec-ch-ua': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
                'sec-ch-ua-mobile': '?0',
                // 'sec-ch-ua-platform': 'macOS',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                // 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
            }
        });

        return resp.json();
    }
}