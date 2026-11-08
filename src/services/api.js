// ============================================================================
//  X-Shop — Accès aux données via Supabase (PostgreSQL hébergé)
//  Les données vivent côté serveur (base partagée entre tous les appareils),
//  plus dans le navigateur. L'interface est identique à l'ancienne API : le
//  reste de l'application est inchangé.
// ============================================================================

import { supabase } from './supabase';

// --- Normalisation des champs numériques (Postgres renvoie `numeric` en texte)
const num = (v) => (v == null ? 0 : Number(v));

const normProduct = (p) => p && ({ ...p, price: num(p.price), stock: num(p.stock) });
const normSale = (s) => s && ({
  ...s,
  items: Array.isArray(s.items) ? s.items : (s.items || []),
  total: num(s.total),
  paidAmount: num(s.paidAmount)
});
const normUnit = (u) => u && ({ ...u, price: num(u.price), capacity: num(u.capacity) });
const normRental = (r) => r && ({
  ...r,
  duration: num(r.duration),
  unitPrice: num(r.unitPrice),
  total: num(r.total),
  paidAmount: num(r.paidAmount)
});

const check = (error, context) => {
  if (error) {
    console.error(`Supabase [${context}]`, error);
    throw new Error(error.message || context);
  }
};

const api = {
  // ---- Auth ----
  login: async (username, password) => {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .limit(1);
    check(error, 'login');
    if (!data || data.length === 0) throw new Error('Identifiants invalides');
    return data[0];
  },

  // ---- Utilisateurs ----
  getUsers: async () => {
    const { data, error } = await supabase.from('app_users').select('*').order('id');
    check(error, 'getUsers');
    return data || [];
  },
  addUser: async (user) => {
    const { data, error } = await supabase.from('app_users').insert({
      username: user.username, password: user.password, name: user.name, role: user.role
    }).select().single();
    check(error, 'addUser');
    return data;
  },
  updateUser: async (id, user) => {
    const patch = {};
    ['username', 'password', 'name', 'role'].forEach(k => { if (user[k] !== undefined) patch[k] = user[k]; });
    const { data, error } = await supabase.from('app_users').update(patch).eq('id', id).select().single();
    check(error, 'updateUser');
    return data;
  },
  deleteUser: async (id) => {
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    check(error, 'deleteUser');
    return { success: true };
  },

  // ---- Produits ----
  getProducts: async () => {
    const { data, error } = await supabase.from('products').select('*').order('id');
    check(error, 'getProducts');
    return (data || []).map(normProduct);
  },
  addProduct: async (p) => {
    const { data, error } = await supabase.from('products').insert({
      name: p.name,
      category: p.category || 'Autres',
      price: parseFloat(p.price) || 0,
      stock: parseInt(p.stock) || 0,
      image: p.image || '🛒',
      photo: p.photo || null,
      createdAt: p.createdAt || new Date().toISOString().slice(0, 10)
    }).select().single();
    check(error, 'addProduct');
    return normProduct(data);
  },
  updateProduct: async (id, p) => {
    const patch = {};
    if (p.name !== undefined) patch.name = p.name;
    if (p.category !== undefined) patch.category = p.category;
    if (p.price !== undefined) patch.price = parseFloat(p.price) || 0;
    if (p.stock !== undefined) patch.stock = parseInt(p.stock) || 0;
    if (p.image !== undefined) patch.image = p.image;
    if (p.photo !== undefined) patch.photo = p.photo || null;
    const { data, error } = await supabase.from('products').update(patch).eq('id', id).select().single();
    check(error, 'updateProduct');
    return normProduct(data);
  },
  deleteProduct: async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    check(error, 'deleteProduct');
    return { success: true };
  },

  // ---- Ventes ----
  getSales: async () => {
    const { data, error } = await supabase.from('sales').select('*').order('timestamp', { ascending: false });
    check(error, 'getSales');
    return (data || []).map(normSale);
  },
  addSale: async (saleData) => {
    const items = saleData.items || [];
    const total = saleData.total || 0;
    const { data, error } = await supabase.from('sales').insert({
      items,
      total,
      paidAmount: saleData.paidAmount != null ? saleData.paidAmount : total,
      paymentStatus: saleData.paymentStatus || 'paid',
      customerName: saleData.customerName || null,
      customerPhone: saleData.customerPhone || null
    }).select().single();
    check(error, 'addSale');

    // Décrémente le stock des produits (uniquement les vrais produits à id numérique)
    for (const item of items) {
      const pid = Number(item.id);
      if (!Number.isFinite(pid)) continue; // ignore ex. l'entrée "piscine"
      const { data: prod } = await supabase.from('products').select('stock').eq('id', pid).single();
      if (prod) {
        const newStock = Math.max(0, num(prod.stock) - (item.quantity || 0));
        await supabase.from('products').update({ stock: newStock }).eq('id', pid);
      }
    }
    return normSale(data);
  },
  updateSale: async (id, saleData) => {
    const patch = {};
    if (saleData.items !== undefined) patch.items = saleData.items;
    if (saleData.total !== undefined) patch.total = parseFloat(saleData.total) || 0;
    if (saleData.paidAmount !== undefined) patch.paidAmount = parseFloat(saleData.paidAmount) || 0;
    if (saleData.paymentStatus !== undefined) patch.paymentStatus = saleData.paymentStatus;
    if (saleData.customerName !== undefined) patch.customerName = saleData.customerName || null;
    if (saleData.customerPhone !== undefined) patch.customerPhone = saleData.customerPhone || null;
    const { data, error } = await supabase.from('sales').update(patch).eq('id', id).select().single();
    check(error, 'updateSale');
    return normSale(data);
  },

  // ---- Hébergement : unités de location ----
  getRentalUnits: async () => {
    const { data, error } = await supabase.from('rental_units').select('*').order('type').order('id');
    check(error, 'getRentalUnits');
    return (data || []).map(normUnit);
  },
  addRentalUnit: async (u) => {
    const { data, error } = await supabase.from('rental_units').insert({
      type: u.type || 'appartement',
      name: u.name,
      price: parseFloat(u.price) || 0,
      capacity: parseInt(u.capacity) || 0,
      description: u.description || '',
      status: u.status || 'libre',
      createdAt: new Date().toISOString().slice(0, 10)
    }).select().single();
    check(error, 'addRentalUnit');
    return normUnit(data);
  },
  updateRentalUnit: async (id, u) => {
    const patch = {};
    if (u.type !== undefined) patch.type = u.type;
    if (u.name !== undefined) patch.name = u.name;
    if (u.price !== undefined) patch.price = parseFloat(u.price) || 0;
    if (u.capacity !== undefined) patch.capacity = parseInt(u.capacity) || 0;
    if (u.description !== undefined) patch.description = u.description || '';
    if (u.status !== undefined) patch.status = u.status || 'libre';
    const { data, error } = await supabase.from('rental_units').update(patch).eq('id', id).select().single();
    check(error, 'updateRentalUnit');
    return normUnit(data);
  },
  deleteRentalUnit: async (id) => {
    const { error } = await supabase.from('rental_units').delete().eq('id', id);
    check(error, 'deleteRentalUnit');
    return { success: true };
  },

  // ---- Hébergement : locations ----
  getRentals: async () => {
    const { data, error } = await supabase.from('rentals').select('*').order('timestamp', { ascending: false });
    check(error, 'getRentals');
    return (data || []).map(normRental);
  },
  addRental: async (r) => {
    const total = r.total != null ? r.total : (parseFloat(r.unitPrice) || 0) * (parseInt(r.duration) || 1);
    const { data, error } = await supabase.from('rentals').insert({
      unitId: r.unitId,
      unitName: r.unitName,
      unitType: r.unitType,
      customerName: r.customerName || null,
      customerPhone: r.customerPhone || null,
      startDate: r.startDate || null,
      endDate: r.endDate || null,
      duration: parseInt(r.duration) || 1,
      unitPrice: parseFloat(r.unitPrice) || 0,
      total,
      paidAmount: r.paidAmount != null ? r.paidAmount : total,
      paymentStatus: r.paymentStatus || 'paid',
      status: 'active'
    }).select().single();
    check(error, 'addRental');
    if (r.unitId) await supabase.from('rental_units').update({ status: 'occupe' }).eq('id', r.unitId);
    return normRental(data);
  },
  updateRental: async (id, r) => {
    const patch = {};
    ['customerName', 'customerPhone', 'startDate', 'endDate', 'paymentStatus'].forEach(k => {
      if (r[k] !== undefined) patch[k] = r[k];
    });
    if (r.duration !== undefined) patch.duration = parseInt(r.duration) || 1;
    if (r.unitPrice !== undefined) patch.unitPrice = parseFloat(r.unitPrice) || 0;
    if (r.total !== undefined) patch.total = parseFloat(r.total) || 0;
    const { data, error } = await supabase.from('rentals').update(patch).eq('id', id).select().single();
    check(error, 'updateRental');
    return normRental(data);
  },
  checkoutRental: async (id) => {
    const { data: r } = await supabase.from('rentals').select('*').eq('id', id).single();
    if (r) {
      await supabase.from('rentals').update({ status: 'terminee' }).eq('id', id);
      if (r.unitId) await supabase.from('rental_units').update({ status: 'libre' }).eq('id', r.unitId);
    }
    return { success: true };
  },

  // ---- Réglages (table settings : prix piscine, etc.) ----
  getSetting: async (key, defaultValue = null) => {
    const { data, error } = await supabase.from('settings').select('value').eq('key', key).limit(1);
    check(error, 'getSetting');
    if (!data || data.length === 0) return defaultValue;
    return data[0].value;
  },
  setSetting: async (key, value) => {
    const { error } = await supabase.from('settings').upsert({ key, value: String(value) });
    check(error, 'setSetting');
    return value;
  }
};

export default api;
