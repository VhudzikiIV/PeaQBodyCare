import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from './PageHeader';

const API_BASE = 'http://localhost:5000/api';

const Products = ({ addToCart, user }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const categories = ['All', 'For Her', 'For Him', 'New Arrivals'];

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products when category changes
  useEffect(() => {
    let filtered = products;
    
    // Filter by category
    if (activeCategory !== 'All') {
      filtered = filtered.filter(product => product.category === activeCategory);
    }
    
    setFilteredProducts(filtered);
  }, [activeCategory, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/products`);
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
      
      // Fallback to empty array if API fails
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  if (loading) {
    return (
      <div className="products-page">
        <PageHeader 
          title="Our Perfumes"
          subtitle="Discover your signature scent"
        />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-page">
        <PageHeader 
          title="Our Perfumes"
          subtitle="Discover your signature scent"
        />
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchProducts} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <PageHeader 
        title="Our Perfumes"
        subtitle="Discover your signature scent"
      />

      {/* Category Filter */}
      <div className="category-filter">
        {categories.map(category => (
          <button
            key={category}
            className={activeCategory === category ? 'active' : ''}
            onClick={() => handleCategoryChange(category)}
          >
            {category}
            {category !== 'All' && (
              <span className="category-count">
                ({products.filter(p => p.category === category).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Products Content */}
      <div className="products-content">
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <div className="no-products-icon">🔍</div>
            <h3>No products found</h3>
            <p>
              {activeCategory !== 'All' 
                ? `No products available in ${activeCategory} category.`
                : 'No products available at the moment.'
              }
            </p>
            {activeCategory !== 'All' && (
              <button 
                onClick={() => setActiveCategory('All')}
                className="view-all-btn"
              >
                View All Products
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Products Count */}
            <div className="products-meta">
              <span className="products-count">
                Showing {filteredProducts.length} of {products.length} product{products.length !== 1 ? 's' : ''}
                {activeCategory !== 'All' && ` in ${activeCategory}`}
              </span>
            </div>

            {/* Products Grid */}
            <div className="products-grid">
              {filteredProducts.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image">
                    <img 
                      src={`http://localhost:5000${product.image_url}`} 
                      alt={product.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="image-placeholder" style={{display: 'none'}}>
                      {product.name}
                    </div>
                    
                    {/* Stock Badge */}
                    {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                      <div className="product-badges">
                        <span className="badge low-stock">Low Stock</span>
                      </div>
                    )}
                    {product.stock_quantity === 0 && (
                      <div className="product-badges">
                        <span className="badge out-of-stock">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="category">{product.category}</p>
                    <p className="size">{product.size}</p>
                    <p className="description">{product.description}</p>
                    
                    <div className="product-meta">
                      <div className="price">R{product.price}</div>
                      {product.stock_quantity > 0 && (
                        <div className="stock-info">
                          {product.stock_quantity <= 10 ? 
                            `Only ${product.stock_quantity} left!` : 
                            'In Stock'
                          }
                        </div>
                      )}
                    </div>
                    
                    <button 
                      className={`add-to-cart ${product.stock_quantity === 0 ? 'disabled' : ''}`}
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock_quantity === 0}
                      title={product.stock_quantity === 0 ? 'Out of stock' : `Add ${product.name} to cart`}
                    >
                      {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Products;