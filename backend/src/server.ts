import { createApp } from './app';
import pool from './config/db';
import createTables from './utils/tableCreate';

async function server() {
    try {
        await pool.connect();
        await createTables();
        const app = createApp();
        app.listen(3000, () => {
            console.log('Server running on http://localhost:3000');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

server();