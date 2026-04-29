import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        Care<span>Sphere</span>
      </Link>
      <div className="navbar-links">
        <Link to="/contact" className="nav-link">Contact</Link>
        <Link to="/appointment" className="nav-link">Appointment</Link>
        <Link to="/login" className="nav-link">Login</Link>
        <Link to="/signup" className="nav-link">Sign Up</Link>
        <Link to="/apply" className="nav-link nav-btn">Clinical Programs</Link>
      </div>
    </nav>
  );
};

export default Navbar;
