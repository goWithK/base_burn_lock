import Web3 from "web3";
import * as dotenv from 'dotenv';
dotenv.config();

const requestHeaders: HeadersInit = new Headers();
requestHeaders.set('accept', 'application/json');
requestHeaders.set('x-api-key', `${process.env.CHAINBASE_API_KEY}`);

export class ChainBaseAPI {

    public static async getTotalHolders(chainId: number, contractAddress: string) {
        const resp = await fetch(`https://api.chainbase.online/v1/token/holders?chain_id=${chainId}&contract_address=${contractAddress}&page=1&limit=20`, {
            method: 'GET',
            headers: requestHeaders
        })

        return resp.json();
    }

    public static async getTopHolders(chainId: number, contractAddress: string) {
        const resp = await fetch(`https://api.chainbase.online/v1/token/top-holders?chain_id=${chainId}&contract_address=${contractAddress}&page=1&limit=20`, {
            method: 'GET',
            headers: requestHeaders
        })

        return resp.json();
    }
}
