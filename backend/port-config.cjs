const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

// O Port nunca pode conectar ao banco do projeto principal.
if (process.env.DB_NAME && process.env.DB_NAME !== 'port_demo') {
    throw new Error('O Port permite somente o banco port_demo.');
}
module.exports = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'port_demo'
};
