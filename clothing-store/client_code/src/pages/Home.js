import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Elevate Your Style</h1>
          <p style={styles.heroSubtitle}>Discover the latest fashion trends with our exclusive collection</p>
          <div style={styles.heroButtons}>
            <Link to="/products" style={styles.primaryButton}>
              Shop Now
            </Link>
            <Link to="/products" style={styles.secondaryButton}>
              New Arrivals
            </Link>
          </div>
        </div>
      </div>
      
      {/* Category Showcase */}
      <div style={styles.container}>
        <div style={styles.sectionTitle}>
          <h2>Shop by Category</h2>
          <p>Browse our diverse collection for every style</p>
        </div>
        
        <div style={styles.categories}>
          <Link to="/products" style={styles.categoryCard}>
            <div style={{...styles.categoryImage, backgroundImage: 'url(https://images.unsplash.com/photo-1617137968427-85924c800a22?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80)'}}></div>
            <div style={styles.categoryOverlay}>
              <h3 style={styles.categoryTitle}>Men</h3>
              <span style={styles.categoryLink}>Shop Collection</span>
            </div>
          </Link>
          
          <Link to="/products" style={styles.categoryCard}>
            <div style={{...styles.categoryImage, backgroundImage: 'url(https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80)'}}></div>
            <div style={styles.categoryOverlay}>
              <h3 style={styles.categoryTitle}>Women</h3>
              <span style={styles.categoryLink}>Shop Collection</span>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Features Section */}
      <div style={styles.featuresSection}>
        <div style={styles.container}>
          <div style={styles.features}>
            <div style={styles.feature}>
              <div style={styles.featureIcon}>
                <span style={styles.icon}>✓</span>
              </div>
              <h3 style={styles.featureTitle}>Premium Quality</h3>
              <p style={styles.featureDesc}>We use the finest fabrics and materials for lasting comfort and style.</p>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureIcon}>
                <span style={styles.icon}>⚡</span>
              </div>
              <h3 style={styles.featureTitle}>Fast Shipping</h3>
              <p style={styles.featureDesc}>Get your favorite pieces delivered to your doorstep in 2-4 business days.</p>
            </div>
            
            <div style={styles.feature}>
              <div style={styles.featureIcon}>
                <span style={styles.icon}>↩</span>
              </div>
              <h3 style={styles.featureTitle}>Easy Returns</h3>
              <p style={styles.featureDesc}>Not satisfied? Return your items hassle-free within 30 days.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trending Section */}
    
    </div>
  );
};

const styles = {
  hero: {
    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    height: '600px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    marginBottom: '60px'
  },
  heroContent: {
    textAlign: 'center',
    maxWidth: '800px',
    padding: '0 20px'
  },
  heroTitle: {
    fontSize: '3.5rem',
    fontWeight: '700',
    marginBottom: '20px',
    letterSpacing: '1px'
  },
  heroSubtitle: {
    fontSize: '1.2rem',
    marginBottom: '40px',
    lineHeight: '1.6'
  },
  heroButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap'
  },
  primaryButton: {
    backgroundColor: '#2a9d8f',
    color: 'white',
    padding: '14px 30px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    transition: 'all 0.3s ease',
    border: '2px solid #2a9d8f'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: 'white',
    padding: '14px 30px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    transition: 'all 0.3s ease',
    border: '2px solid white'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    marginBottom: '80px'
  },
  sectionTitle: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  categories: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    flexWrap: 'wrap'
  },
  categoryCard: {
    position: 'relative',
    width: '100%',
    maxWidth: '500px',
    height: '300px',
    overflow: 'hidden',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'white'
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: 'transform 0.5s ease'
  },
  categoryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'background-color 0.3s ease'
  },
  categoryTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    marginBottom: '10px'
  },
  categoryLink: {
    fontSize: '1rem',
    fontWeight: '500',
    textDecoration: 'underline'
  },
  featuresSection: {
    backgroundColor: '#f8f9fa',
    padding: '80px 0',
    marginBottom: '80px'
  },
  features: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '30px',
    flexWrap: 'wrap'
  },
  feature: {
    flex: '1 1 300px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  featureIcon: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    backgroundColor: '#2a9d8f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    color: 'white'
  },
  icon: {
    fontSize: '1.8rem'
  },
  featureTitle: {
    fontSize: '1.3rem',
    marginBottom: '15px',
    color: '#333'
  },
  featureDesc: {
    color: '#666',
    lineHeight: '1.6'
  },
  trendingBanner: {
    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(https://images.unsplash.com/photo-1523359346063-d879354c0ea5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    height: '400px',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  trendingContent: {
    padding: '50px',
    maxWidth: '600px',
    color: 'white'
  },
  trendingTitle: {
    fontSize: '2.5rem',
    fontWeight: '700',
    marginBottom: '20px'
  },
  trendingDesc: {
    fontSize: '1.1rem',
    marginBottom: '30px',
    lineHeight: '1.6'
  }
};

export default Home; 