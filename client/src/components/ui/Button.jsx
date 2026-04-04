import React from 'react';

const Button = ({ children, type = 'button', onClick, className = '', variant = 'primary', disabled = false }) => {
  
  const baseStyles = `p-3 rounded transition-colors shadow-md w-full flex justify-center items-center font-semibold ${
    disabled ? "opacity-60 cursor-not-allowed" : "transform hover:scale-105"
  }`;
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    success: "bg-green-600 text-white hover:bg-green-700",
    danger: "bg-red-500 text-white hover:bg-red-600",
    outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
  };

  return (
    <button 
      type={type} 
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
