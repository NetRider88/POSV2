import sqlite3 from 'sqlite3';
import path from 'path';
import { open } from 'sqlite';

const DB_PATH = path.join(process.cwd(), 'test_history.db');

// Initialize database
async function initializeDb() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS test_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      request_type TEXT NOT NULL,
      passed BOOLEAN NOT NULL,
      error_codes TEXT,
      payload_sample TEXT
    )
  `);

  return db;
}

export async function saveTestResult(
  requestType: string,
  passed: boolean,
  errorCodes: string[] = [],
  payloadSample: any
) {
  const db = await initializeDb();
  await db.run(
    `INSERT INTO test_results (request_type, passed, error_codes, payload_sample) 
     VALUES (?, ?, ?, ?)`,
    [
      requestType,
      passed ? 1 : 0,
      JSON.stringify(errorCodes),
      JSON.stringify(payloadSample)
    ]
  );
}

export async function getTestHistory() {
  const db = await initializeDb();
  return db.all(`SELECT * FROM test_results ORDER BY timestamp DESC`);
}
