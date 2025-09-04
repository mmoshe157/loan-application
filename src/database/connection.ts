import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

export { Database };

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function initializeDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (db) {
    return db;
  }

  const dbPath = process.env.DATABASE_URL || './database.sqlite';
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Create loans table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      applicant_name TEXT NOT NULL,
      property_address TEXT NOT NULL,
      credit_score INTEGER NOT NULL,
      monthly_income DECIMAL(10,2) NOT NULL,
      requested_amount DECIMAL(12,2) NOT NULL,
      loan_term_months INTEGER NOT NULL,
      eligible BOOLEAN NOT NULL,
      reason TEXT NOT NULL,
      crime_grade TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

export async function getDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (!db) {
    return await initializeDatabase();
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}