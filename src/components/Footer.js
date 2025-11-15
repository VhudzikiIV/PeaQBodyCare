import React from 'react';

const Footer = ({ setCurrentPage }) => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>PeaQ Body Care</h3>
            <p>Making you feel fabulous with every scent</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <button onClick={() => setCurrentPage('home')}>Home</button>
            <button onClick={() => setCurrentPage('products')}>Products</button>
            <button onClick={() => setCurrentPage('about')}>About</button>
            <button onClick={() => setCurrentPage('contact')}>Contact</button>
          </div>
          <div className="footer-section">
            <h4>Contact Info</h4>
            <p>📞 079 698 9762</p>
            <p>✉️ info@peaqbodycare.com</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 PeaQ Body Care. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;