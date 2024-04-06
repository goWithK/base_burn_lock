import { LockBot } from "./source/lock_bot/bot";

const runApp = async () => {
    try {
        const bot = new LockBot();
        bot.run();
    } catch (error: any) {
        console.log(`${error.stack.toString()}`)
    }
};

runApp();
