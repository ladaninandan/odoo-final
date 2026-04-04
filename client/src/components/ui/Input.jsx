import React from 'react';

const Input = ({ type = 'text', placeholder, value, onChange, required = false, className = '', error }) => {
  return (
    <div className="w-full flex flex-col text-left">
      <input 
        type={type} 
        placeholder={placeholder} 
        className={`border p-3 rounded focus:outline-none focus:ring-2 transition-all w-full ${
          error ? "border-red-500 focus:ring-red-400 bg-red-50" : "border-gray-300 focus:ring-blue-500"
        } ${className}`}
        value={value} 
        onChange={onChange} 
        required={required} 
      />
      {error && <span className="text-red-500 text-xs font-semibold mt-1 ml-1 animate-pulse">{error}</span>}
    </div>
  );
};

export default Input;
