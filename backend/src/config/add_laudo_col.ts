import db from './database';

async function run() {
    try {
        console.log("Adding arquivo_laudo column...");
        await db.execute('ALTER TABLE amostras ADD COLUMN arquivo_laudo VARCHAR(255) DEFAULT NULL');
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
