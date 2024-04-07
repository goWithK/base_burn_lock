export class TimeHelper {

    public static async delay(seconds: number): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }
}