import assert from 'node:assert/strict';

process.env.MYSQL_HOST = 'db.example.com';
process.env.MYSQL_PORT = '33066';
process.env.MYSQL_USER = 'root';
process.env.MYSQL_PASSWORD = 'secret';
process.env.MYSQL_DATABASE = 'ai_platform';
process.env.DATABASE_URL = 'mysql://root:devpassword@127.0.0.1:3306/ai_platform';

const { resolveMysqlConn } = await import('../src/lib/server/db/mysqlConn.ts');
const c = resolveMysqlConn();
assert.equal(c.host, 'db.example.com');
assert.equal(c.port, 33066);

delete process.env.MYSQL_HOST;
process.env.DATABASE_URL = 'mysql://u:p@prod.db:3306/ai_platform';
const c2 = resolveMysqlConn();
assert.equal(c2.host, 'prod.db');

console.log('mysql-conn-resolve-test: ok');
