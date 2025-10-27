import React from 'react';
import { Outlet } from 'react-router-dom';

function Exam() {
  return (
    <div className="Exam">
      <Outlet /> 
    </div>
  );
}

export default Exam;