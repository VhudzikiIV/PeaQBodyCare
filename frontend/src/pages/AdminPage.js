import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../AdminPage.css';

const API_BASE = 'http://localhost:5000/api';

const AdminPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    size: '',
    price: '',
    image_url: '',
    description: '',
    featured: false,
    stock_quantity: 100,
    active: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    if (user && user.email.endsWith('@admin.com')) {
      if (activeTab === 'products') {
        fetchProducts();
      } else if (activeTab === 'orders') {
        fetchOrders();
      }
    }
  }, [user, activeTab, refreshTrigger]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/products`);
      setProducts(response.data);
    } catch (error) {
      setMessage('Error fetching products');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/orders`, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setMessage('Error fetching orders');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseFloat(value) : 
              value
    }));
  };

  const addProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock_quantity: parseInt(newProduct.stock_quantity) || 100,
        active: true
      };

      await axios.post(`${API_BASE}/admin/products`, productData, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      
      setMessage('✅ Product added successfully!');
      setNewProduct({
        name: '',
        category: '',
        size: '',
        price: '',
        image_url: '',
        description: '',
        featured: false,
        stock_quantity: 100,
        active: true
      });
      
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Add product error:', error);
      setMessage(`❌ Error adding product: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const productData = {
        ...editingProduct,
        price: parseFloat(editingProduct.price),
        stock_quantity: parseInt(editingProduct.stock_quantity) || 100
      };

      await axios.put(`${API_BASE}/admin/products/${editingProduct.id}`, productData, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      
      setMessage('✅ Product updated successfully!');
      setEditingProduct(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Update product error:', error);
      setMessage(`❌ Error updating product: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Soft delete - mark product as inactive
  const softDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this product from the website? It will be kept in the database as inactive.')) {
      return;
    }

    try {
      const product = products.find(p => p.id === productId);
      const updatedProduct = {
        ...product,
        active: false
      };

      await axios.put(`${API_BASE}/admin/products/${productId}`, updatedProduct, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      
      setMessage('✅ Product removed from website! It is now marked as inactive in the database.');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Soft delete product error:', error);
      setMessage(`❌ Error removing product: ${error.response?.data?.message || error.message}`);
    }
  };

  // Restore inactive product
  const restoreProduct = async (productId) => {
    try {
      const product = products.find(p => p.id === productId);
      const updatedProduct = {
        ...product,
        active: true
      };

      await axios.put(`${API_BASE}/admin/products/${productId}`, updatedProduct, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      
      setMessage('✅ Product restored successfully! It is now visible on the website.');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Restore product error:', error);
      setMessage(`❌ Error restoring product: ${error.response?.data?.message || error.message}`);
    }
  };

  // Permanent delete (use with caution)
  const permanentDeleteProduct = async (productId) => {
    if (!window.confirm('⚠️ WARNING: This will permanently delete the product from the database. This action cannot be undone. Are you sure?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE}/admin/products/${productId}`, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      
      setMessage('🗑️ Product permanently deleted from database!');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Permanent delete product error:', error);
      setMessage(`❌ Error permanently deleting product: ${error.response?.data?.message || error.message}`);
    }
  };

  const toggleFeatured = async (productId, currentFeatured) => {
    try {
      const product = products.find(p => p.id === productId);
      const updatedProduct = {
        ...product,
        featured: !currentFeatured
      };

      await axios.put(`${API_BASE}/admin/products/${productId}`, updatedProduct, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      
      setMessage(`✅ Product ${!currentFeatured ? 'added to' : 'removed from'} featured list!`);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Toggle featured error:', error);
      setMessage(`❌ Error updating product: ${error.response?.data?.message || error.message}`);
    }
  };

  const updateStock = async (productId, newStock) => {
    try {
      const product = products.find(p => p.id === productId);
      const updatedProduct = {
        ...product,
        stock_quantity: parseInt(newStock) || 0
      };

      await axios.put(`${API_BASE}/admin/products/${productId}`, updatedProduct, {
        headers: {
          'x-admin-auth': 'true'
        }
      });
      
      setMessage('✅ Stock quantity updated!');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Update stock error:', error);
      setMessage(`❌ Error updating stock: ${error.response?.data?.message || error.message}`);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_BASE}/admin/orders/${orderId}/status`, 
        { status: newStatus },
        {
          headers: {
            'x-admin-auth': 'true'
          }
        }
      );
      
      setMessage(`✅ Order status updated to ${newStatus}!`);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Update order status error:', error);
      setMessage(`❌ Error updating order status: ${error.response?.data?.message || error.message}`);
    }
  };

  const viewOrderDetails = async (orderNumber) => {
    try {
      const response = await axios.get(`${API_BASE}/order/${orderNumber}`);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setMessage('❌ Error fetching order details');
    }
  };

  const startEditing = (product) => {
    setEditingProduct({ 
      ...product,
      featured: Boolean(product.featured),
      active: Boolean(product.active)
    });
  };

  const cancelEditing = () => {
    setEditingProduct(null);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
    setMessage('🔄 Data refreshed!');
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter products based on active status
  const activeProducts = products.filter(product => product.active);
  const inactiveProducts = products.filter(product => !product.active);
  
  const displayedProducts = showInactive ? inactiveProducts : activeProducts;

  if (!user || !user.email.endsWith('@admin.com')) {
    return (
      <div className="admin-page">
        <div className="admin-access-denied">
          <h2>Access Denied</h2>
          <p>You must be an administrator to access this page.</p>
          <p>Please log in with an admin account (@admin.com email).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title-section">
          <h1>Admin Dashboard</h1>
          <p>Welcome, {user.firstName} ({user.email})</p>
        </div>
        <button className="refresh-btn" onClick={refreshData}>
          Refresh
        </button>
      </div>

      {message && (
        <div className={`admin-message ${message.includes('❌') ? 'error' : 'success'}`}>
          {message}
          <button onClick={() => setMessage('')} className="close-message">×</button>
        </div>
      )}

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Products Management
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders Management ({orders.length})
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'products' && (
          <>
            <section className="add-product-section">
              <h2>Add New Product</h2>
              <form onSubmit={addProduct} className="product-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={newProduct.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      name="category"
                      value={newProduct.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="For Her">For Her</option>
                      <option value="For Him">For Him</option>
                      <option value="New Arrivals">New Arrivals</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Size *</label>
                    <select
                      name="size"
                      value={newProduct.size}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Size</option>
                      <option value="30ml">30ml</option>
                      <option value="50ml">50ml</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Price (R) *</label>
                    <input
                      type="number"
                      name="price"
                      value={newProduct.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Product Image URL</label>
                  <input
                    type="text"
                    name="image_url"
                    value={newProduct.image_url}
                    onChange={handleInputChange}
                    placeholder="/images/product-image.jpg"
                    className="image-url-input"
                  />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={newProduct.description}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter product description..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={newProduct.featured}
                        onChange={handleInputChange}
                      />
                      Featured Product
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Stock Quantity</label>
                    <input
                      type="number"
                      name="stock_quantity"
                      value={newProduct.stock_quantity}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="100"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? '⏳ Adding...' : '➕ Add Product'}
                </button>
              </form>
            </section>

            <section className="products-list-section">
              <div className="section-header">
                <div className="section-title-with-toggle">
                  <h2>
                    {showInactive ? 'Inactive Products' : 'Active Products'} 
                    ({displayedProducts.length})
                  </h2>
                  <div className="view-toggle">
                    <button
                      className={`toggle-btn ${!showInactive ? 'active' : ''}`}
                      onClick={() => setShowInactive(false)}
                    >
                      Active ({activeProducts.length})
                    </button>
                    <button
                      className={`toggle-btn ${showInactive ? 'active' : ''}`}
                      onClick={() => setShowInactive(true)}
                    >
                      Inactive ({inactiveProducts.length})
                    </button>
                  </div>
                </div>
                <span className="products-count">
                  {products.length} products total • {activeProducts.length} active • {inactiveProducts.length} inactive
                </span>
              </div>
              
              {editingProduct && (
                <div className="edit-product-modal">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>Edit Product</h3>
                      <button className="close-modal" onClick={cancelEditing}>×</button>
                    </div>
                    <form onSubmit={updateProduct} className="product-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Product Name *</label>
                          <input
                            type="text"
                            name="name"
                            value={editingProduct.name}
                            onChange={handleEditInputChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Category *</label>
                          <select
                            name="category"
                            value={editingProduct.category}
                            onChange={handleEditInputChange}
                            required
                          >
                            <option value="For Her">For Her</option>
                            <option value="For Him">For Him</option>
                            <option value="New Arrivals">New Arrivals</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Size *</label>
                          <select
                            name="size"
                            value={editingProduct.size}
                            onChange={handleEditInputChange}
                            required
                          >
                            <option value="30ml">30ml</option>
                            <option value="50ml">50ml</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Price (R) *</label>
                          <input
                            type="number"
                            name="price"
                            value={editingProduct.price}
                            onChange={handleEditInputChange}
                            step="0.01"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Product Image URL</label>
                        <input
                          type="text"
                          name="image_url"
                          value={editingProduct.image_url}
                          onChange={handleEditInputChange}
                          className="image-url-input"
                        />
                      </div>

                      <div className="form-group">
                        <label>Description *</label>
                        <textarea
                          name="description"
                          value={editingProduct.description}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              name="featured"
                              checked={editingProduct.featured}
                              onChange={handleEditInputChange}
                            />
                            Featured Product
                          </label>
                        </div>
                        <div className="form-group">
                          <label>Stock Quantity</label>
                          <input
                            type="number"
                            name="stock_quantity"
                            value={editingProduct.stock_quantity}
                            onChange={handleEditInputChange}
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              name="active"
                              checked={editingProduct.active}
                              onChange={handleEditInputChange}
                            />
                            Active on Website
                          </label>
                        </div>
                      </div>

                      <div className="modal-actions">
                        <button type="submit" disabled={loading} className="save-btn">
                          {loading ? '⏳ Saving...' : '💾 Save Changes'}
                        </button>
                        <button type="button" onClick={cancelEditing} className="cancel-btn">
                          ❌ Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="products-table-container">
                {displayedProducts.length > 0 ? (
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Size</th>
                        <th>Price</th>
                        <th>Featured</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedProducts.map(product => (
                        <tr key={product.id} className={`product-row ${!product.active ? 'inactive' : ''}`}>
                          <td>
                            {product.image_url ? (
                              <img 
                                src={`http://localhost:5000${product.image_url}`} 
                                alt={product.name}
                                className="product-thumbnail"
                              />
                            ) : (
                              <div className="no-image">📷</div>
                            )}
                          </td>
                          <td className="product-name">
                            {product.name}
                            {!product.active && <span className="inactive-badge">Inactive</span>}
                          </td>
                          <td>
                            <span className="category-badge">{product.category}</span>
                          </td>
                          <td>{product.size}</td>
                          <td>R{product.price}</td>
                          <td>
                            <button 
                              onClick={() => toggleFeatured(product.id, product.featured)}
                              className={`featured-toggle ${product.featured ? 'featured' : ''} ${!product.active ? 'disabled' : ''}`}
                              title={!product.active ? 'Cannot feature inactive product' : (product.featured ? 'Remove from featured' : 'Add to featured')}
                              disabled={!product.active}
                            >
                              {product.featured ? '⭐' : '☆'}
                            </button>
                          </td>
                          <td>
                            <div className="stock-controls">
                              <input
                                type="number"
                                value={product.stock_quantity}
                                onChange={(e) => updateStock(product.id, e.target.value)}
                                className="stock-input"
                                min="0"
                                disabled={!product.active}
                              />
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${product.active ? 'status-active' : 'status-inactive'}`}>
                              {product.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="actions">
                            <button 
                              onClick={() => startEditing(product)}
                              className="edit-btn"
                              title="Edit product"
                            >
                              ✏️ Edit
                            </button>
                            
                            {product.active ? (
                              <button 
                                onClick={() => softDeleteProduct(product.id)}
                                className="soft-delete-btn"
                                title="Remove from website (keep in database)"
                              >
                                🚫 Hide
                              </button>
                            ) : (
                              <>
                                <button 
                                  onClick={() => restoreProduct(product.id)}
                                  className="restore-btn"
                                  title="Restore to website"
                                >
                                  🔄 Restore
                                </button>
                                <button 
                                  onClick={() => permanentDeleteProduct(product.id)}
                                  className="permanent-delete-btn"
                                  title="Permanently delete from database"
                                >
                                  🗑️ Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-products">
                    <p>
                      {showInactive 
                        ? 'No inactive products found.' 
                        : 'No active products found. Add your first product above.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === 'orders' && (
          <section className="orders-section">
            <div className="section-header">
              <h2>Manage Orders ({orders.length})</h2>
              <span className="products-count">{orders.length} orders total</span>
            </div>

            <div className="orders-table-container">
              {orders.length > 0 ? (
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order Number</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} className="order-row">
                        <td>
                          <div className="order-number">{order.order_number}</div>
                        </td>
                        <td>
                          <div className="customer-info">
                            <div className="customer-name">{order.customer_name}</div>
                            <div className="customer-email">{order.customer_email}</div>
                            <div className="customer-phone">{order.customer_phone}</div>
                          </div>
                        </td>
                        <td>
                          <div className="order-items-list">
                            {order.item_count} item{order.item_count !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td>
                          <div className="order-total">R{parseFloat(order.total_amount).toFixed(2)}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                              {order.status}
                            </span>
                            <select 
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className="status-select"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                        <td>
                          <div className="order-date">
                            {formatDate(order.order_date)}
                          </div>
                        </td>
                        <td className="actions">
                          <button 
                            onClick={() => viewOrderDetails(order.order_number)}
                            className="edit-btn"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-orders">
                  <p>No orders found. Orders will appear here when customers place them.</p>
                </div>
              )}
            </div>

            {selectedOrder && (
              <div className="order-details-modal">
                <div className="modal-content">
                  <div className="modal-header">
                    <h3>Order Details - {selectedOrder.order.order_number}</h3>
                    <button className="close-modal" onClick={closeOrderDetails}>×</button>
                  </div>
                  
                  <div className="order-details-grid">
                    <div className="order-details-section">
                      <h3>Customer Information</h3>
                      <p><strong>Name:</strong> {selectedOrder.order.customer_name}</p>
                      <p><strong>Email:</strong> {selectedOrder.order.customer_email}</p>
                      <p><strong>Phone:</strong> {selectedOrder.order.customer_phone}</p>
                      <p><strong>Address:</strong> {selectedOrder.order.customer_address}</p>
                      <p><strong>City:</strong> {selectedOrder.order.customer_city}</p>
                      <p><strong>Postal Code:</strong> {selectedOrder.order.customer_postal_code}</p>
                      <p><strong>Province:</strong> {selectedOrder.order.customer_province}</p>
                      {selectedOrder.order.delivery_instructions && (
                        <p><strong>Delivery Instructions:</strong> {selectedOrder.order.delivery_instructions}</p>
                      )}
                    </div>
                    
                    <div className="order-details-section">
                      <h3>Order Information</h3>
                      <p><strong>Order Date:</strong> {formatDate(selectedOrder.order.order_date)}</p>
                      <p><strong>Status:</strong> 
                        <span className={`status-badge ${getStatusBadgeClass(selectedOrder.order.status)}`}>
                          {selectedOrder.order.status}
                        </span>
                      </p>
                      <p><strong>Last Updated:</strong> {formatDate(selectedOrder.order.updated_at)}</p>
                    </div>
                  </div>

                  <div className="order-items-details">
                    <h3>Order Items</h3>
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="order-item-detail">
                        <div>
                          <strong>{item.product_name}</strong>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            {item.product_category} - {item.product_size}
                          </div>
                        </div>
                        <div>
                          R{parseFloat(item.product_price).toFixed(2)} x {item.quantity}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-totals-details">
                    <div className="total-row-detail">
                      <span>Subtotal:</span>
                      <span>R{parseFloat(selectedOrder.order.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="total-row-detail">
                      <span>Shipping Fee:</span>
                      <span>R{parseFloat(selectedOrder.order.shipping_fee).toFixed(2)}</span>
                    </div>
                    <div className="total-row-detail grand-total">
                      <span>Total Amount:</span>
                      <span>R{parseFloat(selectedOrder.order.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminPage;