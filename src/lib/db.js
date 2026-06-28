import fs from 'fs';
import path from 'path';
import {
  createNexdbFile, deleteNexdbFile, databaseExists,
  listCollections as engineListCollections,
  createCollection as engineCreateCollection,
  listDocumentsInCollection, insertDocument, insertDocumentAutoId,
  deleteDocument as engineDeleteDocument,
  getStats as getEngineStats,
  getDocument as engineGetDocument,
} from './nexdb-engine';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getStore() {
  ensureDataDir();
  if (!fs.existsSync(STORE_FILE)) {
    const initial = { users: [], databases: [], apiKeys: [] };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
}

function saveStore(data) {
  ensureDataDir();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
}

function genId() {
  return Math.random().toString(36).substring(2, 10);
}

function genToken() {
  return Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('');
}

// Users (remain in JSON store)
export function createUser(email, password, name) {
  const store = getStore();
  if (store.users.find(u => u.email === email)) return null;
  const user = { id: genId(), email, password, name, createdAt: Date.now() };
  store.users.push(user);

  // Create a default database with real NexDb engine file
  const dbId = genId();
  const db = {
    id: dbId,
    userId: user.id,
    name: `free-${genId()}`,
    plan: 'Free',
    token: genToken(),
    createdAt: Date.now(),
  };
  store.databases.push(db);
  saveStore(store);

  // Create the actual .nexdb file on disk
  createNexdbFile(dbId).catch(() => {});

  return { user, databases: [db] };
}

export function findUser(email, password) {
  const store = getStore();
  return store.users.find(u => u.email === email && u.password === password) || null;
}

export function findUserById(id) {
  const store = getStore();
  return store.users.find(u => u.id === id) || null;
}

export function getUserDatabases(userId) {
  return getStore().databases.filter(d => d.userId === userId) || [];
}

export function getDatabase(dbId) {
  return getStore().databases.find(d => d.id === dbId) || null;
}

export function updateDatabase(dbId, updates) {
  const store = getStore();
  const idx = store.databases.findIndex(d => d.id === dbId);
  if (idx === -1) return null;
  store.databases[idx] = { ...store.databases[idx], ...updates };
  saveStore(store);
  return store.databases[idx];
}

export function createDatabase(userId, name) {
  const store = getStore();
  const dbId = genId();
  const db = {
    id: dbId,
    userId,
    name: name || `db-${genId()}`,
    plan: 'Free',
    token: genToken(),
    createdAt: Date.now(),
  };
  store.databases.push(db);
  saveStore(store);

  // Create actual .nexdb file
  createNexdbFile(dbId).catch(() => {});

  return db;
}

export function deleteDatabase(dbId) {
  const store = getStore();
  store.databases = store.databases.filter(d => d.id !== dbId);
  saveStore(store);

  // Remove actual .nexdb file
  deleteNexdbFile(dbId).catch(() => {});
}

// Collections — use real NexDb engine
export async function getCollections(dbId) {
  if (!databaseExists(dbId)) return [];
  const names = await engineListCollections(dbId);
  // Filter out _default (auto-created by nexdb on first open)
  return names.filter(n => n !== '_default').map(name => ({
    id: name,
    name,
    createdAt: Date.now(),
    docCount: 0, // Will be populated by caller if needed
  }));
}

export async function createCollection(dbId, name) {
  if (!databaseExists(dbId)) await createNexdbFile(dbId);
  await engineCreateCollection(dbId, name);
  return { id: name, name, createdAt: Date.now(), docCount: 0 };
}

// Documents — use real NexDb engine
export async function getDocuments(dbId, collectionId) {
  if (!databaseExists(dbId)) return [];
  const docs = await listDocumentsInCollection(dbId, collectionId);
  return docs.map(d => ({
    id: d.id,
    collectionId,
    data: d.data,
    createdAt: d.createdAt || Date.now(),
    updatedAt: d.createdAt || Date.now(),
  }));
}

export async function getDocument(dbId, docId) {
  if (!databaseExists(dbId)) return null;
  // Try to find doc across all collections
  const cols = await engineListCollections(dbId);
  for (const col of cols) {
    if (col === '_default') continue;
    try {
      const doc = await engineGetDocument(dbId, col, docId);
      if (doc) return { ...doc, collectionId: col };
    } catch {}
  }
  return null;
}

export async function createDocument(dbId, collectionId, data) {
  if (!databaseExists(dbId)) await createNexdbFile(dbId);
  const doc = await insertDocumentAutoId(dbId, collectionId, data);
  return {
    id: doc.id,
    collectionId,
    data: doc.data,
    createdAt: doc.createdAt || Date.now(),
    updatedAt: doc.createdAt || Date.now(),
  };
}

export async function deleteDocument(dbId, collectionId, docId) {
  if (!databaseExists(dbId)) return false;
  await engineDeleteDocument(dbId, collectionId, docId);
  return true;
}

// Stats from real engine
export async function getDatabaseStats(dbId) {
  if (!databaseExists(dbId)) return { docCount: 0, storageBytes: 0 };
  return getEngineStats(dbId);
}

// API Keys (remain in JSON store)
export function createApiKey(userId, label) {
  const store = getStore();
  const key = {
    id: genId(),
    userId,
    label: label || 'Unnamed',
    key: `ndb_${genToken()}`,
    createdAt: Date.now(),
    lastUsed: null,
  };
  store.apiKeys.push(key);
  saveStore(store);
  return key;
}

export function getUserApiKeys(userId) {
  return getStore().apiKeys.filter(k => k.userId === userId) || [];
}

export function revokeApiKey(keyId) {
  const store = getStore();
  store.apiKeys = store.apiKeys.filter(k => k.id !== keyId);
  saveStore(store);
}
