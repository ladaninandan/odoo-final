import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Floor from '../models/Floor.js';
import Table from '../models/Table.js';
import PaymentMethod from '../models/PaymentMethod.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/odoo-final';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing POS data (keep auth-related models intact)
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      Floor.deleteMany({}),
      Table.deleteMany({}),
      PaymentMethod.deleteMany({}),
    ]);
    console.log('Cleared existing POS data');

    // ── Users (12 total: 4 per role) ─────────────────────────
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash('password123', salt);

    const userDefs = [
      ...Array.from({ length: 4 }, (_, i) => ({
        first_name: `Admin${i + 1}`,
        last_name: 'User',
        email: `admin${i + 1}@cafe.com`,
        password_hash: hashedPass,
        role: 'admin',
        is_verified: true,
        status: 'active',
      })),
      ...Array.from({ length: 4 }, (_, i) => ({
        first_name: `Cashier${i + 1}`,
        last_name: 'User',
        email: `cashier${i + 1}@cafe.com`,
        password_hash: hashedPass,
        role: 'cashier',
        is_verified: true,
        status: 'active',
      })),
      ...Array.from({ length: 4 }, (_, i) => ({
        first_name: `Kitchen${i + 1}`,
        last_name: 'User',
        email: `kitchen${i + 1}@cafe.com`,
        password_hash: hashedPass,
        role: 'kitchen',
        is_verified: true,
        status: 'active',
      })),
    ];

    // Upsert users (don't delete existing auth users)
    for (const u of userDefs) {
      await User.findOneAndUpdate({ email: u.email }, u, { upsert: true, new: true });
    }
    console.log('✅ 12 demo users created (password: password123)');

    // ── Categories ───────────────────────────────────────────
    const categories = await Category.insertMany([
      { name: 'Beverages', color: '#3b82f6', icon: '☕' },
      { name: 'Snacks', color: '#f59e0b', icon: '🍟' },
      { name: 'Main Course', color: '#ef4444', icon: '🍛' },
      { name: 'Desserts', color: '#ec4899', icon: '🍰' },
      { name: 'Specials', color: '#8b5cf6', icon: '⭐' },
    ]);
    console.log('✅ 5 categories created');

    const catMap = {};
    categories.forEach((c) => (catMap[c.name] = c._id));

    // ── Products (~25 items) ─────────────────────────────────
    const products = [
      // Beverages
      { name: 'Espresso', category: catMap['Beverages'], price: 120, taxRate: 5, description: 'Strong Italian coffee shot', sendToKitchen: true },
      { name: 'Cappuccino', category: catMap['Beverages'], price: 180, taxRate: 5, description: 'Espresso with steamed milk foam', sendToKitchen: true },
      { name: 'Latte', category: catMap['Beverages'], price: 200, taxRate: 5, description: 'Creamy coffee with milk', sendToKitchen: true },
      { name: 'Masala Chai', category: catMap['Beverages'], price: 80, taxRate: 5, description: 'Spiced Indian tea', sendToKitchen: true },
      { name: 'Fresh Lime Soda', category: catMap['Beverages'], price: 100, taxRate: 5, description: 'Refreshing lime with soda', sendToKitchen: true },
      // Snacks
      { name: 'French Fries', category: catMap['Snacks'], price: 150, taxRate: 5, description: 'Crispy golden fries', sendToKitchen: true },
      { name: 'Veg Sandwich', category: catMap['Snacks'], price: 160, taxRate: 5, description: 'Grilled vegetable sandwich', sendToKitchen: true },
      { name: 'Momos (6 pcs)', category: catMap['Snacks'], price: 140, taxRate: 5, description: 'Steamed vegetable dumplings', sendToKitchen: true,
        variants: [{ attribute: 'Type', values: [{ label: 'Steamed', extraPrice: 0 }, { label: 'Fried', extraPrice: 20 }] }] },
      { name: 'Garlic Bread', category: catMap['Snacks'], price: 130, taxRate: 5, description: 'Toasted bread with garlic butter', sendToKitchen: true },
      { name: 'Spring Rolls', category: catMap['Snacks'], price: 160, taxRate: 5, description: 'Crispy rolls with vegetable filling', sendToKitchen: true },
      // Main Course
      { name: 'Veg Biryani', category: catMap['Main Course'], price: 280, taxRate: 5, description: 'Fragrant rice with mixed vegetables', sendToKitchen: true },
      { name: 'Paneer Tikka Masala', category: catMap['Main Course'], price: 320, taxRate: 5, description: 'Cottage cheese in spicy tomato gravy', sendToKitchen: true },
      { name: 'Pasta Alfredo', category: catMap['Main Course'], price: 260, taxRate: 5, description: 'Creamy white sauce pasta', sendToKitchen: true },
      { name: 'Margherita Pizza', category: catMap['Main Course'], price: 350, taxRate: 5, description: 'Classic pizza with mozzarella and basil', sendToKitchen: true,
        variants: [{ attribute: 'Size', values: [{ label: 'Regular', extraPrice: 0 }, { label: 'Large', extraPrice: 100 }] }] },
      { name: 'Veg Noodles', category: catMap['Main Course'], price: 220, taxRate: 5, description: 'Stir-fried noodles with vegetables', sendToKitchen: true },
      { name: 'Dal Makhani', category: catMap['Main Course'], price: 260, taxRate: 5, description: 'Creamy black lentils', sendToKitchen: true },
      { name: 'Cheese Burger', category: catMap['Main Course'], price: 240, taxRate: 5, description: 'Juicy burger with cheese patty', sendToKitchen: true },
      // Desserts
      { name: 'Chocolate Brownie', category: catMap['Desserts'], price: 160, taxRate: 5, description: 'Rich chocolate brownie with nuts', sendToKitchen: true },
      { name: 'Ice Cream Sundae', category: catMap['Desserts'], price: 180, taxRate: 5, description: 'Vanilla ice cream with toppings', sendToKitchen: true },
      { name: 'Cheesecake', category: catMap['Desserts'], price: 220, taxRate: 5, description: 'New York style cheesecake', sendToKitchen: true },
      { name: 'Gulab Jamun', category: catMap['Desserts'], price: 100, taxRate: 5, description: 'Sweet milk dumplings in sugar syrup', sendToKitchen: true },
      // Specials
      { name: 'Chef Special Thali', category: catMap['Specials'], price: 450, taxRate: 5, description: 'A complete meal with dal, sabzi, roti, rice, and dessert', sendToKitchen: true },
      { name: 'Loaded Nachos', category: catMap['Specials'], price: 280, taxRate: 5, description: 'Nachos with cheese, salsa, and guacamole', sendToKitchen: true },
      { name: 'Cold Coffee Shake', category: catMap['Specials'], price: 200, taxRate: 5, description: 'Blended iced coffee with cream', sendToKitchen: true },
    ];

    await Product.insertMany(products);
    console.log(`✅ ${products.length} products created`);

    // ── Floors & Tables ──────────────────────────────────────
    const floorNames = ['Ground Floor', 'First Floor', 'Terrace'];
    const seatsOptions = [2, 4, 4, 6, 4, 2, 4]; // 7 tables per floor

    for (const floorName of floorNames) {
      const floor = await Floor.create({ name: floorName });
      const tables = seatsOptions.map((seats, i) => ({
        floor: floor._id,
        tableNumber: i + 1,
        seats,
        status: 'available',
      }));
      await Table.insertMany(tables);
    }
    console.log('✅ 3 floors with 7 tables each (21 total) created');

    // ── Payment Methods ──────────────────────────────────────
    await PaymentMethod.insertMany([
      { type: 'cash', isEnabled: true },
      { type: 'digital', isEnabled: true },
      { type: 'upi', isEnabled: true, upiId: 'cafe@ybl.com' },
    ]);
    console.log('✅ 3 payment methods configured');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\nDemo Credentials (all roles — password: password123):');
    console.log('  Admin:   admin1@cafe.com');
    console.log('  Cashier: cashier1@cafe.com');
    console.log('  Kitchen: kitchen1@cafe.com');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();
