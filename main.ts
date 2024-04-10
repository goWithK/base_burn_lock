// import { LockBot } from "./source/lock_bot/bot";
import * as dotenv from 'dotenv';
import TelegramBot from './source/shared/bot';
import { LockBotHandler } from './source/lock_bot/handler';


dotenv.config();

const runApp = async () => {
    //TODO: input argument to define which bot
    try {
        const commandHandler = new LockBotHandler();
        const bot = new TelegramBot(commandHandler);
        bot.run();
    } catch (error: any) {
        console.log(`${error.stack.toString()}`)
    }
};

runApp();
