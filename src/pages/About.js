import React from 'react';
import PageHeader from './PageHeader';

const About = () => {
  return (
    <div className="about-page">
      <PageHeader title="About PeaQ Body Care" />
      
      <div className="about-content">
        <div className="founder-section">
          <div className="founder-image">
            <img 
              src={`http://localhost:5000/images/logo.jpeg`} 
              alt="PeaQ Body Care Logo"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="image-placeholder" style={{display: 'none'}}>
              PeaQ Body Care Logo
            </div>
          </div>
          <div className="founder-info">
            <h2>Tumelo Mukhola</h2>
            <h3>Founder & CEO</h3>
            <p>
              "With a passion for luxury and a vision to make everyone feel fabulous, 
              I founded PeaQ Body Care to bring you the finest perfumes that celebrate 
              your unique essence. Our journey began with a simple belief: every person 
              deserves to experience the confidence and joy that comes from wearing a 
              signature scent that truly represents them."
            </p>
            <p>
              "At PeaQ, we carefully curate each fragrance to ensure it meets our 
              high standards of quality, longevity, and uniqueness. We believe that 
              a great perfume is not just an accessory, but an extension of your 
              personality and style."
            </p>
            <p>
              "Our mission is to help you discover scents that make you feel confident, 
              empowered, and truly fabulous. Welcome to the PeaQ family!"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;