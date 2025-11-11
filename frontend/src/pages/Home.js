import React, { useState, useEffect } from 'react';

const Home = ({ setCurrentPage, addToCart }) => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    // Simulate fetching featured products
    const products = [
      {
        id: 1,
        name: 'Velvet Torrida',
        category: 'For Her',
        size: '50ml',
        price: 119.99,
        image_url: '/images/1762590894043.jpeg',
        description: 'Luxurious velvet scent with warm notes',
        featured: true
      },
      {
        id: 2,
        name: 'Royal For Him',
        category: 'For Him',
        size: '30ml',
        price: 49.99,
        image_url: '/images/1762590894062.jpeg',
        description: 'Royal masculine fragrance',
        featured: true
      },
      {
        id: 3,
        name: 'Golden Moment',
        category: 'New Arrivals',
        size: '30ml',
        price: 49.99,
        image_url: '/images/1762590894035.jpeg',
        description: 'Your golden moment awaits',
        featured: true
      },
      {
        id: 4,
        name: 'Good Girl Inspired',
        category: 'For Her',
        size: '30ml',
        price: 49.99,
        image_url: '/images/1762590894051.jpeg',
        description: 'Elegant and sophisticated fragrance',
        featured: true
      },
      {
        id: 5,
        name: 'Velvet For Him',
        category: 'For Him',
        size: '50ml',
        price: 119.99,
        image_url: '/images/1762590894089.jpeg',
        description: 'Velvet masculine scent',
        featured: true
      },
      {
        id: 6,
        name: 'Travel Size',
        category: 'New Arrivals',
        size: '30ml',
        price: 49.99,
        image_url: '/images/1762590894080.jpeg',
        description: 'New travel size convenience',
        featured: true
      }
    ];
    setFeaturedProducts(products);
  }, []);

  const categories = ['All', 'For Her', 'For Him', 'New Arrivals'];

  const filteredProducts = activeCategory === 'All' 
    ? featuredProducts 
    : featuredProducts.filter(product => product.category === activeCategory);

  const handleAddToCart = (product) => {
    addToCart(product);
    // You can add a toast notification here if needed
  };

  return (
    <div className="home-page">
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="banner-content">
          <div className="banner-text">
            <h1>Discover Your Signature Scent</h1>
            <p>Luxury perfumes crafted to make you feel extraordinary</p>
            <div className="banner-actions">
              <button 
                className="cta-primary"
                onClick={() => setCurrentPage('products')}
              >
                Shop All Products
              </button>
              <button 
                className="cta-secondary"
                onClick={() => setCurrentPage('about')}
              >
                Our Story
              </button>
            </div>
          </div>
          <div className="banner-image">
            <img 
              src="/images/1762590894035.jpeg" 
              alt="Premium Perfumes"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-section">
        <div className="section-header">
          <h2>Featured Products</h2>
          <p>Discover our most popular fragrances</p>
        </div>

        {/* Quick Category Navigation */}
        <div className="quick-categories">
          {categories.map(category => (
            <button
              key={category}
              className={`category-pill ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Products Grid */}
        <div className="featured-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="featured-product-card">
              <div className="product-image">
                <img 
                  src={`http://localhost:5000${product.image_url}`} 
                  alt={product.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="image-placeholder">
                  {product.name}
                </div>
                <div className="product-badge">{product.category}</div>
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-meta">
                  <span className="size">{product.size}</span>
                  <span className="price">R{product.price}</span>
                </div>
                <button 
                  className="add-to-cart-btn full-width"
                  onClick={() => handleAddToCart(product)}
                >
                  Add to Cart - R{product.price}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View All CTA */}
        <div className="view-all-cta">
          <button 
            className="view-all-btn"
            onClick={() => setCurrentPage('products')}
          >
            View All Products
          </button>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="brand-story">
        <div className="story-content">
          <div className="story-text">
            <h2>Crafted with Passion</h2>
            <p>
              At PeaQ Body Care, we believe every scent tells a story. Our perfumes are 
              carefully crafted to evoke emotions and create lasting memories. From the 
              first spritz to the final dry-down, experience luxury redefined.
            </p>
            <div className="story-stats">
              <div className="stat">
                <span className="stat-number">50+</span>
                <span className="stat-label">Unique Scents</span>
              </div>
              <div className="stat">
                <span className="stat-number">1000+</span>
                <span className="stat-label">Happy Customers</span>
              </div>
              <div className="stat">
                <span className="stat-number">Premium</span>
                <span className="stat-label">Quality</span>
              </div>
            </div>
          </div>
          <div className="story-image">
            <img 
              src="/images/logo.jpeg" 
              alt="PeaQ Body Care Story"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;