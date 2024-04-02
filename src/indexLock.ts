import { run } from '@grammyjs/runner';
import { bot } from './BaseLockbot';

const runBot = () => {
    if (!bot.isInited()) {
        console.log('BOT LOCK INITIATED!!!');
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
