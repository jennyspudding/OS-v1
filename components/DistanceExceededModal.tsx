'use client';

import React from 'react';

interface DistanceExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DistanceExceededModal: React.FC<DistanceExceededModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#FFF0E5', // Assuming a light peach/cream background for the theme
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%',
        border: '2px solid #8B5A3C', // Assuming a brown border for the theme
      }}>
        <h2 style={{ 
          color: '#8B5A3C', // Assuming a brown text color for headings
          marginBottom: '20px',
          fontSize: '24px'
        }}>
          Jarak Pengiriman Terlalu Jauh
        </h2>
        <p style={{ 
          color: '#6D4C41', // Assuming a darker brown for body text
          marginBottom: '25px',
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          Mohon maaf, jarak pengiriman melebihi batas maksimal 70km dari lokasi toko kami. Silakan pilih alamat pengiriman yang lebih dekat.
        </p>
        <button
          onClick={onClose}
          style={{
            backgroundColor: '#8B5A3C', // Brown button
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#734d32')} // Darker brown on hover
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#8B5A3C')}
        >
          Mengerti
        </button>
      </div>
    </div>
  );
};

export default DistanceExceededModal; 