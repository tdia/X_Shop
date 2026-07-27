import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/views/DashboardView';
import POSView from './components/views/POSView';
import InventoryView from './components/views/InventoryView';
import ReportsView from './components/views/ReportsView';
import LoginView from './components/views/LoginView';
import UserManagementView from './components/views/UserManagementView';
import CustomersView from './components/views/CustomersView';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './services/api';
import './App.css';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [productsData, salesData, customersData] = await Promise.all([
        api.getProducts(),
        api.getSales(),
        api.getCustomers()
      ]);
      setProducts(productsData);
      setSales(salesData);
      setCustomers(customersData);
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

  const addSale = async (cartItems, paymentDetails = {}) => {
    const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    try {
      const newSale = await api.addSale({
        items: cartItems,
        total,
        ...paymentDetails
      });
      setSales([newSale, ...sales]);

      // Update customers if new one or updated
      fetchData(); // Refresh all to be sure

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

  const updateSale = async (id, updatedData) => {
    try {
      const updated = await api.updateSale(id, updatedData);
      setSales(sales.map(s => s.id === id ? updated : s));
      return updated;
    } catch (error) {
      alert("Erreur lors de la mise à jour de la vente");
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

  const addCustomer = async (data) => {
    const newCustomer = await api.addCustomer(data);
    setCustomers([...customers, newCustomer]);
  };

  const updateCustomer = async (id, data) => {
    const updated = await api.updateCustomer(id, data);
    setCustomers(customers.map(c => c.id === id ? updated : c));
  };

  const deleteCustomer = async (id) => {
    await api.deleteCustomer(id);
    setCustomers(customers.filter(c => c.id !== id));
  };

  const renderView = () => {
    if (loading) return <div>Chargement des données...</div>;

    switch (currentView) {
      case 'dashboard':
        return <DashboardView sales={sales} products={products} />;
      case 'pos':
        return <POSView products={products} customers={customers} addSale={addSale} addCustomer={addCustomer} />;
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
        return <ReportsView sales={sales} updateSale={updateSale} />;
      case 'customers':
        return (
          <CustomersView
            sales={sales}
            customers={customers}
            addCustomer={addCustomer}
            updateCustomer={updateCustomer}
            deleteCustomer={deleteCustomer}
          />
        );
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
