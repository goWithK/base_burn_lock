// import { LockBot } from "./source/lock_bot/bot";
import TelegramBot from './source/shared/bot';
import { LockBotHandlerOM } from './source/lock_bot_om/handler';
import { LockBotHandlerTF } from './source/lock_bot_tf/handler';
import { LockBotHandlerV2 } from './source/lock_bot_univ2/handler';
import { LockBotHandlerV3 } from './source/lock_bot_univ3/handler';
import { BurnBotHandler } from './source/burn_bot/handler';
import { ListingBotHandler } from './source/listing_bot/handler';
import { FilterBotHandler } from './source/sol-filter/handler';
import { PumpFilterBotHandler } from './source/pump-filter/handler';
import TelegramBotFilter from './source/sol-filter/bot';
import * as dotenv from 'dotenv';
dotenv.config();

const runApp = async () => {
    try {
        let mode = process.argv.slice(2)[0];
        if (mode == 'lockOM') {
            const commandHandler = new LockBotHandlerOM();
            const bot = new TelegramBot(commandHandler, process.env.BOT_KEY ? process.env.BOT_KEY : '');
            bot.run();
        } 
        else if (mode == 'lockTF') {
            const commandHandler = new LockBotHandlerTF();
            const bot = new TelegramBot(commandHandler, process.env.BOT_KEY ? process.env.BOT_KEY : '');
            bot.run();
        } 
        else if (mode == 'lockuniv2') {
            const commandHandler = new LockBotHandlerV2();
            const bot = new TelegramBot(commandHandler, process.env.BOT_KEY ? process.env.BOT_KEY : '');
            bot.run();
        } 
        else if (mode == 'lockuniv3') {
            const commandHandler = new LockBotHandlerV3();
            const bot = new TelegramBot(commandHandler, process.env.BOT_KEY ? process.env.BOT_KEY : '');
            bot.run();
        } 
        else if (mode == 'burn') {
            const commandHandler = new BurnBotHandler();
            const bot = new TelegramBot(commandHandler, process.env.BOT_KEY ? process.env.BOT_KEY : '');
            bot.run();
        }
        else if (mode == 'listing') {
            const commandHandler = new ListingBotHandler();
            const bot = new TelegramBot(commandHandler, process.env.BOT_KEY ? process.env.BOT_KEY : '');
            bot.run();
        }
        else if (mode == 'solfilter') {
            const commandHandler = new FilterBotHandler();
            const bot = new TelegramBotFilter(commandHandler, process.env.BOT_KEY ? process.env.BOT_KEY : '');
            bot.run();
        }
        else if (mode == 'pumpfilter') {
            const commandHandler = new PumpFilterBotHandler();
            const bot = new TelegramBotFilter(commandHandler, process.env.BOT_KEY ? process.env.BOT_KEY : '');
            bot.run();
        }
        
    } catch (error: any) {
        console.log(`${error.stack.toString()}`)
    }
};

runApp();
