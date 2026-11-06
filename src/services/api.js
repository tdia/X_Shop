// ============================================================================
//  X-Shop — Base de données embarquée SQLite (WebAssembly, sql.js)
//  Un vrai moteur SQL, pas du localStorage : les données vivent dans un
//  fichier .db SQLite, persisté sur l'appareil (IndexedDB) et exportable.
//  Aucun serveur ni compte requis → déployable en hébergement statique simple.
//  Interface identique à l'ancienne API REST → le reste de l'app est inchangé.
// ============================================================================

import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

const DB_STORE_KEY = 'xshop.sqlite';

// --- Persistance du fichier .db dans IndexedDB -----------------------------
const IDB_NAME = 'xshop-database';
const IDB_STORE = 'files';

const openIDB = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(IDB_NAME, 1);
  req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const idbGet = async (key) => {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const r = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
};

const idbSet = async (key, value) => {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// --- Schéma + catalogue de démarrage ---------------------------------------
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT, password TEXT, name TEXT, role TEXT
  );
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, category TEXT, price REAL, stock INTEGER,
    image TEXT, photo TEXT, createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    items TEXT, total REAL, paidAmount REAL, paymentStatus TEXT,
    customerName TEXT, customerPhone TEXT, timestamp TEXT
  );
`;

const SEED_PRODUCTS = [
  ['Eau minérale 1.5L', 'Boissons', 500, 120, '💧'],
  ['Coca-Cola 33cl', 'Boissons', 400, 200, '🥤'],
  ["Jus d'orange 1L", 'Boissons', 1000, 60, '🧃'],
  ['Café soluble 100g', 'Alimentation', 2000, 35, '☕'],
  ['Pain de mie', 'Alimentation', 800, 30, '🍞'],
  ['Riz parfumé 5kg', 'Épicerie', 4500, 25, '🍚'],
  ['Huile végétale 1L', 'Épicerie', 1500, 40, '🛢️'],
  ['Spaghetti 500g', 'Épicerie', 600, 60, '🍝'],
  ['Sucre en poudre 1kg', 'Épicerie', 700, 80, '🧂'],
  ['Lait en poudre 400g', 'Frais', 2500, 45, '🥛'],
  ['Œufs x30', 'Frais', 3000, 15, '🥚'],
  ['Yaourt nature x4', 'Frais', 1500, 40, '🍶'],
  ['Savon de Marseille', 'Hygiène', 600, 90, '🧼'],
  ['Dentifrice', 'Hygiène', 1200, 50, '🪥'],
  ['Shampoing 400ml', 'Hygiène', 2800, 30, '🧴'],
  ['Lessive détergent 1kg', 'Entretien', 3500, 20, '🧺'],
  ['Eau de javel 1L', 'Entretien', 900, 55, '🧽'],
  ['Biscuits chocolat', 'Snacks', 500, 150, '🍪'],
  ['Chips 100g', 'Snacks', 700, 100, '🥔'],
  ['Chocolat tablette', 'Snacks', 1000, 70, '🍫']
];

// --- Initialisation (une seule fois) ---------------------------------------
let db = null;

const persist = async () => {
  try {
    await idbSet(DB_STORE_KEY, db.export());
  } catch (e) {
    console.error('Persistance SQLite échouée :', e);
  }
};

const ready = (async () => {
  const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });
  const saved = await idbGet(DB_STORE_KEY);
  if (saved) {
    db = new SQL.Database(new Uint8Array(saved));
    db.run(SCHEMA); // garantit les tables si fichier ancien
  } else {
    db = new SQL.Database();
    db.run(SCHEMA);
    const today = new Date().toISOString().slice(0, 10);
    db.run(
      "INSERT INTO users (username, password, name, role) VALUES ('admin','password','Administrateur Principal','admin')"
    );
    const stmt = db.prepare(
      'INSERT INTO products (name, category, price, stock, image, photo, createdAt) VALUES (?,?,?,?,?,NULL,?)'
    );
    SEED_PRODUCTS.forEach(([name, cat, price, stock, image]) => {
      stmt.run([name, cat, price, stock, image, today]);
    });
    stmt.free();
    await persist();
  }
})();

// --- Helpers requêtes ------------------------------------------------------
const all = (sql, params = []) => {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
};

const one = (sql, params = []) => {
  const rows = all(sql, params);
  return rows[0] || null;
};

const exec = (sql, params = []) => db.run(sql, params);
const lastId = () => all('SELECT last_insert_rowid() AS id')[0].id;

// --- API (même signature que l'ancienne API REST) --------------------------
const api = {
  // Auth
  login: async (username, password) => {
    await ready;
    const user = one('SELECT * FROM users WHERE username=? AND password=?', [username, password]);
    if (!user) throw new Error('Identifiants invalides');
    return user;
  },

  // Utilisateurs
  getUsers: async () => {
    await ready;
    return all('SELECT * FROM users ORDER BY id');
  },
  addUser: async (user) => {
    await ready;
    exec('INSERT INTO users (username, password, name, role) VALUES (?,?,?,?)',
      [user.username, user.password, user.name, user.role]);
    await persist();
    return one('SELECT * FROM users WHERE id=?', [lastId()]);
  },
  updateUser: async (id, user) => {
    await ready;
    const cur = one('SELECT * FROM users WHERE id=?', [id]) || {};
    const m = { ...cur, ...user };
    exec('UPDATE users SET username=?, password=?, name=?, role=? WHERE id=?',
      [m.username, m.password, m.name, m.role, id]);
    await persist();
    return one('SELECT * FROM users WHERE id=?', [id]);
  },
  deleteUser: async (id) => {
    await ready;
    exec('DELETE FROM users WHERE id=?', [id]);
    await persist();
    return { success: true };
  },

  // Produits
  getProducts: async () => {
    await ready;
    return all('SELECT * FROM products ORDER BY id');
  },
  addProduct: async (p) => {
    await ready;
    const createdAt = p.createdAt || new Date().toISOString().slice(0, 10);
    exec('INSERT INTO products (name, category, price, stock, image, photo, createdAt) VALUES (?,?,?,?,?,?,?)',
      [p.name, p.category || 'Autres', parseFloat(p.price) || 0, parseInt(p.stock) || 0, p.image || '🛒', p.photo || null, createdAt]);
    await persist();
    return one('SELECT * FROM products WHERE id=?', [lastId()]);
  },
  updateProduct: async (id, p) => {
    await ready;
    const cur = one('SELECT * FROM products WHERE id=?', [id]) || {};
    const m = { ...cur, ...p };
    exec('UPDATE products SET name=?, category=?, price=?, stock=?, image=?, photo=? WHERE id=?',
      [m.name, m.category, parseFloat(m.price) || 0, parseInt(m.stock) || 0, m.image, m.photo || null, id]);
    await persist();
    return one('SELECT * FROM products WHERE id=?', [id]);
  },
  deleteProduct: async (id) => {
    await ready;
    exec('DELETE FROM products WHERE id=?', [id]);
    await persist();
    return { success: true };
  },

  // Ventes
  getSales: async () => {
    await ready;
    return all('SELECT * FROM sales ORDER BY timestamp DESC').map(s => {
      let items = [];
      try { items = s.items ? JSON.parse(s.items) : []; } catch { items = []; }
      return { ...s, items };
    });
  },
  addSale: async (saleData) => {
    await ready;
    const items = saleData.items || [];
    const timestamp = new Date().toISOString();
    exec('INSERT INTO sales (items, total, paidAmount, paymentStatus, customerName, customerPhone, timestamp) VALUES (?,?,?,?,?,?,?)',
      [
        JSON.stringify(items),
        saleData.total || 0,
        saleData.paidAmount != null ? saleData.paidAmount : (saleData.total || 0),
        saleData.paymentStatus || 'paid',
        saleData.customerName || null,
        saleData.customerPhone || null,
        timestamp
      ]);
    const id = lastId();
    // Décrémente le stock
    items.forEach(item => {
      exec('UPDATE products SET stock = MAX(0, stock - ?) WHERE id=?', [item.quantity, item.id]);
    });
    await persist();
    return { id, items, total: saleData.total || 0, timestamp, paymentStatus: saleData.paymentStatus || 'paid' };
  },
  updateSale: async (id, saleData) => {
    await ready;
    const cur = one('SELECT * FROM sales WHERE id=?', [id]) || {};
    const m = { ...cur, ...saleData };
    const itemsStr = typeof m.items === 'string' ? m.items : JSON.stringify(m.items || []);
    exec('UPDATE sales SET items=?, total=?, paidAmount=?, paymentStatus=? WHERE id=?',
      [itemsStr, m.total, m.paidAmount, m.paymentStatus, id]);
    await persist();
    const updated = one('SELECT * FROM sales WHERE id=?', [id]);
    return { ...updated, items: JSON.parse(updated.items || '[]') };
  }
};

export default api;
