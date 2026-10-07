import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'

const sqlite = new SQLiteConnection(CapacitorSQLite)

export async function initializeDatabase() {
  if (!Capacitor.isNativePlatform()) return null

  const database = await sqlite.createConnection(
    'asyne_logistica',
    false,
    'no-encryption',
    1,
    false,
  )

  await database.open()
  await database.execute(`
    CREATE TABLE IF NOT EXISTS sync_operations (
      id TEXT PRIMARY KEY NOT NULL,
      operation_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced_at TEXT
    );
  `)

  return database
}
