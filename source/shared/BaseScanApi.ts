export class BaseScanAPI {
    public static async getTokenMoon(currentBlock: number, startBlock: number) {
        const UrlLockTokenMoon = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=${startBlock}&toBlock=${currentBlock}&address=0x77110f67C0EF3c98c43570BADe06046eF6549876&topic0=0x531cba00a411ade37b4ca8175d92c94149f19536bd8e5a83d581aa7f040d192e&page=1&offset=1000&apikey=${process.env.API_BASESCAN_KEY}`;
    
        return await fetch(UrlLockTokenMoon);
    }
}
