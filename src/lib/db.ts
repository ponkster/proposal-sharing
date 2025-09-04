import bcrypt from "bcrypt";
import { mkdirSync } from 'fs';

// Use Bun's native SQLite everywhere
const { Database } = await import("bun:sqlite");
let db: any;

function initializeDatabase() {
  if (db) return db;

  // Skip database initialization during build
  if (process.env.NODE_ENV === 'production' && !process.env.SKIP_DB_INIT) {
    // In production/Docker, use the data directory
    const dbPath = '/app/data/proposals.db';
    
    // Ensure data directory exists
    try {
      mkdirSync('/app/data', { recursive: true });
    } catch (e) {
      // Directory already exists or permission error
    }
    
    db = new Database(dbPath);
  } else if (process.env.NODE_ENV !== 'production') {
    // In development, use current directory and ensure data directory exists
    mkdirSync('data', { recursive: true });
    db = new Database('data/proposals.db');
  } else {
    // During build process, create a temporary in-memory database
    db = new Database(':memory:');
  }

  // Initialize table if not exists
  db.exec(`
  CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY,
    title TEXT,
    markdown TEXT,
    mockup TEXT,
    passwordHash TEXT,
    createdAt TEXT
  )
  `);

  // Check if we need to migrate to new schema with mockups array
  const tableInfo = db.query("PRAGMA table_info(proposals)").all();
  const hasMockupsColumn = tableInfo.some((column: any) => column.name === 'mockups');

  if (!hasMockupsColumn) {
    // Add new mockups column (JSON array)
    db.exec(`
      ALTER TABLE proposals ADD COLUMN mockups TEXT DEFAULT '[]';
    `);
    
    // Migrate existing mockup data to mockups array
    const proposals = db.query("SELECT id, mockup FROM proposals WHERE mockup IS NOT NULL AND mockup != ''").all();
    const updateStmt = db.query("UPDATE proposals SET mockups = ?2 WHERE id = ?1");
    
    for (const proposal of proposals as any[]) {
      const mockupsArray = [{
        title: "Mockup",
        html: proposal.mockup
      }];
      
      updateStmt.run(proposal.id, JSON.stringify(mockupsArray));
    }
  }

  return db;
}

// Initialize database lazily
const getDb = () => {
  if (!db) {
    initializeDatabase();
  }
  return db;
};

// Helper functions using Bun SQLite API
export const dbQuery = (sql: string) => {
  const database = getDb();
  return database.query(sql);
};

export const dbGet = (sql: string, ...params: any[]) => {
  const database = getDb();
  return database.query(sql).get(...params);
};

export const dbAll = (sql: string, ...params: any[]) => {
  const database = getDb();
  return database.query(sql).all(...params);
};

export const dbRun = (sql: string, ...params: any[]) => {
  const database = getDb();
  return database.query(sql).run(...params);
};

export default getDb();
export { bcrypt, getDb };