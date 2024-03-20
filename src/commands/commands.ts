interface Commands {
    command: string;
    description: string;
}

export const COMMANDS: Commands[] = [
    { command: 'start', description: 'Start filtering bot' },
    //{ command: 'filter', description: 'Input conditions for bot with format: pooled, liquidity_supply, number_holders, limit_holder_amount, token_sticker' },
    { command: 'stop', description: 'Stop bot' },
];
