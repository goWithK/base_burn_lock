import { run } from '@grammyjs/runner';
import { bot } from './BaseBurnbot';

const runBot = () => {
    if (!bot.isInited()) {
        console.log('BOT BURN INITIATED!!!');
        run(bot);
    }
};

const runApp = async () => {
    try {
        runBot();
    } catch (error: any) {
        console.log(`${error.stack.toString()}`)
    }
};

runApp();
