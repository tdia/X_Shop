import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/views/DashboardView';
import POSView from './components/views/POSView';
import InventoryView from './components/views/InventoryView';
import ReportsView from './components/views/ReportsView';
import LoginView from './components/views/LoginView';
import UserManagementView from './components/views/UserManagementView';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './services/api';
import './App.css';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [productsData, salesData] = await Promise.all([
        api.getProducts(),
        api.getSales()
      ]);
      setProducts(productsData);
      setSales(salesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Adjust view if current restricted
  useEffect(() => {
    if (!user) return;
    const restrictedViews = {
      vendeur: ['dashboard', 'inventory', 'reports', 'users'],
      manager: ['pos', 'inventory', 'users'],
      gestionnaire: ['users']
    };

    if (restrictedViews[user.role]?.includes(currentView)) {
      if (user.role === 'vendeur') setCurrentView('pos');
      else if (user.role === 'manager') setCurrentView('reports');
      else setCurrentView('dashboard');
    }
  }, [user, currentView]);

  if (authLoading) return <div className="loading-screen">Chargement...</div>;

  if (!user) {
    return <LoginView />;
  }

  const addSale = async (cartItems) => {
    const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    try {
      const newSale = await api.addSale({ items: cartItems, total });
      setSales([newSale, ...sales]);

      // Update local products stock
      setProducts(products.map(p => {
        const cartItem = cartItems.find(item => item.id === p.id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
        }
        return p;
      }));

      return newSale;
    } catch (error) {
      alert("Erreur lors de la validation de la vente");
    }
  };

  const addProduct = async (productData) => {
    const newProduct = await api.addProduct(productData);
    setProducts([...products, newProduct]);
  };

  const updateProduct = async (id, updatedData) => {
    const updated = await api.updateProduct(id, updatedData);
    setProducts(products.map(p => p.id === id ? updated : p));
  };

  const deleteProduct = async (id) => {
    await api.deleteProduct(id);
    setProducts(products.filter(p => p.id !== id));
  };

  const updateStock = async (productId, newStock) => {
    const updated = await api.updateProduct(productId, { stock: parseInt(newStock) || 0 });
    setProducts(products.map(p => p.id === productId ? updated : p));
  };

  const renderView = () => {
    if (loading) return <div>Chargement des données...</div>;

    switch (currentView) {
      case 'dashboard':
        return <DashboardView sales={sales} products={products} />;
      case 'pos':
        return <POSView products={products} addSale={addSale} />;
      case 'inventory':
        return (
          <InventoryView
            products={products}
            updateStock={updateStock}
            addProduct={addProduct}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
            canEdit={['admin', 'gestionnaire'].includes(user.role)}
          />
        );
      case 'reports':
        return <ReportsView sales={sales} />;
      case 'users':
        return <UserManagementView />;
      default:
        return <DashboardView sales={sales} products={products} />;
    }
  };

  return (
    <div className="x-app-wrapper">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      <div className="x-main-canvas">
        <Header currentView={currentView} />
        <main className="x-view-portal">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
