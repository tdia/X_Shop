import React, { useMemo, useState } from 'react';
import {
  BedDouble,
  Building2,
  Theater,
  Users,
  Wallet,
  DoorOpen,
  DoorClosed,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  CalendarDays,
  Phone,
  User,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

const TYPES = {
  appartement: { label: 'Appartement', unit: 'nuit', durLabel: 'nuits', icon: Building2 },
  salle: { label: "Salle d'activité", unit: 'jour', durLabel: 'jours', icon: Theater }
};

const fmt = (n) => (Number(n) || 0).toLocaleString();
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + (parseInt(days) || 0));
  return d.toISOString().slice(0, 10);
};
// Nombre de nuits/jours entre deux dates (min 1)
const daysBetween = (start, end) => {
  if (!start || !end) return 1;
  const ms = new Date(end) - new Date(start);
  const d = Math.round(ms / 86400000);
  return d >= 1 ? d : 1;
};

const HebergementView = ({
  units = [], rentals = [],
  addRental, checkoutRental,
  addUnit, updateUnit, deleteUnit,
  canManage = false
}) => {
  const [tab, setTab] = useState('appartement');
  const [flash, setFlash] = useState(null);
  const [renting, setRenting] = useState(null);     // unit being rented
  const [rentForm, setRentForm] = useState(null);
  const [editingUnit, setEditingUnit] = useState(null); // unit object or 'new'
  const [unitForm, setUnitForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const activeRentalFor = (unitId) => rentals.find(r => r.unitId === unitId && r.status === 'active');

  const unitsOfTab = useMemo(() => units.filter(u => u.type === tab), [units, tab]);

  const stats = useMemo(() => {
    const appts = units.filter(u => u.type === 'appartement');
    const salles = units.filter(u => u.type === 'salle');
    const activeRentals = rentals.filter(r => r.status === 'active');
    const revenue = rentals.reduce((a, r) => a + (r.total || 0), 0);
    return {
      apptLibres: appts.filter(u => u.status !== 'occupe').length,
      apptTotal: appts.length,
      salleLibres: salles.filter(u => u.status !== 'occupe').length,
      salleTotal: salles.length,
      active: activeRentals.length,
      revenue
    };
  }, [units, rentals]);

  // --- Location ---
  const openRent = (unit) => {
    setRenting(unit);
    setRentForm({
      startDate: today,
      endDate: addDays(today, 1),
      customerName: '',
      customerPhone: '',
      paymentStatus: 'paid'
    });
  };
  const rentDuration = rentForm ? daysBetween(rentForm.startDate, rentForm.endDate) : 1;
  const rentTotal = renting && rentForm ? (renting.price || 0) * rentDuration : 0;

  const confirmRent = async () => {
    if (!renting || !rentForm) return;
    if (!rentForm.customerName.trim()) {
      setFlash({ type: 'warn', msg: 'Le nom du client est requis pour une location.' });
      return;
    }
    if (new Date(rentForm.endDate) <= new Date(rentForm.startDate)) {
      setFlash({ type: 'warn', msg: 'La date de fin doit être après la date de début.' });
      return;
    }
    setBusy(true);
    try {
      const dur = daysBetween(rentForm.startDate, rentForm.endDate);
      await addRental({
        unitId: renting.id,
        unitName: renting.name,
        unitType: renting.type,
        unitPrice: renting.price,
        duration: dur,
        startDate: rentForm.startDate,
        endDate: rentForm.endDate,
        total: (renting.price || 0) * dur,
        customerName: rentForm.customerName.trim(),
        customerPhone: rentForm.customerPhone.trim() || null,
        paymentStatus: rentForm.paymentStatus
      });
      setFlash({ type: 'ok', msg: `${renting.name} loué à ${rentForm.customerName.trim()} — ${fmt((renting.price || 0) * dur)} F CFA.` });
      setRenting(null); setRentForm(null);
    } catch (e) {
      setFlash({ type: 'warn', msg: 'Erreur lors de la location.' });
    } finally { setBusy(false); }
  };

  const doCheckout = async (unit) => {
    const r = activeRentalFor(unit.id);
    if (!r) return;
    if (!window.confirm(`Libérer "${unit.name}" ? La location de ${r.customerName || 'ce client'} sera clôturée.`)) return;
    await checkoutRental(r.id);
    setFlash({ type: 'ok', msg: `${unit.name} est de nouveau libre.` });
  };

  // --- Gestion des unités ---
  const openUnit = (unit = null) => {
    setEditingUnit(unit || 'new');
    setUnitForm(unit
      ? { type: unit.type, name: unit.name, price: unit.price, capacity: unit.capacity, description: unit.description || '' }
      : { type: tab, name: '', price: '', capacity: '', description: '' });
  };
  const saveUnit = async () => {
    if (!unitForm.name.trim()) { setFlash({ type: 'warn', msg: 'Le nom est requis.' }); return; }
    setBusy(true);
    try {
      if (editingUnit === 'new') await addUnit(unitForm);
      else await updateUnit(editingUnit.id, unitForm);
      setEditingUnit(null); setUnitForm(null);
      setFlash({ type: 'ok', msg: 'Unité enregistrée.' });
    } catch (e) {
      setFlash({ type: 'warn', msg: "Erreur lors de l'enregistrement de l'unité." });
    } finally { setBusy(false); }
  };
  const removeUnit = async (unit) => {
    if (!window.confirm(`Supprimer "${unit.name}" ?`)) return;
    await deleteUnit(unit.id);
    setFlash({ type: 'ok', msg: 'Unité supprimée.' });
  };

  const TabIcon = TYPES[tab].icon;

  return (
    <div className="heberg-view animate-fade-in">
      <div className="heberg-head">
        <div className="heberg-icon"><BedDouble size={26} /></div>
        <div>
          <h2>Hébergement</h2>
          <p>Location des appartements et salles d'activité de l'hôtel</p>
        </div>
      </div>

      {flash && (
        <div className={`heberg-flash ${flash.type}`}>
          <CheckCircle2 size={18} /> <span>{flash.msg}</span>
        </div>
      )}

      {/* Stats */}
      <div className="heberg-stats">
        <div className="card-premium h-stat">
          <div className="h-stat-ic" style={{ background: '#eef2ff', color: '#4f46e5' }}><Building2 size={22} /></div>
          <div><span>Appartements libres</span><h3>{stats.apptLibres}/{stats.apptTotal}</h3></div>
        </div>
        <div className="card-premium h-stat">
          <div className="h-stat-ic" style={{ background: '#f5f3ff', color: '#8b5cf6' }}><Theater size={22} /></div>
          <div><span>Salles libres</span><h3>{stats.salleLibres}/{stats.salleTotal}</h3></div>
        </div>
        <div className="card-premium h-stat">
          <div className="h-stat-ic" style={{ background: '#fff7ed', color: '#f59e0b' }}><DoorClosed size={22} /></div>
          <div><span>Locations actives</span><h3>{stats.active}</h3></div>
        </div>
        <div className="card-premium h-stat">
          <div className="h-stat-ic" style={{ background: '#ecfdf5', color: '#10b981' }}><Wallet size={22} /></div>
          <div><span>Recettes locations</span><h3>{fmt(stats.revenue)} F CFA</h3></div>
        </div>
      </div>

      {/* Tabs + add */}
      <div className="heberg-toolbar">
        <div className="heberg-tabs">
          <button className={tab === 'appartement' ? 'active' : ''} onClick={() => setTab('appartement')}>
            <Building2 size={16} /> Appartements
          </button>
          <button className={tab === 'salle' ? 'active' : ''} onClick={() => setTab('salle')}>
            <Theater size={16} /> Salles d'activité
          </button>
        </div>
        {canManage && (
          <button className="btn-add-unit" onClick={() => openUnit()}>
            <Plus size={18} /> Ajouter {tab === 'appartement' ? 'un appartement' : 'une salle'}
          </button>
        )}
      </div>

      {/* Unit cards */}
      {unitsOfTab.length === 0 ? (
        <div className="card-premium h-empty"><TabIcon size={40} /><p>Aucune unité dans cette catégorie.</p></div>
      ) : (
        <div className="units-grid">
          {unitsOfTab.map(u => {
            const occupied = u.status === 'occupe';
            const rent = occupied ? activeRentalFor(u.id) : null;
            return (
              <motion.div key={u.id} whileHover={{ y: -3 }} className={`card-premium unit-card ${occupied ? 'occ' : ''}`}>
                <div className="unit-top">
                  <span className={`status-badge ${occupied ? 'occ' : 'free'}`}>
                    {occupied ? <DoorClosed size={13} /> : <DoorOpen size={13} />}
                    {occupied ? 'Occupé' : 'Libre'}
                  </span>
                  {canManage && (
                    <div className="unit-admin">
                      <button title="Modifier" onClick={() => openUnit(u)}><Pencil size={14} /></button>
                      <button title="Supprimer" className="del" onClick={() => removeUnit(u)}><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>

                <h3 className="unit-name">{u.name}</h3>
                {u.description && <p className="unit-desc">{u.description}</p>}

                <div className="unit-meta">
                  <span><Users size={14} /> {u.capacity} pers.</span>
                  <span className="unit-price">{fmt(u.price)} F CFA<small>/{TYPES[u.type]?.unit}</small></span>
                </div>

                {occupied ? (
                  <div className="unit-rented">
                    <div className="rented-who"><User size={13} /> {rent?.customerName || 'Client'}</div>
                    {rent && <div className="rented-dates"><CalendarDays size={13} /> {rent.startDate} → {rent.endDate} ({rent.duration} {TYPES[u.type]?.durLabel})</div>}
                    <button className="btn-checkout" onClick={() => doCheckout(u)}><LogOut size={15} /> Libérer</button>
                  </div>
                ) : (
                  <button className="btn-rent" onClick={() => openRent(u)}>
                    <DoorOpen size={16} /> Louer
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Locations actives */}
      <div className="card-premium rentals-card">
        <h3 className="h-card-title"><CalendarDays size={20} /> Locations en cours</h3>
        {rentals.filter(r => r.status === 'active').length === 0 ? (
          <div className="h-empty-sm">Aucune location en cours.</div>
        ) : (
          <div className="rentals-table-wrap">
            <table className="rentals-table">
              <thead>
                <tr><th>UNITÉ</th><th>CLIENT</th><th>PÉRIODE</th><th>DURÉE</th><th>TOTAL</th><th>PAIEMENT</th><th></th></tr>
              </thead>
              <tbody>
                {rentals.filter(r => r.status === 'active').map(r => (
                  <tr key={r.id}>
                    <td className="rt-unit">{r.unitName}</td>
                    <td>{r.customerName || '—'}{r.customerPhone ? <small> · {r.customerPhone}</small> : null}</td>
                    <td className="rt-dates">{r.startDate} → {r.endDate}</td>
                    <td>{r.duration} {TYPES[r.unitType]?.durLabel}</td>
                    <td className="rt-total">{fmt(r.total)} F CFA</td>
                    <td><span className={`pay-badge ${r.paymentStatus}`}>{r.paymentStatus === 'paid' ? 'Payé' : r.paymentStatus === 'partial' ? 'Partiel' : 'Impayé'}</span></td>
                    <td><button className="rt-checkout" onClick={() => checkoutRental(r.id)}>Libérer</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modale de location */}
      {renting && rentForm && (
        <div className="h-modal-overlay" onClick={() => { setRenting(null); setRentForm(null); }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-modal" onClick={e => e.stopPropagation()}>
            <div className="h-modal-head">
              <h3>Louer — {renting.name}</h3>
              <button className="h-close" onClick={() => { setRenting(null); setRentForm(null); }}><X size={20} /></button>
            </div>
            <div className="h-modal-sub">{fmt(renting.price)} F CFA / {TYPES[renting.type]?.unit} · {renting.capacity} pers.</div>

            <div className="h-form-grid">
              <label>
                <span>Nom du client *</span>
                <input type="text" value={rentForm.customerName} onChange={e => setRentForm({ ...rentForm, customerName: e.target.value })} />
              </label>
              <label>
                <span>Téléphone <em className="opt">(optionnel)</em></span>
                <input type="text" placeholder="Facultatif" value={rentForm.customerPhone} onChange={e => setRentForm({ ...rentForm, customerPhone: e.target.value })} />
              </label>
              <label>
                <span>Date de début</span>
                <input type="date" value={rentForm.startDate}
                  onChange={e => {
                    const start = e.target.value;
                    const end = (new Date(rentForm.endDate) <= new Date(start)) ? addDays(start, 1) : rentForm.endDate;
                    setRentForm({ ...rentForm, startDate: start, endDate: end });
                  }} />
              </label>
              <label>
                <span>Date de fin</span>
                <input type="date" value={rentForm.endDate} min={addDays(rentForm.startDate, 1)}
                  onChange={e => setRentForm({ ...rentForm, endDate: e.target.value })} />
              </label>
              <label className="full">
                <span>Statut de paiement</span>
                <select value={rentForm.paymentStatus} onChange={e => setRentForm({ ...rentForm, paymentStatus: e.target.value })}>
                  <option value="paid">Payé</option>
                  <option value="partial">Partiel</option>
                  <option value="unpaid">Impayé</option>
                </select>
              </label>
            </div>

            <div className="h-total">
              <span>Total ({rentDuration} {TYPES[renting.type]?.durLabel} · du {rentForm.startDate} au {rentForm.endDate})</span>
              <strong>{fmt(rentTotal)} F CFA</strong>
            </div>

            <div className="h-modal-actions">
              <button className="h-btn-cancel" onClick={() => { setRenting(null); setRentForm(null); }}>Annuler</button>
              <button className="h-btn-save" disabled={busy} onClick={confirmRent}><CheckCircle2 size={16} /> {busy ? '…' : 'Confirmer la location'}</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modale unité (ajout/édition) */}
      {editingUnit && unitForm && (
        <div className="h-modal-overlay" onClick={() => { setEditingUnit(null); setUnitForm(null); }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-modal" onClick={e => e.stopPropagation()}>
            <div className="h-modal-head">
              <h3>{editingUnit === 'new' ? 'Nouvelle unité' : 'Modifier l\'unité'}</h3>
              <button className="h-close" onClick={() => { setEditingUnit(null); setUnitForm(null); }}><X size={20} /></button>
            </div>
            <div className="h-form-grid">
              <label>
                <span>Type</span>
                <select value={unitForm.type} onChange={e => setUnitForm({ ...unitForm, type: e.target.value })}>
                  <option value="appartement">Appartement</option>
                  <option value="salle">Salle d'activité</option>
                </select>
              </label>
              <label>
                <span>Capacité (pers.)</span>
                <input type="number" min="0" value={unitForm.capacity} onChange={e => setUnitForm({ ...unitForm, capacity: e.target.value })} />
              </label>
              <label className="full">
                <span>Nom / Désignation</span>
                <input type="text" value={unitForm.name} onChange={e => setUnitForm({ ...unitForm, name: e.target.value })} />
              </label>
              <label>
                <span>Prix / {TYPES[unitForm.type]?.unit} (F CFA)</span>
                <input type="number" min="0" value={unitForm.price} onChange={e => setUnitForm({ ...unitForm, price: e.target.value })} />
              </label>
              <label className="full">
                <span>Description</span>
                <input type="text" value={unitForm.description} onChange={e => setUnitForm({ ...unitForm, description: e.target.value })} />
              </label>
            </div>
            <div className="h-modal-actions">
              <button className="h-btn-cancel" onClick={() => { setEditingUnit(null); setUnitForm(null); }}>Annuler</button>
              <button className="h-btn-save" disabled={busy} onClick={saveUnit}><CheckCircle2 size={16} /> {busy ? '…' : 'Enregistrer'}</button>
            </div>
          </motion.div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .heberg-view { display: flex; flex-direction: column; gap: 26px; padding-bottom: 40px; }
        .heberg-head { display: flex; align-items: center; gap: 18px; }
        .heberg-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; box-shadow: 0 10px 22px rgba(99,102,241,0.35); }
        .heberg-head h2 { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); letter-spacing: -1px; }
        .heberg-head p { color: var(--text-muted); font-weight: 600; font-size: 0.95rem; }

        .heberg-flash { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-radius: 16px; font-weight: 700; font-size: 0.9rem; }
        .heberg-flash.ok { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
        .heberg-flash.warn { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }

        .heberg-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
        .h-stat { display: flex; align-items: center; gap: 16px; padding: 20px 22px; }
        .h-stat-ic { width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .h-stat span { font-size: 0.74rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.4px; }
        .h-stat h3 { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-top: 3px; }

        .heberg-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .heberg-tabs { display: flex; background: var(--bg-main); padding: 5px; border-radius: 14px; gap: 4px; }
        .heberg-tabs button { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 0.88rem; color: var(--text-muted); }
        .heberg-tabs button.active { background: #fff; color: var(--primary); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .btn-add-unit { display: inline-flex; align-items: center; gap: 8px; padding: 11px 20px; border-radius: 14px; font-weight: 700; color: #fff; background: var(--grad-primary, var(--primary)); border: none; box-shadow: 0 8px 18px var(--primary-glow); }

        .units-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .unit-card { display: flex; flex-direction: column; gap: 10px; padding: 22px; }
        .unit-card.occ { background: linear-gradient(180deg, #fff, #fff7ed); }
        .unit-top { display: flex; align-items: center; justify-content: space-between; }
        .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 800; }
        .status-badge.free { background: #ecfdf5; color: #059669; }
        .status-badge.occ { background: #fef2f2; color: #dc2626; }
        .unit-admin { display: flex; gap: 6px; }
        .unit-admin button { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: var(--bg-main); color: var(--text-muted); }
        .unit-admin button:hover { background: var(--primary-light); color: var(--primary); }
        .unit-admin button.del:hover { background: #fef2f2; color: #dc2626; }

        .unit-name { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
        .unit-desc { font-size: 0.82rem; color: var(--text-muted); font-weight: 600; line-height: 1.4; }
        .unit-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; padding-top: 12px; border-top: 1px solid var(--border); }
        .unit-meta > span { display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); }
        .unit-price { color: var(--text-primary) !important; font-size: 1rem !important; font-weight: 800 !important; }
        .unit-price small { font-weight: 600; color: var(--text-muted); font-size: 0.75rem; }

        .btn-rent { margin-top: 8px; width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 14px; font-weight: 800; color: #fff; background: var(--grad-primary, var(--primary)); border: none; box-shadow: 0 8px 18px var(--primary-glow); }

        .unit-rented { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; background: var(--bg-main); border-radius: 14px; padding: 12px; }
        .rented-who { display: flex; align-items: center; gap: 7px; font-weight: 800; color: var(--text-primary); font-size: 0.9rem; }
        .rented-dates { display: flex; align-items: center; gap: 7px; font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }
        .btn-checkout { margin-top: 2px; width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 12px; font-weight: 700; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; }
        .btn-checkout:hover { background: #dc2626; color: #fff; }

        .h-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 50px; color: var(--text-muted); font-weight: 600; }
        .h-empty-sm { padding: 30px; text-align: center; color: var(--text-muted); font-weight: 600; }

        .rentals-card { padding: 24px 28px; }
        .h-card-title { display: flex; align-items: center; gap: 10px; font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 18px; }
        .rentals-table-wrap { overflow-x: auto; }
        .rentals-table { width: 100%; border-collapse: collapse; }
        .rentals-table th { text-align: left; font-size: 0.7rem; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 800; padding: 10px 12px; border-bottom: 2px solid var(--border); white-space: nowrap; }
        .rentals-table td { padding: 12px; border-bottom: 1px solid var(--border); font-size: 0.88rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; }
        .rt-unit { font-weight: 800; }
        .rt-dates { color: var(--text-secondary); }
        .rt-total { font-weight: 800; }
        .rentals-table small { color: var(--text-muted); font-weight: 600; }
        .pay-badge { padding: 4px 11px; border-radius: 20px; font-size: 0.72rem; font-weight: 800; }
        .pay-badge.paid { background: #ecfdf5; color: #059669; }
        .pay-badge.partial { background: #fff7ed; color: #d97706; }
        .pay-badge.unpaid { background: #fef2f2; color: #dc2626; }
        .rt-checkout { padding: 7px 14px; border-radius: 10px; font-weight: 700; font-size: 0.8rem; background: #fef2f2; color: #dc2626; }
        .rt-checkout:hover { background: #dc2626; color: #fff; }

        /* Modales */
        .h-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .h-modal { background: var(--bg-card, #fff); width: 100%; max-width: 540px; border-radius: 22px; padding: 28px; box-shadow: 0 25px 60px rgba(0,0,0,0.25); max-height: 92vh; overflow-y: auto; }
        .h-modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .h-modal-head h3 { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); }
        .h-close { width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--bg-main); color: var(--text-muted); }
        .h-close:hover { background: #fef2f2; color: #dc2626; }
        .h-modal-sub { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 20px; }

        .h-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .h-form-grid label { display: flex; flex-direction: column; gap: 6px; }
        .h-form-grid label.full { grid-column: 1 / -1; }
        .h-form-grid span { font-size: 0.76rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.4px; }
        .h-form-grid .opt { font-style: normal; font-weight: 600; text-transform: none; opacity: 0.7; }
        .h-form-grid input, .h-form-grid select { padding: 11px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-main); font-size: 0.92rem; font-weight: 600; color: var(--text-primary); outline: none; }
        .h-form-grid input:focus, .h-form-grid select:focus { border-color: var(--primary); }

        .h-total { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-radius: 16px; background: var(--bg-main); border: 1px dashed var(--border); margin-top: 18px; }
        .h-total span { font-weight: 700; color: var(--text-secondary); font-size: 0.85rem; }
        .h-total strong { font-size: 1.3rem; font-weight: 800; color: var(--primary); }

        .h-modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 22px; }
        .h-btn-cancel { padding: 11px 22px; border-radius: 12px; font-weight: 700; color: var(--text-secondary); background: var(--bg-main); border: 1px solid var(--border); }
        .h-btn-save { display: inline-flex; align-items: center; gap: 8px; padding: 11px 22px; border-radius: 12px; font-weight: 700; color: #fff; background: var(--grad-primary, var(--primary)); border: none; }
        .h-btn-save:disabled { opacity: 0.6; }

        @media (max-width: 1100px) {
          .heberg-stats { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .heberg-head h2 { font-size: 1.4rem; }
          .heberg-stats { grid-template-columns: 1fr; }
          .heberg-toolbar { flex-direction: column; align-items: stretch; }
          .btn-add-unit { justify-content: center; }
          .units-grid { grid-template-columns: 1fr; }
          .h-form-grid { grid-template-columns: 1fr; }
        }
      `}} />
    </div>
  );
};

export default HebergementView;
