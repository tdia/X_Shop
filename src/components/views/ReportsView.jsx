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
  Filter,
  ArrowRight,
  Banknote,
  X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const ReportsView = ({ sales, products, updateSale }) => {
  const [reportRange, setReportRange] = useState('current_month'); // today, yesterday, current_month, last_month, current_year, last_year, custom
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [reportType, setReportType] = useState('daily'); // daily, monthly

  const printRef = useRef();

  const getDateRange = (range) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    switch (range) {
      case 'today':
        return { start: today, end: now };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayEnd = new Date(today);
        yesterdayEnd.setMilliseconds(-1);
        return { start: yesterday, end: yesterdayEnd };
      case 'current_month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: startOfMonth, end: now };
      case 'last_month':
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        return { start: startOfLastMonth, end: endOfLastMonth };
      case 'current_year':
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        return { start: startOfYear, end: now };
      case 'last_year':
        const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
        const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        return { start: startOfLastYear, end: endOfLastYear };
      case 'custom':
        if (customStart && customEnd) {
          return { start: new Date(customStart), end: new Date(customEnd + 'T23:59:59') };
        }
        return { start: null, end: null };
      default:
        return { start: null, end: null };
    }
  };

  const [paymentFilter, setPaymentFilter] = useState('all'); // all, paid, partial, pending
  const [updatingSale, setUpdatingSale] = useState(null);
  const [newInstallment, setNewInstallment] = useState('');

  const filteredSales = useMemo(() => {
    const { start, end } = getDateRange(reportRange);
    return sales.filter(s => {
      const sDate = new Date(s.timestamp);
      const matchesDate = !start || !end || (sDate >= start && sDate <= end);
      const matchesPayment = paymentFilter === 'all' || s.paymentStatus === paymentFilter;
      return matchesDate && matchesPayment;
    });
  }, [sales, reportRange, customStart, customEnd, paymentFilter]);

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!updatingSale || !newInstallment) return;

    const addedAmount = parseFloat(newInstallment);
    const updatedPaid = (updatingSale.paidAmount || 0) + addedAmount;
    const newStatus = updatedPaid >= updatingSale.total ? 'paid' : 'partial';

    await updateSale(updatingSale.id, {
      paidAmount: updatedPaid,
      paymentStatus: newStatus
    });

    setUpdatingSale(null);
    setNewInstallment('');
  };

  const chartData = useMemo(() => {
    if (reportType === 'daily') {
      // Group by day string YYYY-MM-DD
      const groups = filteredSales.reduce((acc, sale) => {
        const dateStr = sale.timestamp.split('T')[0];
        if (!acc[dateStr]) acc[dateStr] = { total: 0, orders: 0 };
        acc[dateStr].total += sale.total;
        acc[dateStr].orders += 1;
        return acc;
      }, {});

      // Convert to array and sort by date
      const data = Object.keys(groups).sort().map(date => {
        const dateObj = new Date(date);
        return {
          name: dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          total: groups[date].total,
          orders: groups[date].orders,
          date: date
        };
      });

      return data;
    } else {
      // Group by month YYYY-MM
      const groups = filteredSales.reduce((acc, sale) => {
        const date = new Date(sale.timestamp);
        const monthStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!acc[monthStr]) acc[monthStr] = { total: 0, orders: 0 };
        acc[monthStr].total += sale.total;
        acc[monthStr].orders += 1;
        return acc;
      }, {});

      const monthsShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
      const data = Object.keys(groups).sort().map(monthStr => {
        const [year, month] = monthStr.split('-');
        return {
          name: `${monthsShort[parseInt(month) - 1]} ${year}`,
          total: groups[monthStr].total,
          orders: groups[monthStr].orders,
          month: monthStr
        };
      });
      return data;
    }
  }, [filteredSales, reportType]);

  const totalPeriodRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalPeriodPaid = filteredSales.reduce((acc, s) => acc + (s.paidAmount || s.total), 0);
  const totalPeriodOrders = filteredSales.length;

  const categoryData = useMemo(() => {
    const catMap = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        // Find category from products if not in item
        const cat = item.category || 'Inconnu';
        catMap[cat] = (catMap[cat] || 0) + (item.price * item.quantity);
      });
    });

    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return Object.keys(catMap).map((cat, i) => ({
      name: cat,
      value: catMap[cat],
      color: colors[i % colors.length]
    }));
  }, [filteredSales]);

  const handleExportPDF = () => {
    const printContent = printRef.current.innerHTML;
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
                        .report-range { color: #64748b; font-size: 14px; margin-top: 10px; }
                        
                        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
                        .stat-card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
                        .stat-card span { font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; }
                        .stat-card h3 { margin: 10px 0 0; font-size: 18px; color: #0f172a; }

                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #4f46e5; color: white; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
                        td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
                        tr:nth-child(even) { background: #f8fafc; }
                        .total-row { background: #f1f5f9 !important; font-weight: 800; }
                        .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                        .badge { padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 10px; }
                        .paid { background: #d1fae5; color: #059669; }
                        .partial { background: #fef3c7; color: #d97706; }
                        .pending { background: #fee2e2; color: #dc2626; }
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

  const rangeLabels = {
    today: "Aujourd'hui",
    yesterday: "Hier",
    current_month: "Mois en cours",
    last_month: "Mois passé",
    current_year: "Année en cours",
    last_year: "Année passée",
    custom: "Période personnalisée"
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
            <h2>Rapport d'Activité et Suivi des Impayés</h2>
            <div className="report-range">
              Période : {rangeLabels[reportRange]}
              {reportRange === 'custom' && ` (du ${new Date(customStart).toLocaleDateString()} au ${new Date(customEnd).toLocaleDateString()})`}
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span>Chiffre d'Affaires Global</span>
              <h3>{totalPeriodRevenue.toLocaleString()} F CFA</h3>
            </div>
            <div className="stat-card">
              <span>Total Encaissé</span>
              <h3>{totalPeriodPaid.toLocaleString()} F CFA</h3>
            </div>
            <div className="stat-card">
              <span>Reste à Recouvrer</span>
              <h3>{(totalPeriodRevenue - totalPeriodPaid).toLocaleString()} F CFA</h3>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>CLIENT / DATE</th>
                <th style={{ textAlign: 'right' }}>TOTAL</th>
                <th style={{ textAlign: 'right' }}>PAYÉ</th>
                <th style={{ textAlign: 'right' }}>RESTE</th>
                <th>STATUT</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((s, i) => (
                <tr key={i}>
                  <td>
                    <b>{s.customerName || 'Client Passager'}</b><br />
                    <small>{new Date(s.timestamp).toLocaleDateString()}</small>
                  </td>
                  <td style={{ textAlign: 'right' }}>{s.total.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(s.paidAmount || s.total).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>{(s.total - (s.paidAmount || s.total)).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${s.paymentStatus || 'paid'}`}>
                      {s.paymentStatus === 'paid' ? 'Payé' : s.paymentStatus === 'partial' ? 'Tranche' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="footer">
            <p>X-Shop - Document généré par le système de gestion</p>
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
            <h2>Analyse d'Activité</h2>
            <p>Visualisation des performances sur {rangeLabels[reportRange].toLowerCase()}</p>
          </div>
        </div>

        <div className="header-actions-complex">
          <div className="filter-group-premium">
            <div className="range-selector">
              <Calendar size={16} />
              <select
                value={reportRange}
                onChange={(e) => setReportRange(e.target.value)}
                className="premium-select"
              >
                <option value="today">Aujourd'hui</option>
                <option value="yesterday">Hier</option>
                <option value="current_month">Mois en cours</option>
                <option value="last_month">Mois passé</option>
                <option value="current_year">Année en cours</option>
                <option value="last_year">Année passée</option>
                <option value="custom">Personnalisé...</option>
              </select>
            </div>

            <div className="divider-minimal"></div>

            <div className="range-selector">
              <Filter size={16} />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="premium-select"
              >
                <option value="all">Tous les règlements</option>
                <option value="paid">Payés</option>
                <option value="partial">Tranches / Impayés</option>
                <option value="pending">En attente</option>
              </select>
            </div>

            <div className="divider-minimal"></div>

            <div className="view-toggle-p">
              <button
                className={reportType === 'daily' ? 'active' : ''}
                onClick={() => setReportType('daily')}
              >J</button>
              <button
                className={reportType === 'monthly' ? 'active' : ''}
                onClick={() => setReportType('monthly')}
              >M</button>
            </div>
          </div>

          <button className="btn-glow-alt" onClick={handleExportPDF}>
            <Download size={18} /> PDF
          </button>
        </div>
      </div>

      <AnimatePresence>
        {reportRange === 'custom' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="custom-range-panel card-premium"
          >
            <div className="date-input-group">
              <label>Début</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            </div>
            <ArrowRight size={20} className="range-arrow" />
            <div className="date-input-group">
              <label>Fin</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </div>
            <div className="custom-range-info">
              <Calendar size={18} />
              <span>Sélectionnez une période précise pour filtrer les résultats</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="reports-stats-row">
        <div className="card-premium rep-stat-card">
          <div className="rep-stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>
            <TrendingUp size={24} />
          </div>
          <div className="rep-stat-data">
            <span>Chiffre d'Affaires</span>
            <h3>{totalPeriodRevenue.toLocaleString()} F CFA</h3>
          </div>
        </div>
        <div className="card-premium rep-stat-card">
          <div className="rep-stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <BarChart3 size={24} />
          </div>
          <div className="rep-stat-data">
            <span>Part TVA (18%)</span>
            <h3>{Math.round(totalPeriodRevenue - (totalPeriodRevenue / 1.18)).toLocaleString()} F CFA</h3>
          </div>
        </div>
        <div className="card-premium rep-stat-card">
          <div className="rep-stat-icon" style={{ background: '#fff7ed', color: '#f59e0b' }}>
            <Activity size={24} />
          </div>
          <div className="rep-stat-data">
            <span>{totalPeriodOrders} Commandes</span>
            <h3 style={{ fontSize: '1rem' }}>Panier : {(totalPeriodOrders > 0 ? (totalPeriodRevenue / totalPeriodOrders) : 0).toLocaleString()} F</h3>
          </div>
        </div>
      </div>

      <div className="reports-main-grid">
        <div className="card-premium full-width-table">
          <div className="card-title-f">
            <h3><Activity size={20} /> Suivi des Ventes & Clients</h3>
            <span className="badge-count-p">{filteredSales.length} Transactions</span>
          </div>

          <div className="table-wrapper-p">
            <table className="pos-report-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>ID</th>
                  <th>CLIENT</th>
                  <th>TOTAL</th>
                  <th>PAYÉ</th>
                  <th>RESTE</th>
                  <th>STATUT</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.timestamp).toLocaleDateString()}</td>
                    <td>#{sale.id.toString().slice(-6)}</td>
                    <td>
                      <div className="client-cell">
                        <span className="name">{sale.customerName || 'Passager'}</span>
                        <span className="phone">{sale.customerPhone}</span>
                      </div>
                    </td>
                    <td className="font-bold">{sale.total.toLocaleString()} F</td>
                    <td className="text-success">{(sale.paidAmount || sale.total).toLocaleString()} F</td>
                    <td className={sale.total - (sale.paidAmount || sale.total) > 0 ? 'text-danger font-bold' : ''}>
                      {(sale.total - (sale.paidAmount || sale.total)).toLocaleString()} F
                    </td>
                    <td>
                      <span className={`status-pill ${sale.paymentStatus || 'paid'}`}>
                        {sale.paymentStatus === 'paid' ? 'Soldé' : sale.paymentStatus === 'partial' ? 'Partiel' : 'Attente'}
                      </span>
                    </td>
                    <td>
                      {sale.paymentStatus !== 'paid' && (
                        <button
                          className="btn-action-p"
                          onClick={() => setUpdatingSale(sale)}
                          title="Enregistrer un versement"
                        >
                          <Banknote size={16} /> Versement
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Versement */}
      <AnimatePresence>
        {updatingSale && (
          <div className="elite-modal-overlay">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="installment-modal card-premium"
            >
              <div className="modal-head-p">
                <h3>Nouveau Versement</h3>
                <button onClick={() => setUpdatingSale(null)}><X size={20} /></button>
              </div>
              <div className="modal-info-p">
                <p>Client : <b>{updatingSale.customerName || 'Passager'}</b></p>
                <p>Reste à payer : <b className="text-danger">{(updatingSale.total - (updatingSale.paidAmount || updatingSale.total)).toLocaleString()} F CFA</b></p>
              </div>
              <form onSubmit={handleUpdatePayment} className="installment-form">
                <div className="input-group-p">
                  <label>Montant du versement</label>
                  <input
                    type="number"
                    autoFocus
                    value={newInstallment}
                    onChange={(e) => setNewInstallment(e.target.value)}
                    placeholder="Entrez le montant..."
                    max={updatingSale.total - (updatingSale.paidAmount || updatingSale.total)}
                    required
                  />
                </div>
                <button type="submit" className="btn-confirm-elite w-full">
                  Valider le paiement
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="reports-main-grid">
        <div className="card-premium chart-lrg">
          <div className="card-title-f">
            <h3><LineIcon size={20} /> Évolution des Recettes (Encaissé)</h3>
            <div className="period-badge">{reportType === 'daily' ? 'Journalier' : 'Mensuel'}</div>
          </div>
          <div className="chart-box-rep">
            {chartData.length > 0 ? (
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
            ) : (
              <div className="empty-chart-state">
                <Calendar size={48} />
                <p>Aucune donnée pour cette période</p>
              </div>
            )}
          </div>
        </div>

        <div className="card-premium chart-sml">
          <div className="card-title-f">
            <h3><PieIcon size={20} /> Ventes par Catégorie</h3>
          </div>
          <div className="chart-box-rep">
            {categoryData.length > 0 ? (
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
                  <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-state">
                <PieIcon size={48} />
                <p>Répartition indisponible</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
                .reports-view-clean { display: flex; flex-direction: column; gap: 32px; padding-bottom: 40px; }
                
                .reports-header-light { display: flex; justify-content: space-between; align-items: center; }
                .header-info-wrap { display: flex; align-items: center; gap: 20px; }
                .report-icon-box { width: 56px; height: 56px; background: white; border: 1px solid var(--border); border-radius: 18px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm); }
                .header-info-wrap h2 { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); letter-spacing: -1px; }
                .header-info-wrap p { color: var(--text-muted); font-weight: 600; font-size: 0.95rem; }

                .header-actions-complex { display: flex; align-items: center; gap: 16px; }
                .filter-group-premium { display: flex; align-items: center; background: white; padding: 6px 12px; border-radius: 16px; border: 1px solid var(--border); gap: 12px; }
                
                .range-selector { display: flex; align-items: center; gap: 8px; color: var(--text-muted); }
                .premium-select { border: none; outline: none; background: transparent; font-weight: 700; color: var(--text-primary); cursor: pointer; padding-right: 10px; }
                
                .divider-minimal { width: 1px; height: 24px; background: var(--border); }
                
                .view-toggle-p { display: flex; background: var(--bg-main); padding: 4px; border-radius: 10px; gap: 4px; }
                .view-toggle-p button { width: 32px; height: 32px; border-radius: 8px; font-weight: 800; font-size: 0.75rem; color: var(--text-muted); }
                .view-toggle-p button.active { background: white; color: var(--primary); box-shadow: var(--shadow-sm); }
                
                .btn-glow-alt { display: flex; align-items: center; gap: 10px; padding: 12px 24px; background: var(--grad-primary); color: white; border-radius: 14px; font-weight: 800; box-shadow: 0 8px 20px var(--primary-glow); }

                .custom-range-panel { display: flex; align-items: center; gap: 24px; padding: 20px 32px; background: #eeeffe; border: 1px solid var(--primary-light); }
                .date-input-group { display: flex; flex-direction: column; gap: 6px; }
                .date-input-group label { font-size: 0.75rem; font-weight: 800; color: var(--primary); text-transform: uppercase; }
                .date-input-group input { border: 1px solid var(--border); padding: 8px 12px; border-radius: 10px; font-weight: 600; outline: none; }
                .range-arrow { color: var(--primary); opacity: 0.5; margin-top: 15px; }
                .custom-range-info { display: flex; items-center: center; gap: 10px; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; margin-left: auto; }

                .reports-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
                .rep-stat-card { display: flex; align-items: center; gap: 20px; padding: 24px 32px; }
                .rep-stat-icon { width: 50px; height: 50px; border-radius: 15px; display: flex; align-items: center; justify-content: center; }
                .rep-stat-data span { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
                .rep-stat-data h3 { font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-top: 4px; }

                .reports-main-grid { display: grid; grid-template-columns: 1.8fr 1fr; gap: 24px; }
                .full-width-table { grid-column: span 2; padding: 32px; }
                
                .card-title-f { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
                .card-title-f h3 { display: flex; align-items: center; gap: 12px; font-size: 1.25rem; font-weight: 800; color: var(--text-primary); }
                .badge-count-p { background: var(--bg-main); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); }
                
                .table-wrapper-p { overflow-x: auto; }
                .pos-report-table { width: 100%; border-collapse: collapse; }
                .pos-report-table th { text-align: left; padding: 16px; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; border-bottom: 2px solid var(--bg-main); }
                .pos-report-table td { padding: 16px; border-bottom: 1px solid var(--bg-main); font-size: 0.9rem; vertical-align: middle; }
                
                .client-cell { display: flex; flex-direction: column; }
                .client-cell .name { font-weight: 700; color: var(--text-primary); }
                .client-cell .phone { font-size: 0.75rem; color: var(--text-muted); }
                
                .status-pill { padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; }
                .status-pill.paid { background: #d1fae5; color: #059669; }
                .status-pill.partial { background: #fef3c7; color: #d97706; }
                .status-pill.pending { background: #fee2e2; color: #dc2626; }
                
                .btn-action-p { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: white; border: 1px solid var(--border); border-radius: 10px; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); }
                .btn-action-p:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
                
                .installment-modal { width: 100%; max-width: 400px; padding: 32px; background: white; z-index: 2600; }
                .modal-head-p { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .modal-head-p h3 { font-size: 1.25rem; font-weight: 800; }
                .modal-info-p { background: var(--bg-main); padding: 16px; border-radius: 16px; margin-bottom: 24px; font-size: 0.9rem; }
                .input-group-p { margin-bottom: 24px; }
                .input-group-p label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; }
                .input-group-p input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border); font-size: 1rem; font-weight: 700; }

                .font-bold { font-weight: 800; }
                .text-success { color: #059669; }
                .text-danger { color: #dc2626; }
                .w-full { width: 100%; }

                .period-badge { background: var(--primary-light); color: var(--primary); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
                .chart-box-rep { min-height: 380px; display: flex; align-items: center; justify-content: center; }
                
                .empty-chart-state { display: flex; flex-direction: column; align-items: center; gap: 16px; color: var(--text-muted); opacity: 0.5; }
                .empty-chart-state p { font-weight: 700; }

                @media (max-width: 1100px) {
                    .reports-main-grid { grid-template-columns: 1fr; }
                    .reports-stats-row { grid-template-columns: 1fr; }
                    .header-actions-complex { flex-direction: column; align-items: stretch; }
                    .custom-range-panel { flex-direction: column; align-items: stretch; }
                }
            `}} />
    </div>
  );
};

export default ReportsView;
