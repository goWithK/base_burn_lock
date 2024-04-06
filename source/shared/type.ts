import { Context, SessionFlavor } from 'grammy';
import {
    type Conversation,
    type ConversationFlavor,
} from '@grammyjs/conversations';
import { type EmojiFlavor } from '@grammyjs/emoji';

interface SessionData {
    itemLevel: string;
    isDEGANft: boolean;
}
export type MyContext = EmojiFlavor<Context>;
export type SessionContext = Context & SessionFlavor<SessionData>;
export type BotContext = SessionContext & ConversationFlavor & MyContext;
export type ConverstaionContext = Conversation<BotContext>;


export interface IBotCommand {
    start(ctx: any): Promise<void>;
    stop(ctx: any): Promise<void>;
    help(ctx: any): Promise<void>;
}

export enum BotType {
    Lock = 'lock_bot'
}