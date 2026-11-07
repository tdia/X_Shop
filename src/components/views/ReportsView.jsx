import React, { useState, useMemo, useRef } from 'react';
import {
  Download,
  Calendar,
  ChevronDown,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  TrendingUp,
  FileText,
  Activity,
  Printer,
  MapPin,
  Phone,
  Globe,
  ShoppingBag,
  Pencil,
  X,
  Save,
  Search
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';

const PAYMENT_LABELS = {
  paid: 'Payé',
  partial: 'Partiel',
  unpaid: 'Impayé'
};

const ReportsView = ({ sales, updateSale, canEdit = false }) => {
  const [reportType, setReportType] = useState('daily');
  const printRef = useRef();
  const [search, setSearch] = useState('');
  const [editingSale, setEditingSale] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const fmt = (n) => (Number(n) || 0).toLocaleString();
  const saleItemsCount = (s) => (s.items || []).reduce((a, it) => a + (it.quantity || 0), 0);
  const saleItemsLabel = (s) => (s.items || []).map(it => `${it.name} ×${it.quantity}`).join(', ');

  const sortedSales = useMemo(() => {
    const list = [...(sales || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(s =>
      String(s.id).includes(q) ||
      (s.customerName || '').toLowerCase().includes(q) ||
      saleItemsLabel(s).toLowerCase().includes(q)
    );
  }, [sales, search]);

  const openEdit = (sale) => {
    setEditingSale(sale);
    setForm({
      total: sale.total || 0,
      paidAmount: sale.paidAmount != null ? sale.paidAmount : (sale.total || 0),
      paymentStatus: sale.paymentStatus || 'paid',
      customerName: sale.customerName || '',
      customerPhone: sale.customerPhone || ''
    });
  };

  const closeEdit = () => {
    setEditingSale(null);
    setForm(null);
  };

  const saveEdit = async () => {
    if (!editingSale || !form) return;
    setSaving(true);
    try {
      await updateSale(editingSale.id, {
        total: parseFloat(form.total) || 0,
        paidAmount: parseFloat(form.paidAmount) || 0,
        paymentStatus: form.paymentStatus,
        customerName: form.customerName.trim() || null,
        customerPhone: form.customerPhone.trim() || null
      });
      closeEdit();
    } catch (e) {
      alert('Erreur lors de la modification de la vente');
    } finally {
      setSaving(false);
    }
  };

  const chartData = useMemo(() => {
    if (reportType === 'daily') {
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = days[date.getDay()];

        const daySales = sales.filter(s => s.timestamp.startsWith(dateStr));
        const total = daySales.reduce((acc, s) => acc + s.total, 0);

        data.push({ name: dayName, total, orders: daySales.length, date: dateStr });
      }
      return data;
    } else {
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = months[date.getMonth()];

        const monthSales = sales.filter(s => {
          const sDate = new Date(s.timestamp);
          return sDate.getMonth() === date.getMonth() && sDate.getFullYear() === date.getFullYear();
        });

        const total = monthSales.reduce((acc, s) => acc + s.total, 0);
        data.push({ name: monthName, total, orders: monthSales.length });
      }
      return data;
    }
  }, [sales, reportType]);

  const totalPeriodRevenue = chartData.reduce((acc, d) => acc + d.total, 0);
  const totalPeriodOrders = chartData.reduce((acc, d) => acc + d.orders, 0);

  const categoryData = [
    { name: 'Salon', value: 450, color: '#4f46e5' },
    { name: 'Chambre', value: 300, color: '#10b981' },
    { name: 'Bureau', value: 250, color: '#f59e0b' },
    { name: 'Salle à manger', value: 150, color: '#ef4444' },
  ];

  const handleExportPDF = () => {
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;

    // Use a more robust print approach by creating a hidden iframe or temporary window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
            <html>
                <head>
                    <title>Rapport d'Activité - X-Shop</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
                        .company-info h1 { margin: 0; color: #4f46e5; font-size: 24px; }
                        .company-info p { margin: 4px 0; color: #64748b; font-size: 14px; }
                        .report-title { text-align: center; margin-bottom: 40px; }
                        .report-title h2 { text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #e2e8f0; display: inline-block; padding-bottom: 5px; }
                        
                        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
                        .stat-card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
                        .stat-card span { font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; }
                        .stat-card h3 { margin: 10px 0 0; font-size: 20px; color: #0f172a; }

                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #4f46e5; color: white; padding: 12px; text-align: left; font-size: 12px; }
                        td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
                        tr:nth-child(even) { background: #f8fafc; }
                        .total-row { background: #f1f5f9 !important; font-weight: bold; }
                        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="reports-view-clean animate-fade-in">
      {/* Template Caché pour l'impression */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <div className="header">
            <div className="company-info">
              <h1>X-SHOP MANAGER</h1>
              <p>Solution de Gestion Intégrée</p>
              <p>123 Avenue du Design, Dakar, Sénégal</p>
              <p>+221 33 800 00 00 | contact@x-shop.sn</p>
            </div>
            <div className="print-date">
              <p>Généré le: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="report-title">
            <h2>{reportType === 'daily' ? "Rapport de Ventes Journalier" : "Rapport de Ventes Mensuel"}</h2>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span>Chiffre d'Affaires (TTC)</span>
              <h3>{totalPeriodRevenue.toLocaleString()} F CFA</h3>
            </div>
            <div className="stat-card">
              <span>Part TVA (18%)</span>
              <h3>{Math.round(totalPeriodRevenue - (totalPeriodRevenue / 1.18)).toLocaleString()} F CFA</h3>
            </div>
            <div className="stat-card">
              <span>Volume de Ventes</span>
              <h3>{totalPeriodOrders} Commandes</h3>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>PÉRIODE</th>
                <th>NBRE VENTES</th>
                <th>TOTAL TTC</th>
                <th>DONT TVA (18%)</th>
                <th>NET HT</th>
              </tr>
            </thead>
            <tbody>
              {chartData.filter(d => d.total > 0).map((d, i) => (
                <tr key={i}>
                  <td>{reportType === 'daily' ? (d.date || d.name) : d.name}</td>
                  <td>{d.orders}</td>
                  <td>{d.total.toLocaleString()} F CFA</td>
                  <td>{Math.round(d.total - (d.total / 1.18)).toLocaleString()} F CFA</td>
                  <td>{Math.round(d.total / 1.18).toLocaleString()} F CFA</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>TOTAL PÉRIODE</td>
                <td>{totalPeriodOrders}</td>
                <td>{totalPeriodRevenue.toLocaleString()} F CFA</td>
                <td>{Math.round(totalPeriodRevenue - (totalPeriodRevenue / 1.18)).toLocaleString()} F CFA</td>
                <td>{Math.round(totalPeriodRevenue / 1.18).toLocaleString()} F CFA</td>
              </tr>
            </tbody>
          </table>

          <div className="footer">
            <p>X-Shop - Le partenaire de votre croissance numérique</p>
            <p>© 2026 Tous droits réservés</p>
          </div>
        </div>
      </div>

      <div className="reports-header-light">
        <div className="header-info-wrap">
          <div className="report-icon-box">
            <FileText size={24} color="var(--primary)" />
          </div>
          <div>
            <h2>{reportType === 'daily' ? 'Rapport Journalier' : 'Rapport Mensuel'}</h2>
            <p>Analyse consolidée des {reportType === 'daily' ? '7 derniers jours' : '6 derniers mois'}</p>
          </div>
        </div>

        <div className="header-actions-pill">
          <div className="type-toggle">
            <button
              className={reportType === 'daily' ? 'active' : ''}
              onClick={() => setReportType('daily')}
            >
              Journalier
            </button>
            <button
              className={reportType === 'monthly' ? 'active' : ''}
              onClick={() => setReportType('monthly')}
            >
              Mensuel
            </button>
          </div>
          <div className="divider-v"></div>
          <button className="btn-utility" onClick={handleExportPDF}>
            <Download size={18} /> Télécharger PDF
          </button>
        </div>
      </div>

      <div className="reports-stats-row">
        <div className="card-premium rep-stat-card">
          <div className="rep-stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>
            <TrendingUp size={24} />
          </div>
          <div className="rep-stat-data">
            <span>Total Revenus</span>
            <h3>{totalPeriodRevenue.toLocaleString()} F CFA</h3>
          </div>
        </div>
        <div className="card-premium rep-stat-card">
          <div className="rep-stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <BarChart3 size={24} />
          </div>
          <div className="rep-stat-data">
            <span>Total Commandes</span>
            <h3>{totalPeriodOrders}</h3>
          </div>
        </div>
        <div className="card-premium rep-stat-card">
          <div className="rep-stat-icon" style={{ background: '#fff7ed', color: '#f59e0b' }}>
            <Activity size={24} />
          </div>
          <div className="rep-stat-data">
            <span>Panier Moyen</span>
            <h3>{totalPeriodOrders > 0 ? (totalPeriodRevenue / totalPeriodOrders).toLocaleString() : 0} FCFA</h3>
          </div>
        </div>
      </div>

      <div className="reports-main-grid">
        <div className="card-premium chart-lrg">
          <div className="card-title-f">
            <h3><LineIcon size={20} /> Évolution des Ventes</h3>
            <div className="period-badge">{reportType === 'daily' ? '7 jours' : '6 mois'}</div>
          </div>
          <div className="chart-box-rep">
            <ResponsiveContainer width="100%" height={380}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="repGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => `${value.toLocaleString()} FCFA`}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
                />
                <Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#repGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-premium chart-sml">
          <div className="card-title-f">
            <h3><PieIcon size={20} /> Ventes par Catégorie</h3>
          </div>
          <div className="chart-box-rep">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Liste des ventes */}
      <div className="card-premium sales-list-card">
        <div className="card-title-f sales-list-head">
          <h3><ShoppingBag size={20} /> Liste des ventes</h3>
          <div className="sales-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Rechercher (client, produit, n°)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {sortedSales.length === 0 ? (
          <div className="sales-empty">Aucune vente à afficher.</div>
        ) : (
          <div className="sales-table-wrap">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>DATE</th>
                  <th>CLIENT</th>
                  <th>ARTICLES</th>
                  <th>TOTAL</th>
                  <th>PAIEMENT</th>
                  {canEdit && <th>ACTIONS</th>}
                </tr>
              </thead>
              <tbody>
                {sortedSales.map((s) => (
                  <tr key={s.id}>
                    <td className="col-id">#{s.id}</td>
                    <td className="col-date">{new Date(s.timestamp).toLocaleString('fr-FR')}</td>
                    <td>{s.customerName || '—'}</td>
                    <td className="col-items" title={saleItemsLabel(s)}>
                      {saleItemsCount(s)} art. <span className="items-detail">{saleItemsLabel(s)}</span>
                    </td>
                    <td className="col-total">{fmt(s.total)} F CFA</td>
                    <td>
                      <span className={`pay-badge ${s.paymentStatus || 'paid'}`}>
                        {PAYMENT_LABELS[s.paymentStatus] || 'Payé'}
                      </span>
                    </td>
                    {canEdit && (
                      <td>
                        <button className="sale-edit-btn" onClick={() => openEdit(s)}>
                          <Pencil size={15} /> Modifier
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modale d'édition de vente */}
      {editingSale && form && (
        <div className="sale-modal-overlay" onClick={closeEdit}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="sale-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sale-modal-head">
              <h3>Modifier la vente #{editingSale.id}</h3>
              <button className="modal-close" onClick={closeEdit}><X size={20} /></button>
            </div>

            <div className="sale-modal-items">
              {(editingSale.items || []).length > 0
                ? saleItemsLabel(editingSale)
                : 'Aucun article détaillé'}
            </div>

            <div className="sale-form-grid">
              <label>
                <span>Total (F CFA)</span>
                <input type="number" value={form.total}
                  onChange={(e) => setForm({ ...form, total: e.target.value })} />
              </label>
              <label>
                <span>Montant payé (F CFA)</span>
                <input type="number" value={form.paidAmount}
                  onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} />
              </label>
              <label>
                <span>Statut de paiement</span>
                <select value={form.paymentStatus}
                  onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                  <option value="paid">Payé</option>
                  <option value="partial">Partiel</option>
                  <option value="unpaid">Impayé</option>
                </select>
              </label>
              <label>
                <span>Nom du client <em className="opt">(optionnel)</em></span>
                <input type="text" placeholder="Facultatif" value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
              </label>
              <label className="full">
                <span>Téléphone du client <em className="opt">(optionnel)</em></span>
                <input type="text" placeholder="Facultatif" value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
              </label>
            </div>

            <div className="sale-modal-actions">
              <button className="btn-cancel" onClick={closeEdit}>Annuler</button>
              <button className="btn-save" onClick={saveEdit} disabled={saving}>
                <Save size={16} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
                .reports-view-clean { display: flex; flex-direction: column; gap: 32px; padding-bottom: 40px; }
                
                .reports-header-light { display: flex; justify-content: space-between; align-items: center; }
                .header-info-wrap { display: flex; align-items: center; gap: 20px; }
                .report-icon-box { width: 56px; height: 56px; background: white; border: 1px solid var(--border); border-radius: 18px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm); }
                .header-info-wrap h2 { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); letter-spacing: -1px; }
                .header-info-wrap p { color: var(--text-muted); font-weight: 600; font-size: 0.95rem; }

                .header-actions-pill { display: flex; align-items: center; gap: 16px; background: white; padding: 6px; border-radius: 20px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
                .type-toggle { display: flex; background: var(--bg-main); padding: 4px; border-radius: 14px; gap: 4px; }
                .type-toggle button { padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; color: var(--text-muted); }
                .type-toggle button.active { background: white; color: var(--primary); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .divider-v { width: 1px; height: 30px; background: var(--border); }

                .reports-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
                .rep-stat-card { display: flex; align-items: center; gap: 20px; padding: 24px 32px; }
                .rep-stat-icon { width: 50px; height: 50px; border-radius: 15px; display: flex; align-items: center; justify-content: center; }
                .rep-stat-data span { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
                .rep-stat-data h3 { font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-top: 4px; }

                .reports-main-grid { display: grid; grid-template-columns: 1.8fr 1fr; gap: 24px; }
                .card-title-f { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
                .card-title-f h3 { display: flex; align-items: center; gap: 12px; font-size: 1.25rem; font-weight: 800; color: var(--text-primary); }
                .period-badge { background: var(--primary-light); color: var(--primary); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
                .chart-box-rep { min-height: 300px; }

                /* --- Liste des ventes --- */
                .sales-list-card { padding: 24px 28px; }
                .sales-list-head { margin-bottom: 20px; flex-wrap: wrap; gap: 16px; }
                .sales-search { display: flex; align-items: center; gap: 8px; background: var(--bg-main); border: 1px solid var(--border); border-radius: 12px; padding: 8px 14px; color: var(--text-muted); min-width: 260px; }
                .sales-search input { border: none; background: transparent; outline: none; font-size: 0.9rem; font-weight: 600; color: var(--text-primary); width: 100%; }
                .sales-empty { padding: 40px; text-align: center; color: var(--text-muted); font-weight: 600; }

                .sales-table-wrap { overflow-x: auto; }
                .sales-table { width: 100%; border-collapse: collapse; }
                .sales-table th { text-align: left; font-size: 0.72rem; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 800; padding: 12px 14px; border-bottom: 2px solid var(--border); white-space: nowrap; }
                .sales-table td { padding: 14px 14px; border-bottom: 1px solid var(--border); font-size: 0.9rem; font-weight: 600; color: var(--text-primary); vertical-align: middle; }
                .sales-table tr:hover td { background: var(--bg-main); }
                .col-id { font-weight: 800; color: var(--primary); }
                .col-date { white-space: nowrap; color: var(--text-secondary); }
                .col-total { font-weight: 800; white-space: nowrap; }
                .col-items { max-width: 260px; }
                .items-detail { display: block; font-size: 0.78rem; color: var(--text-muted); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px; }

                .pay-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; white-space: nowrap; }
                .pay-badge.paid { background: #ecfdf5; color: #059669; }
                .pay-badge.partial { background: #fff7ed; color: #d97706; }
                .pay-badge.unpaid { background: #fef2f2; color: #dc2626; }

                .sale-edit-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 10px; font-size: 0.82rem; font-weight: 700; background: var(--primary-light); color: var(--primary); white-space: nowrap; }
                .sale-edit-btn:hover { background: var(--primary); color: #fff; }

                /* --- Modale d'édition --- */
                .sale-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
                .sale-modal { background: var(--bg-card, #fff); width: 100%; max-width: 520px; border-radius: 22px; padding: 28px; box-shadow: 0 25px 60px rgba(0,0,0,0.25); max-height: 90vh; overflow-y: auto; }
                .sale-modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .sale-modal-head h3 { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); }
                .modal-close { width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--bg-main); color: var(--text-muted); }
                .modal-close:hover { background: #fef2f2; color: #dc2626; }
                .sale-modal-items { background: var(--bg-main); border-radius: 14px; padding: 12px 16px; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 20px; }

                .sale-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .sale-form-grid label { display: flex; flex-direction: column; gap: 6px; }
                .sale-form-grid label.full { grid-column: 1 / -1; }
                .sale-form-grid span { font-size: 0.78rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.4px; }
                .sale-form-grid .opt { font-style: normal; font-weight: 600; text-transform: none; color: var(--text-muted); opacity: 0.75; }
                .sale-form-grid input, .sale-form-grid select { padding: 11px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-main); font-size: 0.92rem; font-weight: 600; color: var(--text-primary); outline: none; }
                .sale-form-grid input:focus, .sale-form-grid select:focus { border-color: var(--primary); }

                .sale-modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
                .btn-cancel { padding: 11px 22px; border-radius: 12px; font-weight: 700; color: var(--text-secondary); background: var(--bg-main); border: 1px solid var(--border); }
                .btn-save { display: inline-flex; align-items: center; gap: 8px; padding: 11px 22px; border-radius: 12px; font-weight: 700; color: #fff; background: var(--grad-primary, var(--primary)); border: none; }
                .btn-save:disabled { opacity: 0.6; }

                @media (max-width: 1100px) {
                    .reports-main-grid { grid-template-columns: 1fr; }
                    .reports-stats-row { grid-template-columns: 1fr; }
                }

                @media (max-width: 768px) {
                    .reports-header-light { flex-direction: column; align-items: stretch; gap: 20px; }
                    .header-actions-pill { flex-direction: column; align-items: stretch; gap: 12px; padding: 12px; border-radius: 18px; }
                    .divider-v { display: none; }
                    .type-toggle { justify-content: center; }
                    .btn-utility { justify-content: center; display: flex; align-items: center; gap: 8px; }
                    .header-info-wrap h2 { font-size: 1.4rem; }
                    .rep-stat-card { padding: 20px 24px; }
                    .card-title-f { margin-bottom: 20px; }
                    .sale-form-grid { grid-template-columns: 1fr; }
                    .sales-search { min-width: 0; width: 100%; }
                    .items-detail { max-width: 160px; }
                    .sale-modal { padding: 22px; }
                }
            `}} />
    </div>
  );
};

export default ReportsView;
