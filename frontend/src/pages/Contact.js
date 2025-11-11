import React from 'react';
import PageHeader from './PageHeader';

const Contact = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
    e.target.reset();
  };

  return (
    <div className="contact-page">
      <PageHeader 
        title="Contact Us"
        subtitle="We'd love to hear from you"
      />
      
      <div className="contact-content">
        <div className="contact-info">
          <h2>Get In Touch</h2>
          <div className="contact-item">
            <strong>Phone:</strong>
            <span>079 698 9762</span>
          </div>
          <div className="contact-item">
            <strong>Email:</strong>
            <span>info@peaqbodycare.com</span>
          </div>
          <div className="contact-item">
            <strong>Business Hours:</strong>
            <span>Monday - Friday: 9:00 AM - 6:00 PM</span>
            <span>Saturday: 10:00 AM - 4:00 PM</span>
            <span>Sunday: Closed</span>
          </div>
          <div className="contact-item">
            <strong>Location:</strong>
            <span>South Africa</span>
          </div>
        </div>
        
        <div className="contact-form">
          <h2>Send us a Message</h2>
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Your Email" required />
            <input type="tel" placeholder="Your Phone" />
            <textarea placeholder="Your Message" rows="5" required></textarea>
            <button type="submit">Send Message</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;