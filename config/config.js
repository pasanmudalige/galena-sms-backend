require('dotenv').config();

module.exports = {
    development: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PWD || '',
        database: process.env.DB_NAME || 'tfp',
        host: process.env.DB_HOST || 'localhost',
        dialect: process.env.DB_DIALECT || 'mysql',
    },
    internal: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PWD || '',
        database: process.env.DB_NAME || 'tfp',
        host: process.env.DB_HOST || 'localhost',
        dialect: process.env.DB_DIALECT || 'mysql',
    },
    test: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PWD || '',
        database: process.env.DB_NAME_TEST || 'test_tfp',
        host: process.env.DB_HOST_TEST || 'localhost',
        dialect: process.env.DB_DIALECT || 'mysql',
    },
    production: {
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PWD || '',
        database: process.env.DB_NAME || 'tfp',
        host: process.env.DB_HOST || 'localhost',
        dialect: process.env.DB_DIALECT || 'mysql',
    }
};
