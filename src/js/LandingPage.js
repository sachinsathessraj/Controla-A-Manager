import React, { useEffect, useRef, useState } from "react";
import "../css/LandingPage.css";
import { useNavigate } from "react-router-dom";
import controlaLogo from "../images/controla-logo.png";
import productMossImg from "../images/product-moss.png";
import productBubblesImg from "../images/product-bubbles.png";

export default function LandingPage() {
  const navigate = useNavigate();
  const [floatY, setFloatY] = useState(0);
  useEffect(() => {
    let frame;
    let t = 0;
    function animate() {
      setFloatY(10 * Math.sin(t));
      t += 0.03;
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className="landing-root">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="navbar-logo">
          <img src={controlaLogo} alt="Logo" className="navbar-logo-img" />
        </div>
        <div className="navbar-right">
          <button className="navbar-login-btn" onClick={() => navigate('/')}>Home</button>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Upgrade Your Listings with A+ Content</h1>
          <p>
            Create rich, engaging product detail pages that boost conversions and build brand trust.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '24px' }}>
            <button className="cta-main" onClick={() => navigate("/get-started")}>Get Started with A+ Content</button>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="cta-main" style={{ background: '#000', color: '#fff' }} onClick={() => navigate("/dashboard")}>Main Image</button>
              <button className="cta-main" style={{ background: '#4a6cf7', color: '#fff' }} onClick={() => navigate("/generate-brief")}>Generate Brief</button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', justifyContent: 'center', marginTop: 40, marginLeft: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 60 }}>
            <img
              src={productBubblesImg}
              alt="A+ Content Example 2"
              className="hero-img"
              style={{ transform: `translateY(${-floatY}px)`, transition: 'transform 0.1s' }}
            />
          </div>
        </div>
      </section>
    </div>
  );
} 