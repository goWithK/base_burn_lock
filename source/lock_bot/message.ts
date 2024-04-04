// Used to build & send Telegram Message

import { Bot, GrammyError, HttpError, session } from 'grammy';
import type { ParseModeFlavor } from '@grammyjs/parse-mode';
import { BotContext } from '../../src/types';
import DataPool from './pool';

const bot = new Bot<ParseModeFlavor<BotContext>>(process.env.LOCK_BASE_BOT || '');

class Message {


    private _content: string;
    private _dataPool: DataPool;

    private _chatCtx: any;

    public constructor(chatId: any, chatCtx: any) {
        this._chatCtx = chatCtx;
        this._dataPool = new DataPool();
    }

    public async fillData(): Promise<void> {
        const title = this._chatCtx.emoji`${"locked"} <b>LP LOCK</b> | ${await this._dataPool.tokenName} | ${await this._dataPool.tokenSymbol} \n\n`
        const lock = this._chatCtx.emoji`<b>${'locked'} Liquidity: **${await this._dataPool.liquidity} % of Liquidity Locked for ${await this._dataPool.lockDays} days**</b>\n`;

        this._content = title + lock;
    }

    public async send(chatId: string): Promise<void> {
        await bot.api.sendMessage(
            chatId,
            this._content,
            { parse_mode: "HTML" },
        );
    }
}
