// import { LockBot } from "./source/lock_bot/bot";
import TelegramBot from './source/shared/bot';
import { LockBotHandler } from './source/lock_bot/handler';
import { BurnBotHandler } from './source/burn_bot/handler';
import * as dotenv from 'dotenv';
dotenv.config();


dotenv.config();

const runApp = async () => {
    try {
        let mode = process.argv.slice(2)[0]
        if (mode == 'lock') {
            const commandHandler = new LockBotHandler();
            const bot = new TelegramBot(commandHandler, process.env.LOCK_BASE_BOT ? process.env.LOCK_BASE_BOT : '');
            bot.run();
        } 
        else if (mode == 'burn') {
            const commandHandler = new BurnBotHandler();
            const bot = new TelegramBot(commandHandler, process.env.BURN_BASE_BOT ? process.env.BURN_BASE_BOT : '');
            bot.run();
        }
        
    } catch (error: any) {
        console.log(`${error.stack.toString()}`)
    }
};

runApp();
