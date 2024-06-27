// logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
    private static log(level: LogLevel, message: any, ...optionalParams: any[]) {
        if (process.env.REACT_APP_NODE_ENV !== 'production') {
            console[level](message, ...optionalParams);
        } else {
            // In production, you might want to send logs to a remote logging service
            // or implement a more sophisticated logging mechanism.
            if (level === 'error') {
                console.error(message, ...optionalParams);
            }
            // Optionally, ignore debug/info logs in production.
        }
    }

    static debug(message: any, ...optionalParams: any[]) {
        this.log('debug', message, ...optionalParams);
    }

    static info(message: any, ...optionalParams: any[]) {
        this.log('info', message, ...optionalParams);
    }

    static warn(message: any, ...optionalParams: any[]) {
        this.log('warn', message, ...optionalParams);
    }

    static error(message: any, ...optionalParams: any[]) {
        this.log('error', message, ...optionalParams);
    }
}

export default Logger;