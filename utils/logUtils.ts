export function logWithTimestamp(message: string, data?: any) {
    const now = new Date();
    const timestamp = now.toISOString(); // 这已经包含毫秒
    const logMessage = `[${timestamp}] ${message}`;

    if (data) {
        console.log(logMessage, data);
    } else {
        console.log(logMessage);
    }
}