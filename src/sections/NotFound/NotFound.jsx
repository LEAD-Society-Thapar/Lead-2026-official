import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import StarfieldBackground from './StarfieldBackground';
import './NotFound.css';

const NotFound = () => {
  return (
    <main className="notfound-container">
      <StarfieldBackground />
      <div className="notfound-content">
        <h1 className="notfound-title" data-text="404">404</h1>
        <h2 className="notfound-subtitle">Looks like you landed somewhere wrong.</h2>
        <p className="notfound-text">
          The page you're looking for doesn't exist or has been moved to another universe.
        </p>
        <Link to="/" className="notfound-button">
          <ArrowLeft size={18} />
          <span>Go Back Home</span>
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
