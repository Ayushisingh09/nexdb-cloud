import fs from 'fs';
import path from 'path';

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

// Users
export function createUser(email, password, name) {
  const store = getStore();
  if (store.users.find(u => u.email === email)) return null;
  const user = { id: genId(), email, password, name, createdAt: Date.now() };
  store.users.push(user);

  const db = {
    id: genId(),
    userId: user.id,
    name: `free-${genId()}`,
    plan: 'Free',
    token: genToken(),
    createdAt: Date.now(),
    docCount: 0,
    storageBytes: 0,
    requests24h: 0,
    apiKeys: [],
  };
  store.databases.push(db);
  saveStore(store);
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
  const db = {
    id: genId(),
    userId,
    name: name || `db-${genId()}`,
    plan: 'Free',
    token: genToken(),
    createdAt: Date.now(),
    docCount: 0,
    storageBytes: 0,
    requests24h: 0,
    apiKeys: [],
  };
  store.databases.push(db);
  saveStore(store);
  return db;
}

export function deleteDatabase(dbId) {
  const store = getStore();
  store.databases = store.databases.filter(d => d.id !== dbId);
  saveStore(store);
}

// API Keys
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
