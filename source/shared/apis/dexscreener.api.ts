export class DexScreenerAPI {
    public static async getDexData(pairAddress: string) {
        const url = `https://api.dexscreener.com/latest/dex/pairs/base/${pairAddress}`;
    
        const resp = await fetch(url);

        return resp.json();
    }
}
