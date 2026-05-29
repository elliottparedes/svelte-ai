export type MysqlConnParts = {
	host: string;
	port: number;
	user: string;
	password: string;
	database: string;
};

/** Supports `mysql://` and `mysql2://` URLs (mysql2 driver accepts host/port/user/pass/db). */
export function parseMysqlDatabaseUrl(urlStr: string): MysqlConnParts {
	const u = new URL(urlStr);
	if (u.protocol !== 'mysql:' && u.protocol !== 'mysql2:') {
		throw new Error(`DATABASE_URL must use mysql:// or mysql2:// (got ${u.protocol})`);
	}
	const dbPath = u.pathname.replace(/^\//, '').split('/')[0] ?? '';
	if (!dbPath) throw new Error('DATABASE_URL must include a database path');
	return {
		host: u.hostname || 'localhost',
		port: u.port ? Number(u.port) : 3306,
		user: decodeURIComponent(u.username || ''),
		password: decodeURIComponent(u.password || ''),
		database: decodeURIComponent(dbPath)
	};
}

function connFromMysqlEnvVars(): MysqlConnParts {
	return {
		host: process.env.MYSQL_HOST || 'localhost',
		port: Number(process.env.MYSQL_PORT) || 3306,
		user: process.env.MYSQL_USER || 'root',
		password: process.env.MYSQL_PASSWORD || '',
		database: process.env.MYSQL_DATABASE || 'ai_platform'
	};
}

function isLoopbackHost(host: string): boolean {
	return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

/**
 * Prefer `DATABASE_URL` when set. If both URL and `MYSQL_HOST` are set and the URL
 * points at loopback while `MYSQL_HOST` does not, use `MYSQL_*` (common Coolify mistake:
 * dev `DATABASE_URL` left set alongside production `MYSQL_*`).
 */
export function resolveMysqlConn(): MysqlConnParts {
	const url = process.env.DATABASE_URL?.trim();
	const mysqlHost = process.env.MYSQL_HOST?.trim();
	if (url) {
		const fromUrl = parseMysqlDatabaseUrl(url);
		if (mysqlHost && isLoopbackHost(fromUrl.host) && !isLoopbackHost(mysqlHost)) {
			return connFromMysqlEnvVars();
		}
		return fromUrl;
	}
	return connFromMysqlEnvVars();
}
