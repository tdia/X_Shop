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
  ArrowRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const ReportsView = ({ sales, products }) => {
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

  const filteredSales = useMemo(() => {
    const { start, end } = getDateRange(reportRange);
    if (!start || !end) return sales;
    return sales.filter(s => {
      const sDate = new Date(s.timestamp);
      return sDate >= start && sDate <= end;
    });
  }, [sales, reportRange, customStart, customEnd]);

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

      // If range is today/yesterday, we might want hourly, but for now lets keep daily
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
            <h2>Rapport d'Activité Comparatif</h2>
            <div className="report-range">
              Période : {rangeLabels[reportRange]}
              {reportRange === 'custom' && ` (du ${new Date(customStart).toLocaleDateString()} au ${new Date(customEnd).toLocaleDateString()})`}
            </div>
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
              {chartData.map((d, i) => (
                <tr key={i}>
                  <td>{d.name}</td>
                  <td>{d.orders}</td>
                  <td>{d.total.toLocaleString()} F CFA</td>
                  <td>{Math.round(d.total - (d.total / 1.18)).toLocaleString()} F CFA</td>
                  <td>{Math.round(d.total / 1.18).toLocaleString()} F CFA</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>TOTAL GÉNÉRAL</td>
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
            <h2>Analyse d'Activité</h2>
            <p>Visualisation des performances sur {rangeLabels[reportRange].toLowerCase()}</p>
          </div>
        </div>

        <div className="header-actions-complex">
          <div className="filter-group-premium">
            <div className="range-selector">
              <Filter size={16} />
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
        <div className="card-premium chart-lrg">
          <div className="card-title-f">
            <h3><LineIcon size={20} /> Évolution des Ventes</h3>
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
                .card-title-f { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
                .card-title-f h3 { display: flex; align-items: center; gap: 12px; font-size: 1.25rem; font-weight: 800; color: var(--text-primary); }
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
