import mysql from 'mysql2/promise';
const config = require('../../port-config.cjs');

const db = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default db;
