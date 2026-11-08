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
  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY, value TEXT
  );
  CREATE TABLE IF NOT EXISTS rental_units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, name TEXT, price REAL, capacity INTEGER,
    description TEXT, status TEXT, createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unitId INTEGER, unitName TEXT, unitType TEXT,
    customerName TEXT, customerPhone TEXT,
    startDate TEXT, endDate TEXT, duration INTEGER,
    unitPrice REAL, total REAL, paidAmount REAL, paymentStatus TEXT,
    status TEXT, timestamp TEXT
  );
`;

// Version du catalogue de base. Incrémenter quand on ajoute des données par
// défaut : la migration insère alors les nouveautés SANS toucher aux données
// existantes (produits/unités ajoutés, ventes, locations, utilisateurs conservés).
const SEED_VERSION = 3;

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
  ['Chocolat tablette', 'Snacks', 1000, 70, '🍫'],
  ['Sandwich jambon-beurre', 'Sandwichs', 1000, 40, '🥪'],
  ['Sandwich poulet crudités', 'Sandwichs', 1500, 35, '🥪'],
  ['Sandwich thon', 'Sandwichs', 1500, 30, '🥪'],
  ['Sandwich œuf-mayo', 'Sandwichs', 1000, 30, '🥪'],
  ['Sandwich fromage', 'Sandwichs', 1000, 35, '🧀'],
  ['Sandwich steak haché', 'Sandwichs', 2000, 25, '🍔'],
  ['Hot-dog', 'Sandwichs', 1500, 30, '🌭'],
  ['Wrap poulet', 'Sandwichs', 1800, 25, '🌯'],
  ['Panini mixte', 'Sandwichs', 1800, 25, '🥪'],
  ['Hamburger maison', 'Sandwichs', 2500, 20, '🍔']
];

// Unités de location (appartements : prix/nuit ; salles d'activité : prix/jour)
// [type, nom, prix, capacité, description]
const SEED_UNITS = [
  ['appartement', 'Appartement A1 — Studio', 15000, 2, 'Studio meublé, 1 chambre, cuisine équipée'],
  ['appartement', 'Appartement A2 — F2', 25000, 4, '2 chambres, salon, balcon'],
  ['appartement', 'Appartement A3 — F3', 35000, 6, '3 chambres, salon, 2 salles de bain'],
  ['appartement', 'Appartement A4 — Suite', 50000, 2, 'Suite de luxe, vue mer, climatisée'],
  ['salle', "Salle d'activité — Conférence", 40000, 100, 'Salle de conférence, projecteur, sonorisation'],
  ['salle', "Salle d'activité — Réunion", 20000, 30, 'Salle de réunion climatisée, écran'],
  ['salle', "Salle d'activité — Fête", 75000, 200, 'Grande salle de réception, scène, cuisine']
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

// Insère les produits du catalogue de base qui ne sont pas déjà présents
// (comparaison par nom) → ne crée jamais de doublon, ne supprime rien.
const insertMissingSeedProducts = () => {
  const today = new Date().toISOString().slice(0, 10);
  const existing = new Set(
    all('SELECT name FROM products').map(r => (r.name || '').toLowerCase())
  );
  const stmt = db.prepare(
    'INSERT INTO products (name, category, price, stock, image, photo, createdAt) VALUES (?,?,?,?,?,NULL,?)'
  );
  let added = 0;
  SEED_PRODUCTS.forEach(([name, cat, price, stock, image]) => {
    if (!existing.has(name.toLowerCase())) {
      stmt.run([name, cat, price, stock, image, today]);
      added++;
    }
  });
  stmt.free();
  return added;
};

// Insère les unités de location de base manquantes (comparaison par nom).
const insertMissingSeedUnits = () => {
  const today = new Date().toISOString().slice(0, 10);
  const existing = new Set(
    all('SELECT name FROM rental_units').map(r => (r.name || '').toLowerCase())
  );
  const stmt = db.prepare(
    "INSERT INTO rental_units (type, name, price, capacity, description, status, createdAt) VALUES (?,?,?,?,?,'libre',?)"
  );
  let added = 0;
  SEED_UNITS.forEach(([type, name, price, capacity, description]) => {
    if (!existing.has(name.toLowerCase())) {
      stmt.run([type, name, price, capacity, description, today]);
      added++;
    }
  });
  stmt.free();
  return added;
};

const getMeta = (key) => {
  const row = one('SELECT value FROM meta WHERE key=?', [key]);
  return row ? row.value : null;
};
const setMeta = (key, value) => exec('INSERT OR REPLACE INTO meta (key, value) VALUES (?,?)', [key, String(value)]);

const ready = (async () => {
  const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });
  const saved = await idbGet(DB_STORE_KEY);
  if (saved) {
    // Base existante → on CONSERVE toutes les données et on applique seulement
    // les nouveautés du catalogue (migration jouée une seule fois par version).
    db = new SQL.Database(new Uint8Array(saved));
    db.run(SCHEMA); // garantit les tables (dont meta) si fichier ancien
    const current = parseInt(getMeta('seedVersion')) || 1;
    if (current < SEED_VERSION) {
      insertMissingSeedProducts();
      insertMissingSeedUnits();
      setMeta('seedVersion', SEED_VERSION);
      await persist();
    }
  } else {
    // Première ouverture → création + catalogue complet.
    db = new SQL.Database();
    db.run(SCHEMA);
    db.run(
      "INSERT INTO users (username, password, name, role) VALUES ('admin','password','Administrateur Principal','admin')"
    );
    insertMissingSeedProducts();
    insertMissingSeedUnits();
    setMeta('seedVersion', SEED_VERSION);
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
    return {
      id, items, total: saleData.total || 0, timestamp,
      paidAmount: saleData.paidAmount != null ? saleData.paidAmount : (saleData.total || 0),
      paymentStatus: saleData.paymentStatus || 'paid',
      customerName: saleData.customerName || null,
      customerPhone: saleData.customerPhone || null
    };
  },
  updateSale: async (id, saleData) => {
    await ready;
    const cur = one('SELECT * FROM sales WHERE id=?', [id]) || {};
    const m = { ...cur, ...saleData };
    const itemsStr = typeof m.items === 'string' ? m.items : JSON.stringify(m.items || []);
    exec('UPDATE sales SET items=?, total=?, paidAmount=?, paymentStatus=?, customerName=?, customerPhone=? WHERE id=?',
      [itemsStr, m.total, m.paidAmount, m.paymentStatus, m.customerName ?? null, m.customerPhone ?? null, id]);
    await persist();
    const updated = one('SELECT * FROM sales WHERE id=?', [id]);
    return { ...updated, items: JSON.parse(updated.items || '[]') };
  },

  // --- Hébergement : unités de location (appartements / salles) ---
  getRentalUnits: async () => {
    await ready;
    return all('SELECT * FROM rental_units ORDER BY type, id');
  },
  addRentalUnit: async (u) => {
    await ready;
    const createdAt = new Date().toISOString().slice(0, 10);
    exec("INSERT INTO rental_units (type, name, price, capacity, description, status, createdAt) VALUES (?,?,?,?,?,?,?)",
      [u.type || 'appartement', u.name, parseFloat(u.price) || 0, parseInt(u.capacity) || 0, u.description || '', u.status || 'libre', createdAt]);
    await persist();
    return one('SELECT * FROM rental_units WHERE id=?', [lastId()]);
  },
  updateRentalUnit: async (id, u) => {
    await ready;
    const cur = one('SELECT * FROM rental_units WHERE id=?', [id]) || {};
    const m = { ...cur, ...u };
    exec('UPDATE rental_units SET type=?, name=?, price=?, capacity=?, description=?, status=? WHERE id=?',
      [m.type, m.name, parseFloat(m.price) || 0, parseInt(m.capacity) || 0, m.description || '', m.status || 'libre', id]);
    await persist();
    return one('SELECT * FROM rental_units WHERE id=?', [id]);
  },
  deleteRentalUnit: async (id) => {
    await ready;
    exec('DELETE FROM rental_units WHERE id=?', [id]);
    await persist();
    return { success: true };
  },

  // --- Hébergement : locations ---
  getRentals: async () => {
    await ready;
    return all('SELECT * FROM rentals ORDER BY timestamp DESC');
  },
  addRental: async (r) => {
    await ready;
    const timestamp = new Date().toISOString();
    const total = r.total != null ? r.total : (parseFloat(r.unitPrice) || 0) * (parseInt(r.duration) || 1);
    exec(`INSERT INTO rentals
      (unitId, unitName, unitType, customerName, customerPhone, startDate, endDate, duration, unitPrice, total, paidAmount, paymentStatus, status, timestamp)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        r.unitId, r.unitName, r.unitType,
        r.customerName || null, r.customerPhone || null,
        r.startDate || null, r.endDate || null, parseInt(r.duration) || 1,
        parseFloat(r.unitPrice) || 0, total,
        r.paidAmount != null ? r.paidAmount : total,
        r.paymentStatus || 'paid', 'active', timestamp
      ]);
    const id = lastId();
    // Marque l'unité occupée
    if (r.unitId) exec("UPDATE rental_units SET status='occupe' WHERE id=?", [r.unitId]);
    await persist();
    return one('SELECT * FROM rentals WHERE id=?', [id]);
  },
  updateRental: async (id, r) => {
    await ready;
    const cur = one('SELECT * FROM rentals WHERE id=?', [id]) || {};
    const m = { ...cur, ...r };
    exec('UPDATE rentals SET customerName=?, customerPhone=?, startDate=?, endDate=?, duration=?, unitPrice=?, total=?, paidAmount=?, paymentStatus=? WHERE id=?',
      [m.customerName || null, m.customerPhone || null, m.startDate, m.endDate, parseInt(m.duration) || 1,
       parseFloat(m.unitPrice) || 0, parseFloat(m.total) || 0, parseFloat(m.paidAmount) || 0, m.paymentStatus, id]);
    await persist();
    return one('SELECT * FROM rentals WHERE id=?', [id]);
  },
  // Clôture une location → libère l'unité
  checkoutRental: async (id) => {
    await ready;
    const r = one('SELECT * FROM rentals WHERE id=?', [id]);
    if (r) {
      exec("UPDATE rentals SET status='terminee' WHERE id=?", [id]);
      if (r.unitId) exec("UPDATE rental_units SET status='libre' WHERE id=?", [r.unitId]);
      await persist();
    }
    return { success: true };
  },

  // Réglages dynamiques (table meta : prix piscine, etc.)
  getSetting: async (key, defaultValue = null) => {
    await ready;
    const v = getMeta(key);
    return v == null ? defaultValue : v;
  },
  setSetting: async (key, value) => {
    await ready;
    setMeta(key, value);
    await persist();
    return value;
  }
};

export default api;
