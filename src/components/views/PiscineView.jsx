import React, { useEffect, useMemo, useState } from 'react';
import {
  Waves,
  Minus,
  Plus,
  Ticket,
  Users,
  Wallet,
  Tag,
  Save,
  CheckCircle2,
  User
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

const PISCINE_ITEM_ID = 'piscine';
const PISCINE_ITEM_NAME = 'Accès Piscine';
const DEFAULT_PRICE = 3000;

const isPiscineSale = (s) =>
  (s.items || []).some(it => it.id === PISCINE_ITEM_ID || it.name === PISCINE_ITEM_NAME);

const piscinePersons = (s) =>
  (s.items || [])
    .filter(it => it.id === PISCINE_ITEM_ID || it.name === PISCINE_ITEM_NAME)
    .reduce((a, it) => a + (it.quantity || 0), 0);

const PiscineView = ({ sales = [], onSale, canEditPrice = false }) => {
  const [price, setPrice] = useState(DEFAULT_PRICE);
  const [priceInput, setPriceInput] = useState(String(DEFAULT_PRICE));
  const [persons, setPersons] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(null);

  // Charge le prix dynamique depuis la base
  useEffect(() => {
    let alive = true;
    (async () => {
      const v = await api.getSetting('piscinePrice', String(DEFAULT_PRICE));
      if (!alive) return;
      const n = parseInt(v) || DEFAULT_PRICE;
      setPrice(n);
      setPriceInput(String(n));
    })();
    return () => { alive = false; };
  }, []);

  const fmt = (n) => (Number(n) || 0).toLocaleString();
  const today = new Date().toISOString().slice(0, 10);

  const todaySales = useMemo(
    () => sales
      .filter(s => isPiscineSale(s) && (s.timestamp || '').startsWith(today))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [sales, today]
  );

  const stats = useMemo(() => {
    let entries = 0, people = 0, revenue = 0;
    todaySales.forEach(s => {
      entries += 1;
      people += piscinePersons(s);
      revenue += s.total || 0;
    });
    return { entries, people, revenue };
  }, [todaySales]);

  const savePrice = async () => {
    const n = parseInt(priceInput);
    if (!n || n <= 0) {
      setFlash({ type: 'warn', msg: 'Prix invalide.' });
      return;
    }
    await api.setSetting('piscinePrice', String(n));
    setPrice(n);
    setFlash({ type: 'ok', msg: `Prix d'entrée mis à jour : ${fmt(n)} F CFA.` });
  };

  const registerEntry = async () => {
    const qty = Math.max(1, parseInt(persons) || 1);
    setSaving(true);
    setFlash(null);
    try {
      const item = {
        id: PISCINE_ITEM_ID,
        name: PISCINE_ITEM_NAME,
        price,
        quantity: qty,
        image: '🏊'
      };
      await onSale([item], { customerName: customerName.trim() || null });
      setFlash({ type: 'ok', msg: `Entrée enregistrée : ${qty} personne(s) — ${fmt(price * qty)} F CFA.` });
      setPersons(1);
      setCustomerName('');
    } catch (e) {
      setFlash({ type: 'warn', msg: "Erreur lors de l'enregistrement de l'entrée." });
    } finally {
      setSaving(false);
    }
  };

  const total = price * Math.max(1, parseInt(persons) || 1);

  return (
    <div className="piscine-view animate-fade-in">
      <div className="piscine-head">
        <div className="piscine-icon"><Waves size={26} /></div>
        <div>
          <h2>Accès Piscine</h2>
          <p>Enregistrez les entrées et gérez le tarif dynamiquement</p>
        </div>
      </div>

      {flash && (
        <div className={`piscine-flash ${flash.type}`}>
          <CheckCircle2 size={18} /> <span>{flash.msg}</span>
        </div>
      )}

      {/* Stats du jour */}
      <div className="piscine-stats">
        <div className="card-premium p-stat">
          <div className="p-stat-ic" style={{ background: '#eef2ff', color: '#4f46e5' }}><Ticket size={22} /></div>
          <div><span>Entrées du jour</span><h3>{stats.entries}</h3></div>
        </div>
        <div className="card-premium p-stat">
          <div className="p-stat-ic" style={{ background: '#ecfdf5', color: '#10b981' }}><Users size={22} /></div>
          <div><span>Personnes</span><h3>{stats.people}</h3></div>
        </div>
        <div className="card-premium p-stat">
          <div className="p-stat-ic" style={{ background: '#fff7ed', color: '#f59e0b' }}><Wallet size={22} /></div>
          <div><span>Recettes du jour</span><h3>{fmt(stats.revenue)} F CFA</h3></div>
        </div>
      </div>

      <div className="piscine-grid">
        {/* Enregistrement d'une entrée */}
        <div className="card-premium piscine-entry">
          <h3 className="p-card-title"><Ticket size={20} /> Nouvelle entrée</h3>

          <div className="price-tag">
            <Tag size={18} />
            <span>Tarif d'entrée</span>
            <strong>{fmt(price)} F CFA</strong>
          </div>

          <label className="p-label">Nombre de personnes</label>
          <div className="stepper">
            <button onClick={() => setPersons(p => Math.max(1, (parseInt(p) || 1) - 1))}><Minus size={18} /></button>
            <input
              type="number" min="1" value={persons}
              onChange={(e) => setPersons(e.target.value)}
            />
            <button onClick={() => setPersons(p => (parseInt(p) || 1) + 1)}><Plus size={18} /></button>
          </div>

          <label className="p-label">Client <em className="opt">(optionnel)</em></label>
          <div className="input-ic">
            <User size={16} />
            <input
              type="text" placeholder="Facultatif"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="entry-total">
            <span>Total à encaisser</span>
            <strong>{fmt(total)} F CFA</strong>
          </div>

          <button className="btn-entry" disabled={saving} onClick={registerEntry}>
            <CheckCircle2 size={18} /> {saving ? 'Enregistrement…' : "Enregistrer l'entrée"}
          </button>
        </div>

        {/* Tarif dynamique + liste du jour */}
        <div className="piscine-right">
          <div className="card-premium piscine-price-card">
            <h3 className="p-card-title"><Tag size={20} /> Tarif dynamique</h3>
            {canEditPrice ? (
              <>
                <label className="p-label">Prix d'une entrée (F CFA)</label>
                <div className="price-edit">
                  <input
                    type="number" min="0" value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                  />
                  <button className="btn-save-price" onClick={savePrice}>
                    <Save size={16} /> Enregistrer
                  </button>
                </div>
                <p className="price-hint">Le nouveau tarif s'applique immédiatement aux prochaines entrées.</p>
              </>
            ) : (
              <p className="price-hint">Tarif actuel : <strong>{fmt(price)} F CFA</strong>. Seuls un administrateur ou un gestionnaire peuvent le modifier.</p>
            )}
          </div>

          <div className="card-premium piscine-list-card">
            <h3 className="p-card-title"><Waves size={20} /> Entrées du jour</h3>
            {todaySales.length === 0 ? (
              <div className="p-empty">Aucune entrée enregistrée aujourd'hui.</div>
            ) : (
              <div className="p-list">
                {todaySales.map(s => (
                  <div key={s.id} className="p-row">
                    <div className="p-row-time">
                      {new Date(s.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="p-row-main">
                      <strong>{piscinePersons(s)} pers.</strong>
                      <span>{s.customerName || 'Client anonyme'}</span>
                    </div>
                    <div className="p-row-total">{fmt(s.total)} F CFA</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .piscine-view { display: flex; flex-direction: column; gap: 28px; padding-bottom: 40px; }

        .piscine-head { display: flex; align-items: center; gap: 18px; }
        .piscine-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg,#38bdf8,#4f46e5); color: #fff; box-shadow: 0 10px 22px rgba(56,189,248,0.35); }
        .piscine-head h2 { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); letter-spacing: -1px; }
        .piscine-head p { color: var(--text-muted); font-weight: 600; font-size: 0.95rem; }

        .piscine-flash { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-radius: 16px; font-weight: 700; font-size: 0.9rem; }
        .piscine-flash.ok { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
        .piscine-flash.warn { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }

        .piscine-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .p-stat { display: flex; align-items: center; gap: 18px; padding: 22px 26px; }
        .p-stat-ic { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .p-stat span { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .p-stat h3 { font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-top: 3px; }

        .piscine-grid { display: grid; grid-template-columns: 1fr 1.1fr; gap: 24px; align-items: start; }
        .piscine-right { display: flex; flex-direction: column; gap: 24px; }

        .p-card-title { display: flex; align-items: center; gap: 10px; font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 20px; }

        .price-tag { display: flex; align-items: center; gap: 10px; background: var(--primary-light); color: var(--primary); padding: 12px 16px; border-radius: 14px; font-weight: 700; margin-bottom: 22px; }
        .price-tag span { flex: 1; font-size: 0.9rem; }
        .price-tag strong { font-size: 1.05rem; }

        .p-label { display: block; font-size: 0.78rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 8px; }
        .p-label .opt { font-style: normal; font-weight: 600; text-transform: none; opacity: 0.7; }

        .stepper { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .stepper button { width: 46px; height: 46px; border-radius: 14px; background: var(--bg-main); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--primary); }
        .stepper button:hover { background: var(--primary-light); }
        .stepper input { flex: 1; text-align: center; font-size: 1.3rem; font-weight: 800; color: var(--text-primary); border: 1px solid var(--border); border-radius: 14px; padding: 10px; background: var(--bg-main); outline: none; }

        .input-ic { display: flex; align-items: center; gap: 10px; border: 1px solid var(--border); border-radius: 14px; padding: 0 14px; background: var(--bg-main); color: var(--text-muted); margin-bottom: 22px; }
        .input-ic input { border: none; background: transparent; outline: none; padding: 12px 0; font-size: 0.95rem; font-weight: 600; color: var(--text-primary); width: 100%; }

        .entry-total { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-radius: 16px; background: var(--bg-main); border: 1px dashed var(--border); margin-bottom: 18px; }
        .entry-total span { font-weight: 700; color: var(--text-secondary); }
        .entry-total strong { font-size: 1.35rem; font-weight: 800; color: var(--primary); }

        .btn-entry { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 15px; border-radius: 16px; font-weight: 800; font-size: 1rem; color: #fff; background: var(--grad-primary, var(--primary)); border: none; box-shadow: 0 10px 22px var(--primary-glow); }
        .btn-entry:disabled { opacity: 0.65; }

        .price-edit { display: flex; gap: 12px; }
        .price-edit input { flex: 1; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--border); background: var(--bg-main); font-size: 1.05rem; font-weight: 800; color: var(--text-primary); outline: none; }
        .price-edit input:focus { border-color: var(--primary); }
        .btn-save-price { display: inline-flex; align-items: center; gap: 8px; padding: 12px 18px; border-radius: 14px; font-weight: 700; color: #fff; background: var(--grad-primary, var(--primary)); border: none; white-space: nowrap; }
        .price-hint { margin-top: 12px; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }

        .p-empty { padding: 30px; text-align: center; color: var(--text-muted); font-weight: 600; }
        .p-list { display: flex; flex-direction: column; gap: 10px; max-height: 320px; overflow-y: auto; }
        .p-row { display: flex; align-items: center; gap: 14px; padding: 12px 14px; border-radius: 14px; background: var(--bg-main); }
        .p-row-time { font-weight: 800; color: var(--primary); font-size: 0.9rem; min-width: 48px; }
        .p-row-main { flex: 1; display: flex; flex-direction: column; }
        .p-row-main strong { font-weight: 800; color: var(--text-primary); }
        .p-row-main span { font-size: 0.82rem; color: var(--text-muted); font-weight: 600; }
        .p-row-total { font-weight: 800; color: var(--text-primary); white-space: nowrap; }

        @media (max-width: 1100px) {
          .piscine-grid { grid-template-columns: 1fr; }
          .piscine-stats { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .piscine-head h2 { font-size: 1.4rem; }
          .price-edit { flex-direction: column; }
          .btn-save-price { justify-content: center; }
        }
      `}} />
    </div>
  );
};

export default PiscineView;
