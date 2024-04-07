import { Bot } from "grammy";
import { BotContext, IBotCommand } from "./type";
import { ParseModeFlavor } from "@grammyjs/parse-mode";

export class BaseHandler implements IBotCommand {

    public _bot: any;

    public constructor(bot: any) {
        this._bot = bot;
    }

    public start(ctx: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public async stop(ctx: any): Promise<void> {
        const chatId = ctx.msg.chat.id;

        await this._bot.api.sendMessage(
            chatId,
            'Help',
            { parse_mode: "HTML" },
        );
    }
    public async help(ctx: any): Promise<void> {
        await ctx.reply("Leaving...");
    }

}
