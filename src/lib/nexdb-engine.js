import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const BINARY = path.join(process.cwd(), 'bin', 'nexdb.exe');
const DB_DIR = path.join(process.cwd(), 'data', 'databases');

function ensureDbDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function dbPath(dbId) {
  ensureDbDir();
  return path.join(DB_DIR, `${dbId}.nexdb`);
}

export function dbFilePath(dbId) {
  return dbPath(dbId);
}

export function databaseExists(dbId) {
  return fs.existsSync(dbPath(dbId));
}

export async function createNexdbFile(dbId) {
  const fp = dbPath(dbId);
  if (!fs.existsSync(fp)) {
    // Create an empty database file by opening and immediately closing via count command
    await execFileAsync(BINARY, ['count', fp, '_default'], { timeout: 10000 });
  }
}

export async function deleteNexdbFile(dbId) {
  const fp = dbPath(dbId);
  if (fs.existsSync(fp)) {
    fs.unlinkSync(fp);
  }
  // Also remove any WAL checkpoint files
  const walPath = fp + '.wal';
  if (fs.existsSync(walPath)) {
    fs.unlinkSync(walPath);
  }
}

async function nexdb(args) {
  const { stdout, stderr } = await execFileAsync(BINARY, args, { timeout: 15000 });
  return stdout.trim();
}

// Collections
export async function listCollections(dbId) {
  const fp = dbPath(dbId);
  if (!fs.existsSync(fp)) return [];
  try {
    const out = await nexdb(['collections', fp]);
    // Output is JSON array like ["col1", "col2"]
    return JSON.parse(out);
  } catch {
    return [];
  }
}

export async function createCollection(dbId, name) {
  const fp = dbPath(dbId);
  await nexdb(['create-collection', fp, name]);
  return true;
}

// Documents
export async function listDocuments(dbId) {
  const fp = dbPath(dbId);
  if (!fs.existsSync(fp)) return [];
  try {
    const out = await nexdb(['find', fp, '_default']);
    const parsed = JSON.parse(out);
    if (parsed.ok) {
      return (parsed.documents || []).map(d => ({
        id: d.id,
        data: d.document,
        createdAt: Date.now(),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export async function listDocumentsInCollection(dbId, collectionName) {
  const fp = dbPath(dbId);
  if (!fs.existsSync(fp)) return [];
  try {
    const out = await nexdb(['find', fp, collectionName]);
    const parsed = JSON.parse(out);
    if (parsed.ok) {
      return (parsed.documents || []).map(d => ({
        id: d.id,
        data: d.document,
        createdAt: Date.now(),
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export async function getDocument(dbId, collectionName, docId) {
  const fp = dbPath(dbId);
  if (!fs.existsSync(fp)) return null;
  try {
    const out = await nexdb(['get', fp, collectionName, docId]);
    const parsed = JSON.parse(out);
    // get outputs the document JSON directly (not wrapped)
    return { id: docId, data: JSON.parse(out), createdAt: Date.now() };
  } catch {
    return null;
  }
}

export async function insertDocument(dbId, collectionName, docId, data) {
  const fp = dbPath(dbId);
  const jsonStr = JSON.stringify(data);
  await nexdb(['insert', fp, collectionName, docId, jsonStr]);
  return { id: docId, data, createdAt: Date.now() };
}

export async function insertDocumentAutoId(dbId, collectionName, data) {
  const fp = dbPath(dbId);
  const jsonStr = JSON.stringify(data);
  const out = await nexdb(['insert-auto-id', fp, collectionName, jsonStr]);
  // Output: {"ok":true,"id":"abc123"}
  const parsed = JSON.parse(out);
  return { id: parsed.id, data, createdAt: Date.now() };
}

export async function deleteDocument(dbId, collectionName, docId) {
  const fp = dbPath(dbId);
  if (!fs.existsSync(fp)) return false;
  await nexdb(['delete', fp, collectionName, docId]);
  return true;
}

export async function countDocuments(dbId, collectionName) {
  const fp = dbPath(dbId);
  if (!fs.existsSync(fp)) return 0;
  try {
    const out = await nexdb(['count', fp, collectionName]);
    return parseInt(out, 10) || 0;
  } catch {
    return 0;
  }
}

export async function getStats(dbId) {
  const fp = dbPath(dbId);
  if (!fs.existsSync(fp)) return { docCount: 0, storageBytes: 0, collectionsCount: 0 };
  try {
    const collections = await listCollections(dbId);
    const realCollections = collections.filter(n => n !== '_default');
    let totalDocs = 0;
    for (const col of realCollections) {
      const count = await countDocuments(dbId, col);
      totalDocs += count;
    }
    // Storage: check the WAL file size
    let storageBytes = 0;
    if (fs.existsSync(fp)) {
      storageBytes = fs.statSync(fp).size;
    }
    const walPath = fp + '.wal';
    if (fs.existsSync(walPath)) {
      storageBytes += fs.statSync(walPath).size;
    }
    return { docCount: totalDocs, storageBytes, collectionsCount: realCollections.length };
  } catch {
    return { docCount: 0, storageBytes: 0, collectionsCount: 0 };
  }
}
