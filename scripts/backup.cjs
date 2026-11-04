const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const mysql = require('../backend/node_modules/mysql2/promise');
const root = path.resolve(__dirname, '..');
const backupRoot = path.join(root, 'backups', 'port');
const mysqlBin = process.env.MYSQL_BIN || 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin';
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

async function run(program, args, password, input) {
    await new Promise((resolve, reject) => {
        const child = spawn(path.join(mysqlBin, program), args, {
            windowsHide: true, env: { ...process.env, MYSQL_PWD: password }, stdio: ['pipe', 'ignore', 'pipe']
        });
        let errors = '';
        child.stderr.on('data', chunk => errors += chunk);
        child.on('error', reject);
        child.on('close', code => code === 0 ? resolve() : reject(new Error(`${program}: ${errors}`)));
        child.stdin.on('error', reject);
        child.stdin.end(input);
    });
}

async function inventory(directory, base = directory) {
    const result = [];
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isSymbolicLink()) throw new Error('Link simbólico inesperado no backup.');
        if (entry.isDirectory()) result.push(...await inventory(file, base));
        else {
            const data = await fs.readFile(file);
            result.push({ file: path.relative(base, file), bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex') });
        }
    }
    return result.sort((a, b) => a.file.localeCompare(b.file));
}

async function main() {
    // Lê a configuração usada pelo sistema sem copiar a senha para arquivos de backup.
    const config = require('../backend/port-config.cjs');
    await fs.mkdir(backupRoot, { recursive: true });
    const pending = path.join(backupRoot, `incompleto-${stamp}`);
    await fs.mkdir(pending);
    const sql = path.join(pending, 'port_demo.sql');
    const args = ['-h', config.host, '-P', String(config.port), '-u', config.user];
    await run('mysqldump.exe', [...args, '--single-transaction', '--routines', '--events', '--triggers', '--hex-blob', '--no-tablespaces', '--set-gtid-purged=OFF', `--result-file=${sql}`, config.database], config.password);
    if ((await fs.stat(sql)).size === 0) throw new Error('O dump está vazio.');
    const uploads = path.join(root, 'backend/uploads');
    const before = await inventory(uploads);
    await fs.cp(uploads, path.join(pending, 'uploads'), { recursive: true, errorOnExist: true });
    const copied = await inventory(path.join(pending, 'uploads'));
    const after = await inventory(uploads);
    if (JSON.stringify(before) !== JSON.stringify(copied) || JSON.stringify(before) !== JSON.stringify(after)) {
        throw new Error('Os uploads mudaram durante a cópia. Execute o backup novamente.');
    }

    let restoration = null;
    if (process.argv.includes('--verify-restore')) {
        const temporary = `backup_verify_${Date.now()}`;
        const connection = await mysql.createConnection(config);
        let created = false;
        try {
            await connection.query(`CREATE DATABASE \`${temporary}\``);
            created = true;
            await run('mysql.exe', [...args, temporary], config.password, await fs.readFile(sql));
            const [tables] = await connection.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = ?', [temporary, 'BASE TABLE']);
            if (!tables.length) throw new Error('A restauração não criou tabelas.');
            restoration = {};
            for (const row of tables) {
                const table = row.TABLE_NAME.replace(/`/g, '``');
                const [[count]] = await connection.query(`SELECT COUNT(*) AS total FROM \`${temporary}\`.\`${table}\``);
                restoration[row.TABLE_NAME] = count.total;
            }
        } finally {
            try { if (created) await connection.query(`DROP DATABASE \`${temporary}\``); }
            finally { await connection.end(); }
        }
    }
    const manifest = { createdAt: new Date().toISOString(), database: config.database, restoration, files: await inventory(pending) };
    await fs.writeFile(path.join(pending, 'manifest.json'), JSON.stringify(manifest, null, 2));
    const destination = path.join(backupRoot, `backup-${stamp}`);
    await fs.rename(pending, destination);

    // Remove somente backups completos criados por este script, após um novo backup bem-sucedido.
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    for (const entry of await fs.readdir(backupRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.isSymbolicLink() || !/^backup-\d{4}-\d{2}-\d{2}T[\d-]+Z$/.test(entry.name)) continue;
        const candidate = path.join(backupRoot, entry.name);
        const resolved = await fs.realpath(candidate);
        if (path.dirname(resolved).toLowerCase() !== (await fs.realpath(backupRoot)).toLowerCase()) throw new Error('Caminho de retenção inválido.');
        const old = JSON.parse(await fs.readFile(path.join(candidate, 'manifest.json'), 'utf8'));
        if (old.database === config.database && Date.parse(old.createdAt) < cutoff) await fs.rm(resolved, { recursive: true });
    }
    console.log(JSON.stringify({ backup: destination, files: manifest.files.length, restoration }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
