import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../Styles/Exam/studentSelection.css';
import CloseIcon from '../../assets/icons/Close.png'
import GroupName from '../../assets/icons/GroupName.png';

const StudentSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialFormData = location.state?.formData || {};
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [groupName, setGroupName] = useState('');

  const students = [
    { id: 1, name: 'Sushan Zar Ameth Srii ', course: 'Piano', grade: '02', image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' },
    { id: 2, name: 'Sushan Zar Ameth Srii', course: 'Piano', grade: '02', image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' },
    { id: 3, name: 'Sushan Zar Ameth Srii ', course: 'Piano', grade: '05', image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' },
    { id: 4, name: 'Sushan Zar Ameth Shi', course: 'Piano', grade: '03', image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' },
    { id: 5, name: 'Sushan Zar Ameth Srii', course: 'Piano', grade: '02', image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' },
    { id: 6, name: 'Sushan Zar Ameth Srii', course: 'Piano', grade: '05', image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' },
    { id: 7, name: 'Sushan Zar Ameth Srii', course: 'Violin', grade: '02', image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' },
    { id: 8, name: 'Sushan Zar Ameth Srii', course: 'Violin', grade: '01', image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' },
    { id: 9, name: 'Sushan Zar Ameth Srii ', course: 'Violin', grade: '02', image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' },
  ];

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (courseFilter === '' || student.course === courseFilter) &&
    (gradeFilter === '' || student.grade === gradeFilter)
  );

  const handleCheckboxChange = (id) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(studentId => studentId !== id) : [...prev, id]
    );
  };

  const handleDeleteStudent = (id) => {
    setSelectedStudents(prev => prev.filter(studentId => studentId !== id));
  };

  const handleNext = () => {
    setShowConfirmation(true);
  };

  const handleCreate = () => {
    const selectedStudentNames = selectedStudents.map(id =>
      students.find(student => student.id === id).name
    );
    navigate('/exam', { state: { formData: { ...initialFormData, groupName, selectedStudents: selectedStudentNames }, openModal: true } });
  };

  return (
    <div className="student-selection-container">
      {!showConfirmation ? (
        <>
          <div className="student-header">
            <div className="student-search-container">
              <input
                type="text"
                className="student-search-input"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="student-filters">
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
              >
                <option value="">All Courses</option>
                <option value="Piano">Piano</option>
                <option value="Violin">Violin</option>
              </select>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
              >
                <option value="">All Grades</option>
                <option value="02">02</option>
                <option value="05">05</option>
              </select>
            </div>
          </div>
          <div className="exam-student-cards">
            {filteredStudents.map(student => (
              <div key={student.id} className="exam-student-card">
                <img src={student.image} alt={student.name} className="exam-student-image" />
                <div className="student-info">
                  <p>{student.name}</p>
                </div>
                <p>Course: {student.course}</p>
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={() => handleCheckboxChange(student.id)}
                />                
              </div>
            ))}
          </div>
          <button
            className="next-btn"
            disabled={selectedStudents.length === 0}
            onClick={handleNext}
          >
            Next
          </button>
        </>
      ) : (
        <>
          <div className="form-group">
            <div className='exam-group-name'>
              <img src={GroupName} alt="Search" className="exam-groupname-img" />            
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
              />
              </div>
          </div>
          <div className="exam-student-cards">
            {selectedStudents.map(id => {
              const student = students.find(s => s.id === id);
              return (
                <div key={id} className="exam-student-card">
                  <button
                    className="stu-delete-btn"
                    onClick={() => handleDeleteStudent(id)}
                  >
                    <img src={CloseIcon} alt='close' className='exam-close-icon'/>
                  </button>                    
                  <img src={student.image} alt={student.name} className="exam-student-image" />
                  <div className="student-info">
                    <p>{student.name}</p>
                  </div>
                  <p>Course: {student.course}</p>
                </div>
              );
            })}
          </div>
          <button
            className="create-btn"
            disabled={!groupName}
            onClick={handleCreate}
          >
            Create
          </button>
        </>
      )}
    </div>
  );
};

export default StudentSelection;