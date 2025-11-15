import React from 'react';

const Header = ({ currentPage, setCurrentPage, user, cart, setShowAuth, setShowCart, onLogout }) => {
  return (
    <header className="header">
      <div className="container">
        <div className="logo" onClick={() => setCurrentPage('home')}>
          <div className="logo-text">
            <h1>PeaQ Body Care</h1>
            <p>Feel fabulous</p>
          </div>
        </div>
        
        <nav className="nav">
          <button 
            className={currentPage === 'home' ? 'active' : ''}
            onClick={() => setCurrentPage('home')}
          >
            Home
          </button>
          <button 
            className={currentPage === 'products' ? 'active' : ''}
            onClick={() => setCurrentPage('products')}
          >
            Products
          </button>
          <button 
            className={currentPage === 'about' ? 'active' : ''}
            onClick={() => setCurrentPage('about')}
          >
            About
          </button>
          <button 
            className={currentPage === 'contact' ? 'active' : ''}
            onClick={() => setCurrentPage('contact')}
          >
            Contact
          </button>
          
          {/* Admin link - only show for admin users */}
          {user && user.email.endsWith('@admin.com') && (
            <button 
              className={currentPage === 'admin' ? 'active' : ''}
              onClick={() => setCurrentPage('admin')}
            >
              Admin
            </button>
          )}
          
          {user ? (
            <div className="user-section">
              <span className="welcome-user">Welcome, {user.firstName}</span>
              <button 
                className="logout-btn"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              className="login-btn"
              onClick={() => setShowAuth(true)}
            >
              Login
            </button>
          )}
          
          <button className="cart-btn" onClick={() => setShowCart(true)}>
            <span className="cart-icon">🛒</span>
            Cart ({cart.length})
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;