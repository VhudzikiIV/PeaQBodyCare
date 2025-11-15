import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import CartSidebar from './components/CartSidebar';
import Message from './components/Message';

// Pages
import Home from './pages/Home';
import Products from './pages/products';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminPage from './pages/AdminPage';
import CheckoutPage from './pages/CheckoutPage';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check for existing user session on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('peaqbodycare_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch products when component mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const cartItem = {
      ...product,
      cartId: Date.now() // Unique ID for cart item
    };
    setCart([...cart, cartItem]);
    setMessage(`✅ ${product.name} added to cart!`);
  };

  const removeFromCart = (cartId) => {
    const updatedCart = cart.filter(item => item.cartId !== cartId);
    setCart(updatedCart);
    setMessage('Item removed from cart');
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + parseFloat(item.price), 0).toFixed(2);
  };

  const handleCheckout = () => {
    if (!user) {
      setShowAuth(true);
      setMessage('Please login to checkout');
      return;
    }
    
    if (cart.length === 0) {
      setMessage('Your cart is empty');
      return;
    }

    // Navigate to checkout page
    setCurrentPage('checkout');
    setShowCart(false);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setShowAuth(false);
    setMessage(`Welcome back, ${userData.firstName}!`);
    // Save user to localStorage
    localStorage.setItem('peaqbodycare_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setMessage('Logged out successfully');
    // Remove user from localStorage
    localStorage.removeItem('peaqbodycare_user');
  };

  const clearMessage = () => {
    setMessage('');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home setCurrentPage={setCurrentPage} addToCart={addToCart} />;
      case 'products':
        return <Products products={products} addToCart={addToCart} />;
      case 'about':
        return <About />;
      case 'contact':
        return <Contact />;
      case 'admin':
        return <AdminPage user={user} />;
      case 'checkout':
        return (
          <CheckoutPage 
            cart={cart}
            user={user}
            getTotalPrice={getTotalPrice}
            clearCart={clearCart}
            setCurrentPage={setCurrentPage}
            setMessage={setMessage}
          />
        );
      default:
        return <Home setCurrentPage={setCurrentPage} addToCart={addToCart} />;
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <Header 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        cart={cart}
        setShowAuth={setShowAuth}
        setShowCart={setShowCart}
        onLogout={handleLogout}
      />

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal 
          setShowAuth={setShowAuth}
          setUser={handleLogin}
          setMessage={setMessage}
        />
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <CartSidebar 
          cart={cart}
          removeFromCart={removeFromCart}
          getTotalPrice={getTotalPrice}
          user={user}
          handleCheckout={handleCheckout}
          setShowCart={setShowCart}
        />
      )}

      {/* Main Content */}
      <main className="main">
        {loading && currentPage === 'products' ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : (
          renderPage()
        )}
      </main>

      {/* Footer */}
      <Footer setCurrentPage={setCurrentPage} />

      {/* Message */}
      {message && (
        <Message 
          message={message} 
          clearMessage={clearMessage}
          type={
            message.includes('✅') || 
            message.includes('success') || 
            message.includes('Welcome') ||
            message.includes('Logged out')
              ? 'success' 
              : 'error'
          }
        />
      )}

      {/* Overlay for cart and auth modals */}
      {(showAuth || showCart) && (
        <div 
          className="overlay" 
          onClick={() => { 
            setShowAuth(false); 
            setShowCart(false); 
          }}
        ></div>
      )}
    </div>
  );
}

export default App;