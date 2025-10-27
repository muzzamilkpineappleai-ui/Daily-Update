import React from 'react';
import '../Styles/FormLabel.css';

const FormLabel = ({ htmlFor, label, isRequired, className = 'input-label' }) => {
  return (
    <label htmlFor={htmlFor} className={`form-label ${className}`}>
      {label}
      {isRequired && <span className="form-label-required">*</span>}
    </label>
  );
};

export default FormLabel;