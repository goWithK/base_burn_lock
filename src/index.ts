import { run } from '@grammyjs/runner';
// import { bot } from './ETHBurnbot';
import { bot } from './BaseLockbot';

const runBot = () => {
    if (!bot.isInited()) {
        console.log('BOT INITIATED!!!');
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
