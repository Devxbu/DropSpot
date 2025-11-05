import { createApp } from './app';
import pool from './config/db';

async function server() {
    try {
        await pool.connect();
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