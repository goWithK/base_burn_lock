import { Bot, GrammyError, HttpError, session } from 'grammy';
import type { ParseModeFlavor } from '@grammyjs/parse-mode';
import { BotContext, BotType, IBotCommand } from './type';
import { hydrateReply } from '@grammyjs/parse-mode';
import { emojiParser } from '@grammyjs/emoji';
import { globalConfig, groupConfig, outConfig } from "./config";
import { apiThrottler } from '@grammyjs/transformer-throttler';
import { limit } from '@grammyjs/ratelimiter';
import { run } from '@grammyjs/runner';
import { MethodNotImplementedError } from 'web3';

class TelegramBot {

    protected _bot: Bot<ParseModeFlavor<BotContext>>;
    private _commandHandler: IBotCommand;

    public constructor (commandHandler: IBotCommand) {

        this._commandHandler = commandHandler;

        this._bot = new Bot<ParseModeFlavor<BotContext>>(
            process.env.LOCK_BASE_BOT || ''
        );

        this._initConfig();
        this._bot.catch(this._crashHandler);
        
        this._commandHandler.start(this._bot);
        this._commandHandler.stop(this._bot);
        this._commandHandler.help(this._bot);
    }

    private _initConfig(): void {
        this._bot.use(hydrateReply);
        this._bot.use(emojiParser());
        
        this._bot.api.config.use(apiThrottler({
            global: globalConfig,
            group: groupConfig,
            out: outConfig,
        }));

        this._bot.use(
            session({
                initial() {
                    // return empty object for now
                    return {};
                },
            })
        );

        this._bot.use(
            limit({
                // Allow only 6 messages to be handled every 3 secs.
                timeFrame: 3000,
                limit: 6,
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
    }

    protected _registerCommands(): void {
        throw new MethodNotImplementedError();
    }

    private _crashHandler(err: any): void {
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
    }

    public isInited(): boolean {
        return this._bot.isInited();
    }

    public run(): void {
        if (!this.isInited()) {
            console.log('BOT INITIATED!!!');
            run(this._bot);
        }
    }
}

export default TelegramBot;