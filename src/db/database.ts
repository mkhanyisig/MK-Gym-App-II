import type { SQLiteDatabase } from 'expo-sqlite';

/** The app's single SQLite database. */
export const DATABASE_NAME = 'myform.db';

type Migration = (db: SQLiteDatabase) => Promise<void>;

/**
 * Schema migrations, in order. `MIGRATIONS[i]` upgrades the database from version
 * `i` to `i + 1`, and the version is tracked in SQLite's `PRAGMA user_version`.
 *
 * Rules: only ever append. Never edit or reorder a migration that has shipped, and
 * never drop or rewrite tables that hold user data. Users' devices may be on any
 * earlier version.
 */
const MIGRATIONS: Migration[] = [
  // v1: daily body-weight entries, one per local calendar day.
  async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS weight_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        weight_kg REAL NOT NULL CHECK (weight_kg > 0),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  },
];

/** The schema version this build of the app expects. */
export const SCHEMA_VERSION = MIGRATIONS.length;

/**
 * Brings the database up to `SCHEMA_VERSION`. Safe to run on every launch: it reads
 * the current version and applies only the missing migrations.
 *
 * Each migration and its version bump run in one transaction, so a failure leaves the
 * database at the last fully applied version rather than half-migrated. Errors are
 * thrown, never swallowed, so the app can't silently continue with a broken database.
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  if (version > SCHEMA_VERSION) {
    // Opened by a newer build (e.g. after downgrading the app). Refuse rather than
    // risk misreading or altering data written with a schema we don't know.
    throw new Error(
      `Database schema v${version} is newer than this app supports (v${SCHEMA_VERSION}). Please update the app.`,
    );
  }

  while (version < SCHEMA_VERSION) {
    const next = version + 1;
    const migrate = MIGRATIONS[version];
    await db.withTransactionAsync(async () => {
      await migrate(db);
      // PRAGMA can't take bound parameters; `next` is an integer we computed.
      await db.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
}
