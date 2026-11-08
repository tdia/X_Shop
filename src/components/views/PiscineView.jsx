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
  User,
  Printer,
  Download,
  FileText,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import Receipt from '../Receipt';

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
  const [ticket, setTicket] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('daily');

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

  // Toutes les entrées piscine (tous jours confondus)
  const allPiscine = useMemo(
    () => sales
      .filter(isPiscineSale)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [sales]
  );

  // Agrégation par période (journalier : 7 jours / mensuel : 6 mois)
  const periodRows = useMemo(() => {
    const agg = (list) => list.reduce(
      (acc, s) => {
        acc.entries += 1;
        acc.people += piscinePersons(s);
        acc.revenue += s.total || 0;
        return acc;
      },
      { entries: 0, people: 0, revenue: 0 }
    );
    const rows = [];
    if (reportPeriod === 'daily') {
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().slice(0, 10);
        const list = allPiscine.filter(s => (s.timestamp || '').startsWith(ds));
        rows.push({ label: `${days[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`, ...agg(list) });
      }
    } else {
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const list = allPiscine.filter(s => {
          const sd = new Date(s.timestamp);
          return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
        });
        rows.push({ label: `${months[d.getMonth()]} ${d.getFullYear()}`, ...agg(list) });
      }
    }
    return rows;
  }, [allPiscine, reportPeriod]);

  const periodTotals = useMemo(
    () => periodRows.reduce(
      (a, r) => ({ entries: a.entries + r.entries, people: a.people + r.people, revenue: a.revenue + r.revenue }),
      { entries: 0, people: 0, revenue: 0 }
    ),
    [periodRows]
  );

  // --- Export CSV des entrées piscine ---
  const csvCell = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const exportCSV = () => {
    const headers = ['id', 'date', 'heure', 'personnes', 'client', 'telephone', 'total'];
    const lines = [headers.join(',')];
    allPiscine.forEach(s => {
      const d = new Date(s.timestamp);
      lines.push([
        s.id,
        d.toLocaleDateString('fr-FR'),
        d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        piscinePersons(s),
        s.customerName || '',
        s.customerPhone || '',
        s.total || 0
      ].map(csvCell).join(','));
    });
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entrees-piscine-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFlash({ type: 'ok', msg: `${allPiscine.length} entrée(s) piscine exportée(s) en CSV.` });
  };

  // --- Impression du rapport piscine (journalier / mensuel) ---
  const printReport = () => {
    const title = reportPeriod === 'daily' ? "Rapport Piscine Journalier" : "Rapport Piscine Mensuel";
    const rowsHtml = periodRows.filter(r => r.entries > 0).map(r => `
      <tr>
        <td>${r.label}</td>
        <td style="text-align:center">${r.entries}</td>
        <td style="text-align:center">${r.people}</td>
        <td style="text-align:right">${fmt(r.revenue)} F CFA</td>
      </tr>`).join('');
    const w = window.open('', '_blank');
    if (!w) {
      setFlash({ type: 'warn', msg: "Impression bloquée : autorisez les pop-ups." });
      return;
    }
    w.document.write(`
      <html><head><title>${title} - X-Shop</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        body { font-family:'Inter',sans-serif; padding:40px; color:#1e293b; }
        .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0ea5e9; padding-bottom:18px; margin-bottom:28px; }
        .brand { font-size:26px; font-weight:800; color:#0ea5e9; }
        .brand small { display:block; font-size:12px; color:#64748b; font-weight:600; }
        .meta { text-align:right; font-size:12px; color:#64748b; }
        h2 { text-align:center; text-transform:uppercase; letter-spacing:2px; font-size:16px; margin:0 0 24px; }
        .cards { display:flex; gap:16px; margin-bottom:26px; }
        .card { flex:1; background:#f0f9ff; border:1px solid #e0f2fe; border-radius:12px; padding:16px; text-align:center; }
        .card span { font-size:11px; color:#64748b; font-weight:700; text-transform:uppercase; }
        .card b { display:block; font-size:20px; color:#0f172a; margin-top:6px; }
        table { width:100%; border-collapse:collapse; }
        th { background:#0ea5e9; color:#fff; padding:12px; text-align:left; font-size:12px; }
        th:nth-child(2),th:nth-child(3){ text-align:center; } th:nth-child(4){ text-align:right; }
        td { padding:11px 12px; border-bottom:1px solid #e2e8f0; font-size:13px; }
        tr:nth-child(even) td { background:#f8fafc; }
        .tot td { background:#e0f2fe !important; font-weight:800; }
        .foot { margin-top:40px; text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:16px; }
        @media print { body { padding:0; } }
      </style></head><body>
        <div class="head">
          <div class="brand">X-SHOP <small>Gestion Piscine</small></div>
          <div class="meta">Généré le ${new Date().toLocaleString('fr-FR')}</div>
        </div>
        <h2>${title}</h2>
        <div class="cards">
          <div class="card"><span>Entrées</span><b>${periodTotals.entries}</b></div>
          <div class="card"><span>Personnes</span><b>${periodTotals.people}</b></div>
          <div class="card"><span>Recettes</span><b>${fmt(periodTotals.revenue)} F CFA</b></div>
        </div>
        <table>
          <thead><tr><th>${reportPeriod === 'daily' ? 'Jour' : 'Mois'}</th><th>Entrées</th><th>Personnes</th><th>Recettes</th></tr></thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="4" style="text-align:center;color:#94a3b8">Aucune entrée sur la période</td></tr>'}
            <tr class="tot"><td>TOTAL</td><td style="text-align:center">${periodTotals.entries}</td><td style="text-align:center">${periodTotals.people}</td><td style="text-align:right">${fmt(periodTotals.revenue)} F CFA</td></tr>
          </tbody>
        </table>
        <div class="foot">X-Shop — Module Piscine · Rapport ${reportPeriod === 'daily' ? 'journalier' : 'mensuel'}</div>
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

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
      const sale = await onSale([item], { customerName: customerName.trim() || null });
      setFlash({ type: 'ok', msg: `Entrée enregistrée : ${qty} personne(s) — ${fmt(price * qty)} F CFA.` });
      setPersons(1);
      setCustomerName('');
      if (sale) setTicket(sale); // ouvre l'impression du ticket
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
                    <button className="p-print" title="Imprimer le ticket" onClick={() => setTicket(s)}>
                      <Printer size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rapports & Export */}
      <div className="card-premium piscine-report">
        <div className="report-head">
          <h3 className="p-card-title"><FileText size={20} /> Rapport & Export</h3>
          <div className="report-actions">
            <div className="period-toggle">
              <button className={reportPeriod === 'daily' ? 'active' : ''} onClick={() => setReportPeriod('daily')}>Journalier</button>
              <button className={reportPeriod === 'monthly' ? 'active' : ''} onClick={() => setReportPeriod('monthly')}>Mensuel</button>
            </div>
            <button className="rep-btn" onClick={printReport}><Printer size={16} /> Imprimer</button>
            <button className="rep-btn" onClick={exportCSV}><Download size={16} /> Exporter CSV</button>
          </div>
        </div>

        <div className="report-totals">
          <div><span>Entrées</span><strong>{periodTotals.entries}</strong></div>
          <div><span>Personnes</span><strong>{periodTotals.people}</strong></div>
          <div><span>Recettes</span><strong>{fmt(periodTotals.revenue)} F CFA</strong></div>
        </div>

        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>{reportPeriod === 'daily' ? 'Jour' : 'Mois'}</th>
                <th className="c">Entrées</th>
                <th className="c">Personnes</th>
                <th className="r">Recettes</th>
              </tr>
            </thead>
            <tbody>
              {periodRows.map((r, i) => (
                <tr key={i} className={r.entries === 0 ? 'muted' : ''}>
                  <td>{r.label}</td>
                  <td className="c">{r.entries}</td>
                  <td className="c">{r.people}</td>
                  <td className="r">{fmt(r.revenue)} F CFA</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>TOTAL</td>
                <td className="c">{periodTotals.entries}</td>
                <td className="c">{periodTotals.people}</td>
                <td className="r">{fmt(periodTotals.revenue)} F CFA</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {ticket && <Receipt sale={ticket} onClose={() => setTicket(null)} />}

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
        .p-print { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--primary-light); color: var(--primary); flex-shrink: 0; }
        .p-print:hover { background: var(--primary); color: #fff; }

        /* Rapport & Export */
        .piscine-report { padding: 24px 28px; }
        .report-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; }
        .report-head .p-card-title { margin-bottom: 0; }
        .report-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .period-toggle { display: flex; background: var(--bg-main); padding: 4px; border-radius: 12px; gap: 4px; }
        .period-toggle button { padding: 8px 16px; border-radius: 9px; font-weight: 700; font-size: 0.85rem; color: var(--text-muted); }
        .period-toggle button.active { background: #fff; color: var(--primary); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .rep-btn { display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px; border-radius: 12px; font-weight: 700; font-size: 0.85rem; background: var(--primary-light); color: var(--primary); }
        .rep-btn:hover { background: var(--primary); color: #fff; }

        .report-totals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
        .report-totals > div { background: var(--bg-main); border-radius: 14px; padding: 14px 16px; }
        .report-totals span { font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.4px; }
        .report-totals strong { display: block; font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin-top: 4px; }

        .report-table-wrap { overflow-x: auto; }
        .report-table { width: 100%; border-collapse: collapse; }
        .report-table th { text-align: left; font-size: 0.72rem; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 800; padding: 10px 12px; border-bottom: 2px solid var(--border); white-space: nowrap; }
        .report-table td { padding: 11px 12px; border-bottom: 1px solid var(--border); font-size: 0.9rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; }
        .report-table th.c, .report-table td.c { text-align: center; }
        .report-table th.r, .report-table td.r { text-align: right; }
        .report-table tr.muted td { color: var(--text-muted); font-weight: 500; }
        .report-table tr.total-row td { background: var(--primary-light); font-weight: 800; color: var(--primary); border-bottom: none; }

        @media (max-width: 1100px) {
          .piscine-grid { grid-template-columns: 1fr; }
          .piscine-stats { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .piscine-head h2 { font-size: 1.4rem; }
          .price-edit { flex-direction: column; }
          .btn-save-price { justify-content: center; }
          .report-head { flex-direction: column; align-items: stretch; }
          .report-actions { justify-content: space-between; }
          .rep-btn { flex: 1; justify-content: center; }
          .report-totals { grid-template-columns: 1fr; }
        }
      `}} />
    </div>
  );
};

export default PiscineView;
