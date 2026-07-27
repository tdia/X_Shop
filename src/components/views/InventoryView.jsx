import React, { useState, useRef } from 'react';
import {
  Search,
  Edit3,
  Plus,
  MoreVertical,
  ArrowUpDown,
  Download,
  Calendar,
  Trash2,
  X,
  Image as ImageIcon,
  DollarSign,
  Package,
  Layers,
  AlertTriangle,
  ChevronRight,
  Filter,
  CheckCircle2,
  Camera,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InventoryView = ({ products, updateStock, addProduct, updateProduct, deleteProduct, canEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Salon',
    price: '',
    stock: '',
    image: '🛋️',
    photo: null
  });

  const categories = ['Salon', 'Chambre', 'Bureau', 'Salle à manger', 'Déco', 'Autres'];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = dateFilter ? p.createdAt === dateFilter : true;
    return matchesSearch && matchesDate;
  });

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        image: product.image,
        photo: product.photo || null
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', category: 'Salon', price: '', stock: '', image: '🛋️', photo: null });
    }
    setShowModal(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) { // Limit to 1MB for localStorage safety
        alert("L'image est trop lourde. Veuillez choisir une image de moins de 1Mo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock)
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      addProduct(data);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      deleteProduct(id);
    }
  };

  return (
    <div className="elite-inventory animate-fade-in">
      {/* Header Section */}
      <div className="inventory-top-bar">
        <div className="search-box-premium">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un article, une référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-actions">
          <div className="date-picker-wrap">
            <Calendar size={18} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <button className="btn-secondary-elite">
            <Filter size={18} />
          </button>
          <button className="btn-secondary-elite">
            <Download size={18} />
          </button>
          {canEdit && (
            <button className="btn-primary-elite" onClick={() => handleOpenModal()}>
              <Plus size={20} />
              <span>Nouveau Article</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="inventory-card-wrapper card-premium">
        <div className="table-responsive">
          <table className="elite-table">
            <thead>
              <tr>
                <th>PRODUIT</th>
                <th>CATÉGORIE</th>
                <th>PRIX UNITAIRE</th>
                <th>DISPONIBILITÉ</th>
                <th>DATE D'AJOUT</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, idx) => {
                const isLowStock = product.stock > 0 && product.stock < 5;
                const isOut = product.stock <= 0;

                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <td>
                      <div className="product-info-cell">
                        <div className="p-avatar-wrap">
                          {product.photo ? (
                            <img src={product.photo} alt={product.name} className="p-avatar-img" />
                          ) : (
                            product.image
                          )}
                        </div>
                        <div className="p-text-wrap">
                          <span className="p-name">{product.name}</span>
                          <span className="p-sku">ID: #{product.id.toString().slice(-6)}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="cat-badge">{product.category}</span></td>
                    <td><span className="p-price-bold">{new Intl.NumberFormat('fr-FR').format(product.price)} F CFA</span></td>
                    <td>
                      <div className="stock-visual-wrap">
                        <div className="stock-text-line">
                          <span className={`stock-count ${isOut ? 'out' : isLowStock ? 'low' : ''}`}>
                            {product.stock} en stock
                          </span>
                          {isLowStock && <AlertTriangle size={14} className="warn-icon" />}
                        </div>
                        <div className="progress-bar-bg">
                          <div
                            className={`progress-bar-fill ${isOut ? 'out' : isLowStock ? 'low' : ''}`}
                            style={{ width: `${Math.min(100, (product.stock / 20) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td><span className="date-cell">{product.createdAt}</span></td>
                    <td>
                      <div className="actions-cell">
                        {canEdit ? (
                          <>
                            <button className="icon-btn edit" onClick={() => handleOpenModal(product)}><Edit3 size={16} /></button>
                            <button className="icon-btn delete" onClick={() => handleDelete(product.id)}><Trash2 size={16} /></button>
                          </>
                        ) : (
                          <div className="read-only-badge">Consultation</div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="empty-inventory-state">
              <Layers size={48} />
              <h3>Aucun article trouvé</h3>
              <p>Essayez de modifier vos filtres ou ajoutez un nouveau produit.</p>
            </div>
          )}
        </div>
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="elite-modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="elite-creation-card"
            >
              <div className="creation-header">
                <div className="header-left">
                  <div className="icon-box-p">
                    {editingProduct ? <Edit3 size={24} /> : <Plus size={24} />}
                  </div>
                  <div>
                    <h3>{editingProduct ? 'Édition de l\'article' : 'Nouvel Article'}</h3>
                    <p>Définissez les propriétés de votre article</p>
                  </div>
                </div>
                <button className="btn-close-elite" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="creation-form">
                <div className="form-sections-grid">
                  {/* Visual Preview */}
                  <div className="form-preview-section">
                    <div className="preview-card-elite">
                      <div className="preview-emoji">
                        {formData.photo ? (
                          <img src={formData.photo} alt="Preview" className="prev-img-elite" />
                        ) : (
                          formData.image || '🛋️'
                        )}
                        <button type="button" className="photo-upload-btn" onClick={() => fileInputRef.current.click()}>
                          <Camera size={18} />
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          accept="image/*"
                          onChange={handlePhotoUpload}
                        />
                      </div>
                      <div className="preview-info">
                        <span className="prev-cat">{formData.category || 'Catégorie'}</span>
                        <h4 className="prev-name">{formData.name || 'Nom de l\'article'}</h4>
                        <span className="prev-price">{formData.price ? new Intl.NumberFormat('fr-FR').format(formData.price) : '0'} F CFA</span>
                      </div>
                      <div className="preview-status">
                        <CheckCircle2 size={16} /> Aperçu en temps réel
                      </div>
                    </div>

                    <div className="emoji-input-wrap">
                      <label>Icône ou <span onClick={() => fileInputRef.current.click()} style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}>Uploader photo</span></label>
                      <input
                        type="text"
                        value={formData.image}
                        placeholder="📦"
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        maxLength="2"
                      />
                      <p className="hint">L'emoji est utilisé si aucune photo n'est uploadée</p>
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div className="form-inputs-section">
                    <div className="input-field-elite">
                      <label>Désignation complète</label>
                      <div className="input-icon-wrap">
                        <ImageIcon size={18} />
                        <input
                          type="text"
                          placeholder="ex: Canapé d'angle gris..."
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="input-row-elite">
                      <div className="input-field-elite">
                        <label>Catégorie</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="input-field-elite">
                        <label>Stock initial</label>
                        <div className="input-icon-wrap">
                          <Package size={18} />
                          <input
                            type="number"
                            placeholder="0"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="input-field-elite">
                      <label>Prix de vente (F CFA)</label>
                      <div className="input-icon-wrap price-mode">
                        <DollarSign size={18} />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="creation-footer">
                  <button type="button" className="btn-cancel-elite" onClick={() => setShowModal(false)}>Annuler</button>
                  <button type="submit" className="btn-confirm-elite">
                    {editingProduct ? 'Mettre à jour' : 'Enregistrer l\'article'}
                    <ChevronRight size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{
        __html: `
        .elite-inventory {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 50px;
        }

        .inventory-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .search-box-premium {
          flex: 1;
          display: flex;
          align-items: center;
          background: white;
          padding: 12px 24px;
          border-radius: 20px;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border);
          max-width: 500px;
        }

        .search-box-premium input {
          border: none;
          background: transparent;
          margin-left: 14px;
          font-weight: 600;
          font-size: 0.95rem;
          width: 100%;
          color: var(--text-primary);
        }

        .search-icon { color: var(--text-muted); }

        .filter-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .date-picker-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          padding: 10px 16px;
          border-radius: 16px;
          border: 1px solid var(--border);
          color: var(--text-secondary);
        }

        .date-picker-wrap input { border: none; font-weight: 700; font-size: 0.85rem; color: var(--text-primary); cursor: pointer; }

        .btn-secondary-elite {
          width: 44px;
          height: 44px;
          background: white;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .btn-primary-elite {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: var(--grad-primary);
          color: white;
          border-radius: 16px;
          font-weight: 800;
          box-shadow: 0 10px 20px var(--primary-glow);
        }

        .elite-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 8px;
        }

        .elite-table th {
          padding: 16px 24px;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .elite-table td {
          padding: 20px 24px;
          background: white;
          vertical-align: middle;
        }

        .elite-table tr td:first-child { border-radius: 20px 0 0 20px; }
        .elite-table tr td:last-child { border-radius: 0 20px 20px 0; }

        .product-info-cell { display: flex; align-items: center; gap: 16px; }
        .p-avatar-wrap {
          width: 48px;
          height: 48px;
          background: var(--bg-main);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          overflow: hidden;
        }
        .p-avatar-img { width: 100%; height: 100%; object-fit: cover; }

        .p-text-wrap { display: flex; flex-direction: column; }
        .p-name { font-weight: 800; color: var(--text-primary); }
        .p-sku { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }

        .cat-badge {
          padding: 6px 14px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: 10px;
          font-weight: 800;
          font-size: 0.75rem;
        }

        .p-price-bold { font-weight: 900; color: var(--text-primary); font-size: 1.1rem; }

        .stock-visual-wrap { width: 140px; }
        .stock-text-line { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .stock-count { font-size: 0.8rem; font-weight: 800; color: var(--success); }
        .stock-count.low { color: var(--warning); }
        .stock-count.out { color: var(--danger); }
        .warn-icon { color: var(--warning); }

        .progress-bar-bg { height: 6px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: var(--success); border-radius: 10px; }
        .progress-bar-fill.low { background: var(--warning); }
        .progress-bar-fill.out { background: var(--danger); width: 0% !important; }

        .date-cell { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }

        .actions-cell { display: flex; align-items: center; gap: 12px; justify-content: flex-end; }
        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-main);
          color: var(--text-secondary);
        }

        .icon-btn:hover { background: var(--primary); color: white; transform: translateY(-2px); }
        .icon-btn.delete:hover { background: var(--danger); color: white; }

        /* Modal Styles */
        .elite-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2500;
          padding: 20px;
        }

        .elite-creation-card {
          background: white;
          width: 100%;
          max-width: 850px;
          border-radius: 32px;
          padding: 48px;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3);
        }

        .creation-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
        }

        .header-left { display: flex; align-items: center; gap: 20px; }
        .icon-box-p { width: 56px; height: 56px; background: var(--grad-primary); color: white; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
        .header-left h3 { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); letter-spacing: -1px; }
        .header-left p { color: var(--text-muted); font-weight: 600; margin-top: 4px; }

        .btn-close-elite { width: 44px; height: 44px; background: var(--bg-main); color: var(--text-muted); border-radius: 50%; }

        .form-sections-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 48px;
          margin-bottom: 40px;
        }

        .preview-card-elite {
          background: var(--bg-main);
          border-radius: 24px;
          padding: 32px;
          text-align: center;
          border: 2px dashed var(--border);
          margin-bottom: 24px;
          position: relative;
        }

        .preview-emoji { font-size: 4rem; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; min-height: 100px; }
        .prev-img-elite { width: 120px; height: 120px; object-fit: cover; border-radius: 20px; border: 4px solid white; box-shadow: var(--shadow-md); }
        .photo-upload-btn { position: absolute; top: 10px; right: 10px; width: 36px; height: 36px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary); box-shadow: var(--shadow-sm); }
        
        .prev-cat { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--primary); letter-spacing: 1px; }
        .prev-name { font-size: 1.1rem; font-weight: 800; margin: 8px 0; color: var(--text-primary); }
        .prev-price { font-size: 1.5rem; font-weight: 900; color: var(--text-primary); }
        .preview-status { margin-top: 20px; font-size: 0.75rem; font-weight: 700; color: var(--success); display: flex; align-items: center; justify-content: center; gap: 6px; }

        .form-inputs-section { display: flex; flex-direction: column; gap: 24px; }
        .input-field-elite label { display: block; font-size: 0.85rem; font-weight: 800; color: var(--text-secondary); margin-bottom: 10px; padding-left: 4px; }
        
        .input-icon-wrap { display: flex; align-items: center; background: var(--bg-main); border-radius: 16px; padding: 4px 16px; border: 2px solid transparent; transition: all 0.2s; }
        .input-icon-wrap:focus-within { border-color: var(--primary); background: white; box-shadow: 0 0 0 5px var(--primary-glow); }
        .input-icon-wrap svg { color: var(--text-muted); margin-right: 14px; }
        .input-icon-wrap input, select { background: transparent; border: none; padding: 12px 0; width: 100%; font-size: 1rem; font-weight: 700; color: var(--text-primary); }
        
        .input-row-elite { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        .emoji-input-wrap input { width: 100%; background: var(--bg-main); border-radius: 16px; padding: 14px; text-align: center; font-size: 1.5rem; border: 2px solid transparent; margin-bottom: 8px; }
        .emoji-input-wrap .hint { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-align: center; }

        .creation-footer {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          border-top: 1px solid var(--border);
          padding-top: 32px;
        }

        .btn-cancel-elite { padding: 14px 28px; font-weight: 700; color: var(--text-secondary); background: var(--bg-main); border-radius: 16px; }
        .btn-confirm-elite { padding: 14px 32px; background: var(--grad-primary); color: white; border-radius: 16px; font-weight: 800; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 20px var(--primary-glow); }

        @media (max-width: 900px) {
          .form-sections-grid { grid-template-columns: 1fr; }
          .form-preview-section { display: none; }
          .inventory-top-bar { flex-direction: column; align-items: flex-start; }
          .search-box-premium { max-width: 100%; }
        }
      `}} />
    </div>
  );
};

export default InventoryView;
