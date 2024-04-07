import { Bot, Context, SessionFlavor } from 'grammy';
import {
    type Conversation,
    type ConversationFlavor,
} from '@grammyjs/conversations';
import { type EmojiFlavor } from '@grammyjs/emoji';
import { ParseModeFlavor } from '@grammyjs/parse-mode';

interface SessionData {
    itemLevel: string;
    isDEGANft: boolean;
}
export type MyContext = EmojiFlavor<Context>;
export type SessionContext = Context & SessionFlavor<SessionData>;
export type BotContext = SessionContext & ConversationFlavor & MyContext;
export type ConverstaionContext = Conversation<BotContext>;


export interface IBotCommand {
    start(bot: Bot<ParseModeFlavor<BotContext>>): void;
    stop(bot: Bot<ParseModeFlavor<BotContext>>): void;
    help(bot: Bot<ParseModeFlavor<BotContext>>): void;
}

export enum BotType {
    Lock = 'lock_bot'
}