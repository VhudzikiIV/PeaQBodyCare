import React from 'react';

const CartSidebar = ({ cart, removeFromCart, getTotalPrice, user, handleCheckout, setShowCart }) => {
  const getTotalWithShipping = () => {
    const subtotal = parseFloat(getTotalPrice());
    const shipping = 50.00;
    return (subtotal + shipping).toFixed(2);
  };

  const getSubtotal = () => {
    return parseFloat(getTotalPrice()).toFixed(2);
  };

  return (
    <div className="cart-sidebar">
      <div className="cart-header">
        <h3>Your Cart ({cart.length})</h3>
        <button className="close-cart" onClick={() => setShowCart(false)}>×</button>
      </div>
      <div className="cart-items">
        {cart.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <p className="empty-cart-subtitle">Add some products to get started!</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.cartId} className="cart-item">
              <div className="cart-item-info">
                <span className="item-name">{item.name}</span>
                <span className="item-size">{item.size}</span>
                <span className="item-category">{item.category}</span>
              </div>
              <div className="cart-item-price">
                <span>R{item.price}</span>
                <button 
                  onClick={() => removeFromCart(item.cartId)}
                  className="remove-item-btn"
                  title="Remove item"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {cart.length > 0 && (
        <div className="cart-total">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>R{getSubtotal()}</span>
          </div>
          <div className="total-row">
            <span>Shipping:</span>
            <span>R50.00</span>
          </div>
          <div className="total-row grand-total">
            <strong>Total:</strong>
            <strong>R{getTotalWithShipping()}</strong>
          </div>
          <button 
            className="checkout-btn" 
            onClick={handleCheckout}
            title={user ? 'Proceed to checkout' : 'Login to checkout'}
          >
            {user ? 'Proceed to Checkout' : 'Login to Checkout'}
          </button>
          {!user && (
            <p className="checkout-note">
              Please login to complete your purchase
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CartSidebar;