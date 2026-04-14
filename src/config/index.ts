export const config = {
  port: Number(process.env.PORT) || 3000,
  db: {
    path: process.env.DB_PATH || './acme-ehr.db'
  }
}