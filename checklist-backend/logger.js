// logger.js

function log(level, message, ...optionalParams) {
    if (process.env.NODE_ENV !== 'production') {
        console[level](message, ...optionalParams);
    } else {
        // In production, you might want to handle logs differently
        // For example, only log errors or send logs to a remote service
        if (level === 'error') {
            console.error(message, ...optionalParams);
        }
        // Optionally, add more conditions to handle other log levels differently
    }
}

module.exports = {
    debug: function (message, ...optionalParams) {
        log('log', message, ...optionalParams);  // 'log' is similar to 'debug' in console
    },
    info: function (message, ...optionalParams) {
        log('info', message, ...optionalParams);
    },
    warn: function (message, ...optionalParams) {
        log('warn', message, ...optionalParams);
    },
    error: function (message, ...optionalParams) {
        log('error', message, ...optionalParams);
    }
};