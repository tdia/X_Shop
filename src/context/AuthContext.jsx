import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const refreshUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        const savedSession = localStorage.getItem('xshop_session');
        if (savedSession) {
            setUser(JSON.parse(savedSession));
        }
        refreshUsers().finally(() => setLoading(false));
    }, []);

    const login = async (username, password) => {
        try {
            const userData = await api.login(username, password);
            setUser(userData);
            localStorage.setItem('xshop_session', JSON.stringify(userData));
            return true;
        } catch (error) {
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('xshop_session');
    };

    const addUser = async (userData) => {
        const newUser = await api.addUser(userData);
        setUsers([...users, newUser]);
    };

    const updateUser = async (id, userData) => {
        const updated = await api.updateUser(id, userData);
        setUsers(users.map(u => u.id === id ? updated : u));
        if (user && user.id === id) {
            setUser(updated);
            localStorage.setItem('xshop_session', JSON.stringify(updated));
        }
    };

    const deleteUser = async (id) => {
        await api.deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
    };

    return (
        <AuthContext.Provider value={{ user, users, login, logout, addUser, updateUser, deleteUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
