import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Database,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

// --- Helpers fichiers ---
const triggerDownload = (content, filename, mime) => {
  const blob = new Blob(['﻿' + content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const csvCell = (val) => {
  const s = val === null || val === undefined ? '' : String(val);
  if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
};

// Parseur CSV simple gérant les guillemets
const parseCSV = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',' || c === ';') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* ignore */ }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length && r.some(c => c.trim() !== ''));
};

const strip = (obj, keys) => {
  const o = { ...obj };
  keys.forEach(k => delete o[k]);
  return o;
};

const SettingsView = ({ products = [], onImported }) => {
  const csvInputRef = useRef(null);
  const jsonInputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'ok'|'warn', msg }

  const dateTag = () => new Date().toISOString().slice(0, 10);

  // --- Export produits CSV ---
  const exportProductsCSV = () => {
    const headers = ['name', 'category', 'price', 'stock', 'image'];
    const lines = [headers.join(',')];
    products.forEach(p => {
      lines.push(headers.map(h => csvCell(p[h])).join(','));
    });
    triggerDownload(lines.join('\n'), `produits-${dateTag()}.csv`, 'text/csv');
    setStatus({ type: 'ok', msg: `${products.length} produit(s) exporté(s) en CSV.` });
  };

  // --- Import produits CSV ---
  const importProductsCSV = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setStatus(null);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) throw new Error('Fichier CSV vide ou sans données.');
      const headers = rows[0].map(h => h.trim().toLowerCase());
      const idx = (name) => headers.indexOf(name);
      let ok = 0, fail = 0;
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const data = {
          name: (r[idx('name')] || '').trim(),
          category: (r[idx('category')] || 'Autres').trim() || 'Autres',
          price: parseFloat(r[idx('price')]) || 0,
          stock: parseInt(r[idx('stock')]) || 0,
          image: (r[idx('image')] || '🛒').trim() || '🛒'
        };
        if (!data.name) { fail++; continue; }
        try { await api.addProduct(data); ok++; } catch { fail++; }
      }
      if (onImported) await onImported();
      setStatus({ type: fail ? 'warn' : 'ok', msg: `Import CSV : ${ok} produit(s) ajouté(s)${fail ? `, ${fail} ignoré(s)` : ''}.` });
    } catch (err) {
      setStatus({ type: 'warn', msg: `Erreur import CSV : ${err.message}` });
    } finally {
      setBusy(false);
    }
  };

  // --- Export sauvegarde complète JSON ---
  const exportBackupJSON = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const [prd, sales, users] = await Promise.all([
        api.getProducts(), api.getSales(), api.getUsers()
      ]);
      const backup = {
        app: 'X-Shop',
        version: 1,
        exportedAt: new Date().toISOString(),
        products: prd,
        sales,
        users
      };
      triggerDownload(JSON.stringify(backup, null, 2), `xshop-sauvegarde-${dateTag()}.json`, 'application/json');
      setStatus({ type: 'ok', msg: `Sauvegarde exportée : ${prd.length} produits, ${sales.length} ventes, ${users.length} utilisateurs.` });
    } catch (err) {
      setStatus({ type: 'warn', msg: `Erreur export sauvegarde : ${err.message}` });
    } finally {
      setBusy(false);
    }
  };

  // --- Import / restauration JSON ---
  const importBackupJSON = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!window.confirm("Restaurer cette sauvegarde ? Les produits et utilisateurs du fichier seront AJOUTÉS à la base actuelle (les ventes ne sont pas réinjectées).")) return;
    setBusy(true);
    setStatus(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      let p = 0, u = 0;
      for (const prod of (data.products || [])) {
        try { await api.addProduct(strip(prod, ['id', 'createdAt', 'updatedAt'])); p++; } catch { /* skip */ }
      }
      for (const usr of (data.users || [])) {
        try { await api.addUser(strip(usr, ['id', 'createdAt', 'updatedAt'])); u++; } catch { /* skip (doublon username) */ }
      }
      if (onImported) await onImported();
      setStatus({ type: 'ok', msg: `Restauration : ${p} produits, ${u} utilisateurs ajoutés.` });
    } catch (err) {
      setStatus({ type: 'warn', msg: `Erreur restauration : fichier invalide (${err.message}).` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="settings-view animate-fade-in">
      <input ref={csvInputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={importProductsCSV} />
      <input ref={jsonInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={importBackupJSON} />

      {status && (
        <div className={`data-status ${status.type}`}>
          {status.type === 'ok' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{status.msg}</span>
        </div>
      )}

      {/* Section Produits CSV */}
      <div className="data-section">
        <div className="section-head">
          <div className="section-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}><FileSpreadsheet size={22} /></div>
          <div>
            <h3>Catalogue produits (CSV / Excel)</h3>
            <p>Exportez vos produits pour les éditer dans Excel, ou importez une liste.</p>
          </div>
        </div>
        <div className="cards-grid">
          <motion.div whileHover={{ y: -3 }} className="card-premium data-card">
            <div className="dc-icon export"><Download size={24} /></div>
            <h4>Exporter les produits</h4>
            <p>Télécharge le catalogue ({products.length} produits) au format CSV.</p>
            <button className="dc-btn primary" disabled={busy} onClick={exportProductsCSV}>
              <Download size={16} /> Exporter CSV
            </button>
          </motion.div>

          <motion.div whileHover={{ y: -3 }} className="card-premium data-card">
            <div className="dc-icon import"><Upload size={24} /></div>
            <h4>Importer des produits</h4>
            <p>Ajoute des produits depuis un CSV (colonnes : name, category, price, stock, image).</p>
            <button className="dc-btn" disabled={busy} onClick={() => csvInputRef.current.click()}>
              <Upload size={16} /> Choisir un fichier CSV
            </button>
          </motion.div>
        </div>
      </div>

      {/* Section Sauvegarde JSON */}
      <div className="data-section">
        <div className="section-head">
          <div className="section-icon" style={{ background: '#ecfdf5', color: '#10b981' }}><Database size={22} /></div>
          <div>
            <h3>Sauvegarde complète (JSON)</h3>
            <p>Exportez toutes les données (produits, ventes, utilisateurs) ou restaurez une sauvegarde.</p>
          </div>
        </div>
        <div className="cards-grid">
          <motion.div whileHover={{ y: -3 }} className="card-premium data-card">
            <div className="dc-icon save"><Save size={24} /></div>
            <h4>Exporter la sauvegarde</h4>
            <p>Télécharge un fichier JSON avec l'ensemble des données de la boutique.</p>
            <button className="dc-btn primary" disabled={busy} onClick={exportBackupJSON}>
              <Save size={16} /> {busy ? 'Traitement…' : 'Exporter la sauvegarde'}
            </button>
          </motion.div>

          <motion.div whileHover={{ y: -3 }} className="card-premium data-card">
            <div className="dc-icon restore"><RotateCcw size={24} /></div>
            <h4>Restaurer une sauvegarde</h4>
            <p>Réimporte produits et utilisateurs depuis un fichier JSON (ajout, sans écraser).</p>
            <button className="dc-btn" disabled={busy} onClick={() => jsonInputRef.current.click()}>
              <RotateCcw size={16} /> Choisir une sauvegarde
            </button>
          </motion.div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .settings-view { display: flex; flex-direction: column; gap: 32px; padding-bottom: 40px; }

        .data-status {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 20px; border-radius: 16px; font-weight: 700; font-size: 0.9rem;
        }
        .data-status.ok { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
        .data-status.warn { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }

        .data-section { display: flex; flex-direction: column; gap: 20px; }
        .section-head { display: flex; align-items: center; gap: 16px; }
        .section-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .section-head h3 { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); }
        .section-head p { color: var(--text-muted); font-weight: 600; font-size: 0.9rem; margin-top: 2px; }

        .cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

        .data-card { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; }
        .dc-icon { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
        .dc-icon.export, .dc-icon.save { background: var(--primary-light); color: var(--primary); }
        .dc-icon.import, .dc-icon.restore { background: #f1f5f9; color: var(--text-secondary); }
        .data-card h4 { font-size: 1.05rem; font-weight: 800; color: var(--text-primary); }
        .data-card p { color: var(--text-muted); font-weight: 600; font-size: 0.85rem; flex: 1; }

        .dc-btn {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 12px 20px; border-radius: 14px; font-weight: 700; font-size: 0.9rem;
          background: var(--bg-main); color: var(--text-secondary); border: 1px solid var(--border);
          margin-top: 4px;
        }
        .dc-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
        .dc-btn.primary { background: var(--grad-primary); color: white; border: none; box-shadow: 0 8px 18px var(--primary-glow); }
        .dc-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        @media (max-width: 768px) {
          .cards-grid { grid-template-columns: 1fr; gap: 16px; }
          .dc-btn { width: 100%; justify-content: center; }
          .section-head h3 { font-size: 1.1rem; }
        }
      `}} />
    </div>
  );
};

export default SettingsView;
