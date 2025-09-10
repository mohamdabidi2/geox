import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content" style={modalStyle}>
        <div className="modal-header" style={headerStyle}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={closeButtonStyle} aria-label="Close modal">
            &times;
          </button>
        </div>
        <div className="modal-body" style={bodyStyle}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Simple inline styles for demonstration
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle = {
  background: '#fff',
  borderRadius: '8px',
  maxWidth: '500px',
  width: '90%',
  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
  overflow: 'hidden',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px',
  borderBottom: '1px solid #eee',
  background: '#f9f9f9',
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  lineHeight: 1,
};

const bodyStyle = {
  padding: '16px',
};

export default Modal;
