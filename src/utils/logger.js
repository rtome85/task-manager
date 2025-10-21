const winston = require('winston');

//Define log levels and colors
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

winston.addColors(colors);


// Create logger configuration
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// Define transports 
const transports = [
    new winston.transports.Console({
        format,
    }),

    // File transport for errors
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
        ),
    }),

    // File transport for all logs
    new winston.transports.File({
        filename: 'logs/all.log',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
        ),
    }),
];

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format,
    transports,
});

module.exports = logger;