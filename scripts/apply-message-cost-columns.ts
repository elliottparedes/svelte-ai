import 'dotenv/config';
import mysql from 'mysql2/promise';
import { resolveMysqlConn } from '../src/lib/server/db/mysqlConn';

async function main() {
	const c = resolveMysqlConn();
	const conn = await mysql.createConnection({
		host: c.host,
		port: c.port,
		user: c.user,
		password: c.password,
		database: c.database
	});
	const alters = [
		'ALTER TABLE messages ADD COLUMN cost_usd DECIMAL(10,6) NULL',
		'ALTER TABLE messages ADD COLUMN prompt_tokens INT NULL',
		'ALTER TABLE messages ADD COLUMN completion_tokens INT NULL'
	];
	for (const sql of alters) {
		try {
			await conn.query(sql);
			console.log('ok:', sql);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			if (msg.includes('Duplicate column')) {
				console.log('skip (exists):', sql);
				continue;
			}
			throw err;
		}
	}
	await conn.end();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
