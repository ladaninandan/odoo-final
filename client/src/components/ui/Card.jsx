import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white p-8 rounded-2xl shadow-lg w-96 transform transition-all duration-300 hover:shadow-xl ${className}`}>
      {children}
    </div>
  );
};

export default Card;
