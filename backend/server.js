import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Sale from './models/Sale.js';
import Customer from './models/Customer.js';

dotenv.config();

// Define Associations
Customer.hasMany(Sale, { foreignKey: 'customerId' });
Sale.belongsTo(Customer, { foreignKey: 'customerId' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auth Routes
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username, password } });
        if (user) {
            res.json(user);
        } else {
            res.status(401).json({ message: 'Identifiants invalides' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User Management
app.get('/api/users', async (req, res) => {
    const users = await User.findAll();
    res.json(users);
});

app.post('/api/users', async (req, res) => {
    const user = await User.create(req.body);
    res.json(user);
});

app.put('/api/users/:id', async (req, res) => {
    await User.update(req.body, { where: { id: req.params.id } });
    const updated = await User.findByPk(req.params.id);
    res.json(updated);
});

app.delete('/api/users/:id', async (req, res) => {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
});

// Product Management
app.get('/api/products', async (req, res) => {
    const products = await Product.findAll();
    res.json(products);
});

app.post('/api/products', async (req, res) => {
    const product = await Product.create(req.body);
    res.json(product);
});

app.put('/api/products/:id', async (req, res) => {
    await Product.update(req.body, { where: { id: req.params.id } });
    const updated = await Product.findByPk(req.params.id);
    res.json(updated);
});

app.delete('/api/products/:id', async (req, res) => {
    await Product.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
});

// Customer Management
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await Customer.findAll();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/customers', async (req, res) => {
    try {
        const customer = await Customer.create(req.body);
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/customers/:id', async (req, res) => {
    try {
        await Customer.update(req.body, { where: { id: req.params.id } });
        const updated = await Customer.findByPk(req.params.id);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/customers/:id', async (req, res) => {
    try {
        await Customer.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sales Management
app.get('/api/sales', async (req, res) => {
    const sales = await Sale.findAll({ order: [['timestamp', 'DESC']] });
    // Map items string back to objects
    const formatted = sales.map(s => {
        const saleJson = s.toJSON();
        let parsedItems = [];
        try {
            parsedItems = typeof saleJson.items === 'string' ? JSON.parse(saleJson.items) : saleJson.items;
        } catch (e) {
            console.error("Error parsing sale items:", e);
        }
        return { ...saleJson, items: parsedItems };
    });
    res.json(formatted);
});

app.post('/api/sales', async (req, res) => {
    const { items, total, paidAmount, paymentStatus, customerName, customerPhone } = req.body;

    // Start transaction for stock update
    const t = await sequelize.transaction();
    try {
        // Auto-create or update customer if info provided
        let linkedCustomerId = null;
        if (customerPhone) {
            const [customer, created] = await Customer.findOrCreate({
                where: { phone: customerPhone },
                defaults: { name: customerName || 'Client Inconnu' },
                transaction: t
            });
            linkedCustomerId = customer.id;
            if (!created && customerName && customer.name !== customerName) {
                await customer.update({ name: customerName }, { transaction: t });
            }
        }

        const sale = await Sale.create({
            items: JSON.stringify(items),
            total,
            paidAmount: paidAmount || total,
            paymentStatus: paymentStatus || 'paid',
            customerName,
            customerPhone,
            customerId: linkedCustomerId
        }, { transaction: t });

        // Update stock for each product
        for (const item of items) {
            const product = await Product.findByPk(item.id);
            if (product) {
                await product.update({
                    stock: Math.max(0, product.stock - item.quantity)
                }, { transaction: t });
            }
        }

        await t.commit();
        res.json({ ...sale.toJSON(), items });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/sales/:id', async (req, res) => {
    try {
        await Sale.update(req.body, { where: { id: req.params.id } });
        const updated = await Sale.findByPk(req.params.id);
        const saleJson = updated.toJSON();
        res.json({
            ...saleJson,
            items: JSON.parse(saleJson.items)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(async () => {
    // Seed admin if not exists
    const admin = await User.findOne({ where: { username: 'admin' } });
    if (!admin) {
        await User.create({
            username: 'admin',
            password: 'password',
            name: 'Administrateur Principal',
            role: 'admin'
        });
        console.log('Admin user created');
    }

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.error('DB Sync Error:', err));
