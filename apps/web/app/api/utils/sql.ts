import { sql as neonSql } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neonSql(process.env.DATABASE_URL);

export { sql };
export default sql;
