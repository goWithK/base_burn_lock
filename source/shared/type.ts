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

export interface IDataPool {
    renounced: Promise<boolean>;
    transactionInput: Promise<string>;
    lockInfo: Promise<any>;
    pairAddress: Promise<string>;
    deployerAddress: Promise<string>;
    exchange: Promise<string>;
    contractAddress: Promise<string>;
    lockPercent: Promise<number>;
    lockDays: Promise<number>;
    tokenName: Promise<string>;
    tokenSymbol: Promise<string>;
    tokenDecimal: Promise<number>;
    tokenTotalSupply: Promise<number>;
    totalHolders: Promise<number>;
    topHolders: Promise<{[index: string]: any}>;
    initialLp: Promise<number>;
    totalTxns: Promise<number>;
    priceToken: Promise<number>;
    liquidity: Promise<number>;
    liveTime: Promise<string>;
    marketCapLock: Promise<number>;
    deployerBalance: Promise<number>;
    verified: Promise<boolean>;
    clog: Promise<string>;
}

export interface IDataPoolBurn {
    renounced: Promise<boolean>;
    pairAddress: Promise<string>;
    deployerAddress: Promise<string>;
    exchange: Promise<string>;
    contractAddress: Promise<string>;
    tokenName: Promise<string>;
    tokenSymbol: Promise<string>;
    tokenDecimal: Promise<number>;
    tokenTotalSupply: Promise<number>;
    totalHolders: Promise<number>;
    topHolders: Promise<{[index: string]: any}>;
    initialLp: Promise<number>;
    totalTxns: Promise<number>;
    priceToken: Promise<number>;
    liquidity: Promise<number>;
    liveTime: Promise<string>;
    deployerBalance: Promise<number>;
    verified: Promise<boolean>;
    clog: Promise<string>;
    marketCapBurn: Promise<number>;
    burnPercent: Promise<number>;
}