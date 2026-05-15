import 'dotenv/config';
import type { Config } from 'drizzle-kit';
import { resolveMysqlConn } from './src/lib/server/db/mysqlConn';

const c = resolveMysqlConn();

export default {
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'mysql',
	dbCredentials: {
		host: c.host,
		user: c.user,
		password: c.password,
		database: c.database,
		port: c.port
	}
} satisfies Config;
