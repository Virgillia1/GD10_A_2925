import postgres from 'postgres';

let sqlClient: ReturnType<typeof postgres> | undefined;

export function hasPostgresUrl() {
  return Boolean(process.env.POSTGRES_URL);
}

export function getSql() {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error(
      'Missing POSTGRES_URL. Add it to `.env.local` before running the dashboard.',
    );
  }

  if (!sqlClient) {
    sqlClient = postgres(connectionString, { ssl: 'require' });
  }

  return sqlClient;
}
