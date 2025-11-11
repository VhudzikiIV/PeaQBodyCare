require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));

// MySQL connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'dzika.123',
  database: process.env.DB_NAME || 'peaqbodycare',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Admin middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  const isAdmin = req.headers['x-admin-auth'] === 'true' || 
                 (req.body.email && req.body.email.endsWith('@admin.com'));
  
  if (!isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Initialize database
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database: peaqbodycare');
    
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create products table with additional fields including active
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        size VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        image_url VARCHAR(500),
        description TEXT,
        featured BOOLEAN DEFAULT FALSE,
        stock_quantity INT DEFAULT 100,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_featured (featured),
        INDEX idx_active (active)
      )
    `);

    // Create orders table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(100) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_address TEXT NOT NULL,
        customer_city VARCHAR(100) NOT NULL,
        customer_postal_code VARCHAR(20) NOT NULL,
        customer_province VARCHAR(100) NOT NULL,
        delivery_instructions TEXT,
        subtotal DECIMAL(10,2) NOT NULL,
        shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 50.00,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_order_number (order_number),
        INDEX idx_customer_email (customer_email),
        INDEX idx_status (status)
      )
    `);

    // Create order_items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_category VARCHAR(100) NOT NULL,
        product_size VARCHAR(50) NOT NULL,
        product_price DECIMAL(10,2) NOT NULL,
        quantity INT DEFAULT 1,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        INDEX idx_order_id (order_id)
      )
    `);
    
    // Insert sample products
    await insertSampleProducts(connection);
    
    console.log('✅ Database initialized successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  }
}

// Insert sample products
async function insertSampleProducts(connection) {
  try {
    // Check if products already exist
    const [existingProducts] = await connection.execute('SELECT COUNT(*) as count FROM products');
    
    if (existingProducts[0].count === 0) {
      const products = [
        // For Her Collection
        { name: 'Velvet Torrida', category: 'For Her', size: '50ml', price: 119.99, image_url: '/images/1762590894043.jpeg', description: 'Luxurious velvet scent with warm notes', featured: true, active: true },
        { name: 'Good Girl Inspired', category: 'For Her', size: '30ml', price: 49.99, image_url: '/images/1762590894051.jpeg', description: 'Elegant and sophisticated fragrance', featured: true, active: true },
        { name: 'VIP For Her', category: 'For Her', size: '30ml', price: 49.99, image_url: '/images/1762590894062.jpeg', description: 'Exclusive VIP scent experience', featured: false, active: true },
        
        // For Him Collection
        { name: 'Royal For Him', category: 'For Him', size: '30ml', price: 49.99, image_url: '/images/1762590894062.jpeg', description: 'Royal masculine fragrance', featured: true, active: true },
        { name: 'Velvet For Him', category: 'For Him', size: '50ml', price: 119.99, image_url: '/images/1762590894089.jpeg', description: 'Velvet masculine scent', featured: true, active: true },
        
        // New Arrivals
        { name: 'Golden Moment', category: 'New Arrivals', size: '30ml', price: 49.99, image_url: '/images/1762590894035.jpeg', description: 'Your golden moment awaits', featured: true, active: true },
        { name: 'Velvet Range', category: 'New Arrivals', size: '30ml', price: 49.99, image_url: '/images/1762590894071.jpeg', description: 'New velvet range collection', featured: true, active: true },
        { name: 'Travel Size', category: 'New Arrivals', size: '30ml', price: 49.99, image_url: '/images/1762590894080.jpeg', description: 'New travel size convenience', featured: true, active: true }
      ];

      for (const product of products) {
        await connection.execute(
          'INSERT INTO products (name, category, size, price, image_url, description, featured, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [product.name, product.category, product.size, product.price, product.image_url, product.description, product.featured, product.active]
        );
      }
      console.log('✅ Sample products inserted');
    } else {
      console.log('✅ Products already exist in database');
    }
  } catch (error) {
    console.error('❌ Error inserting sample products:', error.message);
  }
}

// Routes

// Get all products (only active ones for customers)
app.get('/api/products', async (req, res) => {
  try {
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE active = TRUE ORDER BY category, name'
    );
    res.json(products);
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get products by category (only active)
app.get('/api/products/:category', async (req, res) => {
  try {
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE category = ? AND active = TRUE ORDER BY name',
      [req.params.category]
    );
    res.json(products);
  } catch (error) {
    console.error('Category products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword]
    );

    res.status(201).json({ 
      message: 'Registered successfully',
      userId: result.insertId 
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate WhatsApp message function - FIXED VERSION
function generateWhatsAppMessage(orderData, orderNumber) {
  const { customer, items, subtotal, total } = orderData;
  
  let message = `🛍️ *NEW ORDER - PeaQ Body Care*\n\n`;
  message += `*Order Number:* ${orderNumber}\n`;
  message += `*Customer:* ${customer.firstName} ${customer.lastName}\n`;
  message += `*Phone:* ${customer.phone}\n`;
  message += `*Email:* ${customer.email}\n\n`;
  
  message += `*Delivery Address:*\n`;
  message += `${customer.address}\n`;
  message += `${customer.city}, ${customer.postalCode}\n`;
  message += `${customer.province}\n\n`;
  
  message += `*Order Items:*\n`;
  items.forEach((item, index) => {
    // Make sure we're accessing the correct properties
    const itemName = item.name || item.product_name || 'Product';
    const itemSize = item.size || item.product_size || 'Size not specified';
    const itemPrice = item.price || item.product_price || 0;
    
    message += `${index + 1}. ${itemName} - ${itemSize} - R${parseFloat(itemPrice).toFixed(2)}\n`;
  });
  
  message += `\n*Order Summary:*\n`;
  message += `Subtotal: R${parseFloat(subtotal).toFixed(2)}\n`;
  message += `Shipping: R50.00\n`;
  message += `*Total: R${parseFloat(total).toFixed(2)}*\n\n`;
  
  if (customer.deliveryInstructions) {
    message += `*Delivery Instructions:*\n`;
    message += `${customer.deliveryInstructions}\n\n`;
  }
  
  message += `Order Date: ${new Date().toLocaleString()}\n`;
  message += `Payment Method: Cash on Delivery`;
  
  return encodeURIComponent(message);
}

// Orders routes - FIXED VERSION
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    const { customer, items, subtotal, total, orderNumber } = orderData;
    
    // Validate that items have the required properties
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid order items' });
    }

    // Validate each item has required properties
    for (const item of items) {
      if (!item.name || !item.size || !item.price) {
        return res.status(400).json({ 
          message: 'Each product must have name, size, and price' 
        });
      }
    }
    
    // Calculate shipping fee (R50 fixed)
    const shippingFee = 50.00;
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert order
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (
          order_number, customer_name, customer_email, customer_phone, 
          customer_address, customer_city, customer_postal_code, customer_province,
          delivery_instructions, subtotal, shipping_fee, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber,
          `${customer.firstName} ${customer.lastName}`,
          customer.email,
          customer.phone,
          customer.address,
          customer.city,
          customer.postalCode,
          customer.province,
          customer.deliveryInstructions || '',
          parseFloat(subtotal),
          shippingFee,
          parseFloat(total)
        ]
      );

      const orderId = orderResult.insertId;

      // Insert order items with proper data
      for (const item of items) {
        await connection.execute(
          `INSERT INTO order_items (
            order_id, product_name, product_category, product_size, product_price, quantity
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.name,
            item.category || 'Uncategorized',
            item.size,
            parseFloat(item.price),
            1
          ]
        );
      }

      await connection.commit();
      connection.release();

      console.log('✅ Order created successfully:', orderNumber);
      
      // Generate WhatsApp message with proper data
      const whatsappMessage = generateWhatsAppMessage(orderData, orderNumber);
      
      res.status(201).json({
        message: 'Order created successfully',
        orderId: orderId,
        orderNumber: orderNumber,
        orderDetails: orderData,
        whatsappMessage: whatsappMessage
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error('Order transaction error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Error creating order: ' + error.message });
  }
});

// Get WhatsApp link endpoint - FIXED VERSION
app.get('/api/orders/whatsapp/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE order_number = ?',
      [orderNumber]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const [orderItems] = await pool.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orders[0].id]
    );

    const orderData = {
      customer: {
        firstName: orders[0].customer_name.split(' ')[0],
        lastName: orders[0].customer_name.split(' ').slice(1).join(' '),
        phone: orders[0].customer_phone,
        email: orders[0].customer_email,
        address: orders[0].customer_address,
        city: orders[0].customer_city,
        postalCode: orders[0].customer_postal_code,
        province: orders[0].customer_province,
        deliveryInstructions: orders[0].delivery_instructions
      },
      items: orderItems.map(item => ({
        name: item.product_name,
        category: item.product_category,
        size: item.product_size,
        price: item.product_price
      })),
      subtotal: orders[0].subtotal,
      total: orders[0].total_amount
    };

    const whatsappMessage = generateWhatsAppMessage(orderData, orderNumber);
    const whatsappNumber = '27796989762';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    res.json({
      whatsappUrl: whatsappUrl,
      orderNumber: orderNumber
    });
  } catch (error) {
    console.error('WhatsApp link error:', error);
    res.status(500).json({ message: 'Error generating WhatsApp link' });
  }
});

// Get user orders
app.get('/api/orders/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const [orders] = await pool.execute(
      `SELECT o.*, 
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
       FROM orders o 
       WHERE customer_email = ? 
       ORDER BY order_date DESC`,
      [email]
    );

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get order details
app.get('/api/order/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE order_number = ?',
      [orderNumber]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const [orderItems] = await pool.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orders[0].id]
    );

    res.json({
      order: orders[0],
      items: orderItems
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

// Admin Routes

// Get all products for admin (including inactive)
app.get('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const [products] = await pool.execute(`
      SELECT id, name, category, size, price, image_url, description, featured, stock_quantity, active, created_at 
      FROM products 
      ORDER BY active DESC, created_at DESC
    `);
    res.json(products);
  } catch (error) {
    console.error('Admin get products error:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Add new product
app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const { name, category, size, price, image_url, description, featured, stock_quantity, active } = req.body;
    
    // Validate required fields
    if (!name || !category || !size || !price) {
      return res.status(400).json({ message: 'Name, category, size, and price are required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO products (name, category, size, price, image_url, description, featured, stock_quantity, active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        category, 
        size, 
        parseFloat(price), 
        image_url || '', 
        description || '', 
        featured ? 1 : 0, 
        parseInt(stock_quantity) || 100,
        active !== undefined ? active : true
      ]
    );

    res.status(201).json({ 
      message: 'Product created successfully',
      productId: result.insertId 
    });
  } catch (error) {
    console.error('Admin create product error:', error);
    res.status(500).json({ message: 'Error creating product: ' + error.message });
  }
});

// Update product
app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, category, size, price, image_url, description, featured, stock_quantity, active } = req.body;
    
    // Validate required fields
    if (!name || !category || !size || !price) {
      return res.status(400).json({ message: 'Name, category, size, and price are required' });
    }

    const [result] = await pool.execute(
      `UPDATE products 
       SET name = ?, category = ?, size = ?, price = ?, image_url = ?, description = ?, featured = ?, stock_quantity = ?, active = ?
       WHERE id = ?`,
      [
        name, 
        category, 
        size, 
        parseFloat(price), 
        image_url || '', 
        description || '', 
        featured ? 1 : 0, 
        parseInt(stock_quantity) || 100, 
        active ? 1 : 0,
        productId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Admin update product error:', error);
    res.status(500).json({ message: 'Error updating product: ' + error.message });
  }
});

// Delete product (permanent delete)
app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    
    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [productId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Admin delete product error:', error);
    res.status(500).json({ message: 'Error deleting product: ' + error.message });
  }
});

// Admin orders management
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const [orders] = await pool.execute(`
      SELECT o.*, 
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
      FROM orders o 
      ORDER BY order_date DESC
    `);
    res.json(orders);
  } catch (error) {
    console.error('Admin get orders error:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Update order status
app.put('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const [result] = await pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Admin update order status error:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ 
      status: 'OK', 
      database: 'Connected'
    });
  } catch (error) {
    res.status(500).json({ status: 'Error', database: 'Disconnected' });
  }
});

// Start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📸 Images serving from: http://localhost:${PORT}/images/`);
    console.log(`📱 WhatsApp notifications enabled for: 0796989762`);
  });
});