require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Security and performance middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// CORS configuration - allow all origins for public deployment
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins for public deployment
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-auth', 'Origin', 'Accept']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from multiple directories
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
}

// ✅ FIXED: MySQL connection pool with SSL handling
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'dzika.123',
  database: process.env.DB_NAME || 'peaqbodycare',
  ssl: process.env.DB_HOST === 'aws.connect.psdb.cloud' ? 
    { rejectUnauthorized: false } : 
    false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Enhanced database connection test
async function testConnection() {
  let connection;
  try {
    console.log('🔧 Attempting to connect to MySQL...');
    console.log('🔧 Connection details:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      database: process.env.DB_NAME || 'peaqbodycare',
      password: process.env.DB_PASSWORD ? '***' : 'not set',
      ssl: process.env.DB_HOST === 'aws.connect.psdb.cloud' ? 'disabled' : 'false'
    });

    connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database:', process.env.DB_NAME || 'peaqbodycare');
    
    // Test query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database test query successful');
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Troubleshooting tips:');
    console.log('1. Check if MySQL service is running');
    console.log('2. Verify username and password in .env file');
    console.log('3. Ensure database exists');
    console.log('4. Check MySQL user privileges');
    
    if (connection) {
      connection.release();
    }
    return false;
  }
}

// Admin middleware
const requireAdmin = (req, res, next) => {
  const isAdmin = req.headers['x-admin-auth'] === 'true' || 
                 (req.body.email && req.body.email.endsWith('@admin.com'));
  
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
  next();
};

// Response formatter middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (typeof data === 'object' && !data.success !== undefined) {
      data = {
        success: !res.statusCode || res.statusCode < 400,
        ...data
      };
    }
    originalSend.call(this, data);
  };
  next();
});

// Initialize database
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connection established');
    
    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'peaqbodycare'}`);
    await connection.execute(`USE ${process.env.DB_NAME || 'peaqbodycare'}`);
    
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      )
    `);
    
    // Create products table
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_featured (featured),
        INDEX idx_name (name)
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
        INDEX idx_status (status),
        INDEX idx_order_date (order_date)
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
    const [existingProducts] = await connection.execute('SELECT COUNT(*) as count FROM products');
    
    if (existingProducts[0].count === 0) {
      const products = [
        // For Her Collection
        { name: 'Velvet Torrida', category: 'For Her', size: '50ml', price: 119.99, image_url: '/images/velvet-torrida.jpg', description: 'Luxurious velvet scent with warm notes', featured: true },
        { name: 'Good Girl Inspired', category: 'For Her', size: '30ml', price: 49.99, image_url: '/images/good-girl.jpg', description: 'Elegant and sophisticated fragrance', featured: true },
        { name: 'VIP For Her', category: 'For Her', size: '30ml', price: 49.99, image_url: '/images/vip-her.jpg', description: 'Exclusive VIP scent experience', featured: false },
        
        // For Him Collection
        { name: 'Royal For Him', category: 'For Him', size: '30ml', price: 49.99, image_url: '/images/royal-him.jpg', description: 'Royal masculine fragrance', featured: true },
        { name: 'Velvet For Him', category: 'For Him', size: '50ml', price: 119.99, image_url: '/images/velvet-him.jpg', description: 'Velvet masculine scent', featured: true },
        
        // New Arrivals
        { name: 'Golden Moment', category: 'New Arrivals', size: '30ml', price: 49.99, image_url: '/images/golden-moment.jpg', description: 'Your golden moment awaits', featured: true },
        { name: 'Velvet Range', category: 'New Arrivals', size: '30ml', price: 49.99, image_url: '/images/velvet-range.jpg', description: 'New velvet range collection', featured: true },
        { name: 'Travel Size', category: 'New Arrivals', size: '30ml', price: 49.99, image_url: '/images/travel-size.jpg', description: 'New travel size convenience', featured: true }
      ];

      for (const product of products) {
        await connection.execute(
          'INSERT INTO products (name, category, size, price, image_url, description, featured) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [product.name, product.category, product.size, product.price, product.image_url, product.description, product.featured]
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

// API Routes

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ 
      success: true,
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      status: 'Error', 
      database: 'Disconnected',
      error: error.message 
    });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const [products] = await pool.execute('SELECT * FROM products ORDER BY category, name');
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching products' 
    });
  }
});

// Get products by category
app.get('/api/products/:category', async (req, res) => {
  try {
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE category = ? ORDER BY name',
      [req.params.category]
    );
    res.json({
      success: true,
      data: products,
      count: products.length,
      category: req.params.category
    });
  } catch (error) {
    console.error('Category products error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching category products' 
    });
  }
});

// Search products
app.get('/api/products/search/:query', async (req, res) => {
  try {
    const searchQuery = `%${req.params.query}%`;
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE name LIKE ? OR description LIKE ? OR category LIKE ? ORDER BY name',
      [searchQuery, searchQuery, searchQuery]
    );
    res.json({
      success: true,
      data: products,
      count: products.length,
      query: req.params.query
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error searching products' 
    });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword]
    );

    res.status(201).json({ 
      success: true,
      message: 'Registered successfully',
      userId: result.insertId 
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration' 
    });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password required' 
      });
    }

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    res.json({
      success: true,
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
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
});

// Orders routes
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    const { customer, items, subtotal, total, orderNumber } = orderData;
    
    if (!customer || !items || !subtotal || !total) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order data'
      });
    }

    const shippingFee = 50.00;
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (
          order_number, customer_name, customer_email, customer_phone, 
          customer_address, customer_city, customer_postal_code, customer_province,
          delivery_instructions, subtotal, shipping_fee, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber || `PEAQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

      for (const item of items) {
        await connection.execute(
          `INSERT INTO order_items (
            order_id, product_name, product_category, product_size, product_price, quantity
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.name,
            item.category,
            item.size,
            parseFloat(item.price),
            item.quantity || 1
          ]
        );
      }

      await connection.commit();
      connection.release();

      const whatsappMessage = generateWhatsAppMessage(orderData, orderNumber);
      
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        orderId: orderId,
        orderNumber: orderNumber,
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
    res.status(500).json({ 
      success: false,
      message: 'Error creating order: ' + error.message 
    });
  }
});

// Generate WhatsApp message
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
    message += `${index + 1}. ${item.name} - ${item.size} - R${item.price}\n`;
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

    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching orders' 
    });
  }
});

// Admin Routes
app.get('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const [products] = await pool.execute(`
      SELECT id, name, category, size, price, image_url, description, featured, stock_quantity, created_at 
      FROM products 
      ORDER BY created_at DESC
    `);
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Admin get products error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching products' 
    });
  }
});

// Add new product
app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const { name, category, size, price, image_url, description, featured, stock_quantity } = req.body;
    
    if (!name || !category || !size || !price) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, category, size, and price are required' 
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO products (name, category, size, price, image_url, description, featured, stock_quantity) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        category, 
        size, 
        parseFloat(price), 
        image_url || '', 
        description || '', 
        featured ? 1 : 0, 
        parseInt(stock_quantity) || 100
      ]
    );

    res.status(201).json({ 
      success: true,
      message: 'Product created successfully',
      productId: result.insertId 
    });
  } catch (error) {
    console.error('Admin create product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating product: ' + error.message 
    });
  }
});

// Update product
app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, category, size, price, image_url, description, featured, stock_quantity } = req.body;
    
    if (!name || !category || !size || !price) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, category, size, and price are required' 
      });
    }

    const [result] = await pool.execute(
      `UPDATE products 
       SET name = ?, category = ?, size = ?, price = ?, image_url = ?, description = ?, featured = ?, stock_quantity = ?
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
        productId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    res.json({ 
      success: true,
      message: 'Product updated successfully' 
    });
  } catch (error) {
    console.error('Admin update product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating product: ' + error.message 
    });
  }
});

// Delete product
app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    
    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [productId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    res.json({ 
      success: true,
      message: 'Product deleted successfully' 
    });
  } catch (error) {
    console.error('Admin delete product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting product: ' + error.message 
    });
  }
});

// Serve React app for all other routes (for production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
async function startServer() {
  try {
    const connectionSuccess = await testConnection();
    if (!connectionSuccess) {
      console.log('❌ Cannot start server without database connection');
      process.exit(1);
    }
    
    await initializeDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Access via: http://localhost:${PORT}`);
      console.log(`🌍 Public URL: http://YOUR_SERVER_IP:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();