import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const CheckoutPage = ({ cart, user, getTotalPrice, clearCart, setCurrentPage, setMessage }) => {
  const [orderData, setOrderData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    province: '',
    deliveryInstructions: ''
  });
  const [loading, setLoading] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [orderNumber, setOrderNumber] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!orderData.phone || !orderData.address || !orderData.city || !orderData.postalCode || !orderData.province) {
        setMessage('❌ Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Create order payload with proper product data
      const orderNumber = `PEAQ-${Date.now()}`;
      setOrderNumber(orderNumber);
      
      const orderPayload = {
        customer: orderData,
        items: cart.map(item => ({
          name: item.name || 'Unknown Product',
          category: item.category || 'General',
          size: item.size || 'Standard',
          price: item.price || 0
        })),
        subtotal: getTotalPrice(),
        shipping: 50.00,
        total: (parseFloat(getTotalPrice()) + 50).toFixed(2),
        orderNumber: orderNumber,
        orderDate: new Date().toISOString()
      };

      console.log('Submitting order:', orderPayload);

      // Send order to backend
      const response = await axios.post(`${API_BASE}/orders`, orderPayload);
      
      // Get WhatsApp link
      const whatsappResponse = await axios.get(`${API_BASE}/orders/whatsapp/${orderNumber}`);
      
      setWhatsappUrl(whatsappResponse.data.whatsappUrl);
      setShowWhatsAppModal(true);
      
    } catch (error) {
      console.error('Order error:', error);
      
      if (error.response) {
        setMessage(`❌ ${error.response.data.message || 'Error placing order'}`);
      } else if (error.request) {
        // Server is not responding, simulate success for demo
        const demoOrderNumber = `PEAQ-${Date.now()}`;
        const demoMessage = generateDemoWhatsAppMessage(orderData, cart, getTotalPrice(), demoOrderNumber);
        const demoWhatsappUrl = `https://wa.me/27796989762?text=${demoMessage}`;
        
        setWhatsappUrl(demoWhatsappUrl);
        setOrderNumber(demoOrderNumber);
        setShowWhatsAppModal(true);
      } else {
        setMessage('❌ Error placing order. Please try again.');
      }
      setLoading(false);
    }
  };

  // Fixed WhatsApp message generation
  const generateDemoWhatsAppMessage = (customer, cartItems, subtotal, orderNumber) => {
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
    cartItems.forEach((item, index) => {
      message += `${index + 1}. ${item.name || 'Product'} - ${item.size || 'Size'} - R${item.price || '0'}\n`;
    });
    
    message += `\n*Order Summary:*\n`;
    message += `Subtotal: R${parseFloat(subtotal).toFixed(2)}\n`;
    message += `Shipping: R50.00\n`;
    message += `*Total: R${(parseFloat(subtotal) + 50).toFixed(2)}*\n\n`;
    
    if (customer.deliveryInstructions) {
      message += `*Delivery Instructions:*\n`;
      message += `${customer.deliveryInstructions}\n\n`;
    }
    
    message += `Order Date: ${new Date().toLocaleString()}\n`;
    message += `Payment Method: Cash on Delivery`;
    
    return encodeURIComponent(message);
  };

  const handleWhatsAppSuccess = () => {
    setShowWhatsAppModal(false);
    setMessage(`🎉 Order #${orderNumber} placed successfully! We will contact you shortly on WhatsApp to confirm your order.`);
    clearCart();
    setCurrentPage('home');
    setLoading(false);
  };

  const handleWhatsAppSkip = () => {
    setShowWhatsAppModal(false);
    setMessage(`🎉 Order #${orderNumber} placed successfully! Please contact us on WhatsApp at 0796989762 to confirm your order.`);
    clearCart();
    setCurrentPage('home');
    setLoading(false);
  };

  const openWhatsApp = () => {
    window.open(whatsappUrl, '_blank');
    handleWhatsAppSuccess();
  };

  const provinces = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 
    'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'
  ];

  if (cart.length === 0) {
    return (
      <div className="checkout-page">
        <div className="empty-checkout">
          <div className="empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some products to your cart before checking out.</p>
          <button 
            onClick={() => setCurrentPage('products')}
            className="continue-shopping-btn"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="whatsapp-modal-overlay">
          <div className="whatsapp-modal">
            <div className="whatsapp-modal-content">
              <div className="whatsapp-header">
                <h3>🎉 Order Successful!</h3>
                <p>Confirm your order #{orderNumber} via WhatsApp to complete the process</p>
              </div>
              
              <div className="whatsapp-info">
                <div className="whatsapp-step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <strong>Click the button below</strong>
                    <p>This will open WhatsApp with your order details pre-filled</p>
                  </div>
                </div>
                
                <div className="whatsapp-step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <strong>Send the message</strong>
                    <p>Review the order details and send the message to confirm</p>
                  </div>
                </div>
                
                <div className="whatsapp-step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <strong>Wait for confirmation</strong>
                    <p>We'll respond within 24 hours to confirm your order</p>
                  </div>
                </div>
              </div>

              <div className="whatsapp-actions">
                <button 
                  className="whatsapp-btn-primary"
                  onClick={openWhatsApp}
                >
                  📱 Open WhatsApp to Confirm Order
                </button>
                
                <button 
                  className="whatsapp-btn-secondary"
                  onClick={handleWhatsAppSkip}
                >
                  I'll Contact WhatsApp Later
                </button>
                
                <div className="whatsapp-note">
                  <p>
                    <strong>Note:</strong> Your order is saved. Please contact us on 
                    <strong> 079 698 9762</strong> to complete your order.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Checkout</h1>
          <p>Complete your order with delivery information</p>
        </div>

        <div className="checkout-content">
          {/* Order Summary */}
          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="order-items">
              {cart.map(item => (
                <div key={item.cartId} className="order-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-size">{item.size}</span>
                    <span className="item-category">{item.category}</span>
                  </div>
                  <span className="item-price">R{item.price}</span>
                </div>
              ))}
            </div>
            
            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>R{getTotalPrice()}</span>
              </div>
              <div className="total-row">
                <span>Delivery Fee:</span>
                <span>R50.00</span>
              </div>
              <div className="total-row grand-total">
                <strong>Total:</strong>
                <strong>R{(parseFloat(getTotalPrice()) + 50).toFixed(2)}</strong>
              </div>
            </div>

            <div className="delivery-info">
              <h3>📱 Order Confirmation</h3>
              <p>After placing your order, you'll be redirected to WhatsApp to confirm your order details with us.</p>
              <div className="delivery-features">
                <div className="feature">
                  <span className="feature-icon">💬</span>
                  <span>WhatsApp Confirmation</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">⏱️</span>
                  <span>Quick Response</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">💰</span>
                  <span>Cash on Delivery</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="checkout-form-section">
            <h2>Delivery Details</h2>
            <form onSubmit={handleSubmitOrder} className="checkout-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={orderData.firstName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={orderData.lastName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={orderData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="your@email.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={orderData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="071 234 5678"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Delivery Address *</label>
                <textarea
                  name="address"
                  value={orderData.address}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  placeholder="Enter your full delivery address including street name, number, and complex if applicable"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={orderData.city}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Johannesburg"
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={orderData.postalCode}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 2000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Province *</label>
                <select
                  name="province"
                  value={orderData.province}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Province</option>
                  {provinces.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Delivery Instructions (Optional)</label>
                <textarea
                  name="deliveryInstructions"
                  value={orderData.deliveryInstructions}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Any special delivery instructions, gate codes, or landmarks..."
                />
              </div>

              <div className="order-notes">
                <h3>📝 Order Process</h3>
                <ul>
                  <li>After submitting, you'll be redirected to WhatsApp</li>
                  <li>Send the pre-filled message to confirm your order</li>
                  <li>We'll respond within 24 hours to confirm delivery</li>
                  <li>Payment is cash on delivery only</li>
                </ul>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="place-order-btn"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Processing Order...
                  </>
                ) : (
                  `Place Order - R${(parseFloat(getTotalPrice()) + 50).toFixed(2)}`
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;