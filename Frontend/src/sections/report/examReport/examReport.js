import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../Styles/Report/ExamReport.css';
import searchIcon from '../../../assets/icons/searchButton.png'; 

function ExamReport() {
  const [expandedTable, setExpandedTable] = useState(null);
  const [examData, setExamData] = useState([]); // <-- data from backend
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchExamData();
  }, []);

  const fetchExamData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/exams");
      setExamData(response.data.data);  // <-- backend data format
    } catch (error) {
      console.error("❌ Error fetching exam data", error);
    }
  };

  const filteredData = examData.filter((item) =>
    item.group_name.toLowerCase().includes(search.toLowerCase())
  );

  const groupedByInstrument = filteredData.reduce((acc, item) => {
    const key = item.group_name.split(" ")[0]; // Piano Group → Piano
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      grade: item.Grade.grade_name,
      date: item.exam_date,
      time: `${item.start_time} - ${item.end_time}`,
      group: item.group_name,
    });
    return acc;
  }, {});

  const showOnlyTable = expandedTable !== null;

  return (
    <div className="exam-report-container">
      {showOnlyTable && (
        <div className="back-button" onClick={() => setExpandedTable(null)}>
          ← Back
        </div>
      )}

      {!showOnlyTable && (
        <div className="search-container">
          <input
            type="text"
            placeholder="Search..."
            className="search-bar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <img src={searchIcon} alt="search" className="search-icon-right" />
        </div>
      )}

      {Object.keys(groupedByInstrument).map((instrument) => (
        (expandedTable === null || expandedTable === instrument) && (
          <ExamSection
            key={instrument}
            title={instrument}
            data={groupedByInstrument[instrument]}
            isExpanded={expandedTable === instrument}
            onExpand={() => setExpandedTable(instrument)}
          />
        )
      ))}

      <div className="generate-btn-container">
        <button className="generate-btn">Generate</button>
      </div>
    </div>
  );
}

function ExamSection({ title, data, isExpanded, onExpand }) {
  const visibleRows = isExpanded ? data : data.slice(0, 3);

  return (
    <div className="exam-section">
      <div className="exam-table">
        <h3>{title}</h3>
        <table>
          <thead>
            <tr>
              <th>Grade</th>
              <th>Date</th>
              <th>Time</th>
              <th>Group Name</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, idx) => (
              <tr key={idx}>
                <td>{row.grade}</td>
                <td>{row.date}</td>
                <td>{row.time}</td>
                <td>{row.group}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isExpanded && data.length > 3 && (
        <div className="view-more" onClick={onExpand}>
          View More
        </div>
      )}
    </div>
  );
}

export default ExamReport;
