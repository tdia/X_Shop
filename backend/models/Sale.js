import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Sale = sequelize.define('Sale', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    items: {
        type: DataTypes.TEXT('long'), // Stored as JSON string
        allowNull: false
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    paidAmount: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    paymentStatus: {
        type: DataTypes.ENUM('paid', 'partial', 'pending'),
        defaultValue: 'paid'
    },
    customerName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    customerPhone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    customerId: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

export default Sale;
