import React, { useState } from "react";
import '../../../Styles/Report/resultReport.css';
import viewIcon from "../../../assets/icons/view.png";
import closeIcon from "../../../assets/icons/Close.png";
import searchIcon from "../../../assets/icons/searchButton.png"; 

const StudentResults = () => {
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("");
  const [grade, setGrade] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const students = [
    { name: "S.Sharma", result: "A" },
    { name: "T.Harish", result: "A" },
    { name: "P.Rihaan", result: "B" },
    { name: "Sivash", result: "A" },
    { name: "S.Sharma", result: "C" },
    { name: "S.Sharma", result: "C" },
    { name: "S.Sharma", result: "B" },
    { name: "S.Sharma", result: "A" },
  ];

  const studentResults = [
    { course: "Violin", grade: "01", result: "A" },
    { course: "Piano", grade: "01", result: "A" },
    { course: "Keyboard", grade: "01", result: "C" },
    { course: "Violin", grade: "02", result: "B" },
    { course: "Piano", grade: "02", result: "A" },
  ];

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <div className="filters">

        <div className="search-container">
          <input
            type="text"
            placeholder="Search..."
            className="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <img src={searchIcon} alt="search" className="search-icon-right" />
        </div>

        <div className="dropdowns">
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="dropdown"
          >
            <option value="">Course</option>
            <option value="Piano">Piano</option>
            <option value="Guitar">Guitar</option>
            <option value="Violin">Violin</option>
          </select>

          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="dropdown"
          >
            <option value="">Grade</option>
            <option value="01">01</option>
            <option value="02">02</option>
            <option value="03">03</option>
          </select>
        </div>
      </div>

      <div className="info">
        {course && <p>Course : {course}</p>}
        {grade && <p>Grade : {grade}</p>}
      </div>

      <div className="table-container">
        <table>
          <thead >
            <tr>
              <th>Name</th>
              <th>Result</th>
              <th className="view-th">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, index) => (
              <tr key={index}>
                <td>{student.name}</td>
                <td className="table-result">{student.result}</td>
                <td className="icon-cell">
                  <img
                    src={viewIcon}
                    alt="View"
                    className="icon"
                    onClick={() => setSelectedStudent(student)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="button-container">
        <button className="generate-btn">Generate</button>
      </div>

      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Result Details</h3>

              <img
                src={closeIcon}
                alt="Close"
                className="close-icon"
                onClick={() => setSelectedStudent(null)}
              />
            </div>

            <p className="student-name">
              Name : <strong>{selectedStudent.name}</strong>
            </p>

            <div className="modal-table">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Grade</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {studentResults.map((res, idx) => (
                    <tr key={idx}>
                      <td>{res.course}</td>
                      <td>{res.grade}</td>
                      <td>{res.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-button-container">
              <button className="generate-btn">Generate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResults;
