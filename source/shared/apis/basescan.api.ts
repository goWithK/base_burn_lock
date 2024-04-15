export class BaseScanAPI {
    public static async getLockOM(currentBlock: number, startBlock: number) {
        const UrlLockTokenMoon = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=${startBlock}&toBlock=${currentBlock}&address=0x77110f67C0EF3c98c43570BADe06046eF6549876&topic0=0x531cba00a411ade37b4ca8175d92c94149f19536bd8e5a83d581aa7f040d192e&page=1&offset=1000&apikey=${process.env.API_BASESCAN_KEY_1}`;
    
        const resp = await fetch(UrlLockTokenMoon);

        return resp.json();
    }

    public static async getLockTF(currentBlock: number, startBlock: number) {
        const UrlLockTokenTF = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=${startBlock}&toBlock=${currentBlock}&address=0x4F0Fd563BE89ec8C3e7D595bf3639128C0a7C33A&topic0=0xeb65d0f36862bbd8763c5e2c983c9d753267d223eee35a224d8d0a9d7ef433a2&page=1&offset=1000&apikey=${process.env.API_BASESCAN_KEY_1}`;
    
        const resp = await fetch(UrlLockTokenTF);

        return resp.json();
    }

    public static async getLockUNCXuniv3(currentBlock: number, startBlock: number) {
        const urlLockUNCX = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=${startBlock}&toBlock=${currentBlock}&address=0x231278eDd38B00B07fBd52120CEf685B9BaEBCC1&topic0=0x3bf9c85fbe37d401523942f10940796acef64062e1a1c45647978e32f4969f5c&page=1&offset=1000&apikey=${process.env.API_BASESCAN_KEY_1}`

        const resp = await fetch(urlLockUNCX);

        return resp.json();
    }

    public static async getLockUNCXuniv2(currentBlock: number, startBlock: number) {
        const urlLockUNCX = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=${startBlock}&toBlock=${currentBlock}&address=0xc4E637D37113192F4F1F060DaEbD7758De7F4131&topic0=0x3e5a874dd8f086c73bba5a860cb04972e50b6207f84cc020037d576afa6ebc13&page=1&offset=1000&apikey=${process.env.API_BASESCAN_KEY_1}`

        const resp = await fetch(urlLockUNCX);

        return resp.json();
    }

    public static async getLockUNCXsushi(currentBlock: number, startBlock: number) {
        const urlLockUNCXsushi = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=${startBlock}&toBlock=${currentBlock}&address=0xBeddF48499788607B4c2e704e9099561ab38Aae8&topic0=0x3e5a874dd8f086c73bba5a860cb04972e50b6207f84cc020037d576afa6ebc13&page=1&offset=1000&apikey=${process.env.API_BASESCAN_KEY_1}`

        const resp = await fetch(urlLockUNCXsushi);

        return resp.json();
    }

    public static async getBurnEvent(currentBlock: number, startBlock: number) {
        const UrlTransferBurn = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=${startBlock}&toBlock=${currentBlock}&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef&topic0_2_opr=and&topic2=0x000000000000000000000000000000000000000000000000000000000000dead&page=1&offset=100&apikey=${process.env.API_BASESCAN_KEY_1}`

        const resp = await fetch(UrlTransferBurn);

        return resp.json()
    }

    public static async getBalanceAddress(address: string) {
        const urlGetBalance = `https://api.basescan.org/api?module=account&action=balance&address=${address}&tag=latest&apikey=${process.env.API_BASESCAN_KEY_2}`

        const resp = await fetch(urlGetBalance);

        return resp.json();
    }

    public static async getAbi(contractAddress: string): Promise<any> {
        const urlGetAbi = `https://api.basescan.org/api?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.API_BASESCAN_KEY_2}`; 

        const resp = await fetch(urlGetAbi);

        return resp.json()
    }

    public static async getTxnbyAddress(currentBlock: number, address: string) {
        const urlGetCA = `https://api.basescan.org/api?module=account&action=txlist&address=${address}&page=1&offset=100&startblock=0&endblock=${currentBlock}&sort=desc&apikey=${process.env.API_BASESCAN_KEY_2}`
    
        const resp = await fetch(urlGetCA);

        return resp.json()
    }

    public static async getLpAmount(currentBlock: number, pairAddress: string, deployerAddress: string) {
        const urlGetLpAmount = `https://api.basescan.org/api?module=account&action=tokentx&contractaddress=${pairAddress}&address=${deployerAddress}&page=1&offset=100&startblock=0&endblock=${currentBlock}&sort=asc&apikey=${process.env.API_BASESCAN_KEY_2}`
    
        const resp = await fetch(urlGetLpAmount);

        return resp.json()
    }

    public static async getFirstInternalTxn(currentBlock: number, address: string) {
        const urlGetInternalTxn = `https://api.basescan.org/api?module=account&action=txlistinternal&address=${address}&page=1&offset=50&startblock=0&endblock=${currentBlock}&sort=desc&apikey=${process.env.API_BASESCAN_KEY_2}`
        
        const resp = await fetch(urlGetInternalTxn);
        const respData = await resp.json();

        return respData?.result[respData?.result?.length - 1]?.hash
    }
}
