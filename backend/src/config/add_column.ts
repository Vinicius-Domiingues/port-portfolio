import db from './database';

async function run() {
    try {
        console.log("Adding column...");
        await db.execute('ALTER TABLE amostras ADD COLUMN quantidade_sacas INT DEFAULT NULL');
        console.log("Column added successfully!");
        process.exit(0);
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
            process.exit(0);
        } else {
            console.error("Error:", e);
            process.exit(1);
        }
    }
}
run();
