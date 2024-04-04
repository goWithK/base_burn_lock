class ScanBaseAPI {
    public static async getLockDays() {
        const urlLockUNCX = `https://api.basescan.org/api?module=logs&action=getLogs&fromBlock=${startblock}&toBlock=${currentBlock}&address=0x231278eDd38B00B07fBd52120CEf685B9BaEBCC1&topic0=0x3bf9c85fbe37d401523942f10940796acef64062e1a1c45647978e32f4969f5c&page=1&offset=1000&apikey=${process.env.API_BASESCAN_KEY}`
        const response = await fetch(urlLockUNCX);

        return response['some_field']['field_aaaaa'];
    }
}

export default ScanBaseAPI;