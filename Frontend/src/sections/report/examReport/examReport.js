import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import "../../../Styles/Report/ExamReport.css";
import searchIcon from "../../../assets/icons/searchButton.png";
 // 🔴 UPDATE PATH IF NEEDED

function ExamReport() {
  const [expandedTable, setExpandedTable] = useState(null);
  const [examData, setExamData] = useState([]);
  const [search, setSearch] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const pdfRef = useRef(null);

  // ===============================
  // FETCH DATA
  // ===============================
  useEffect(() => {
    fetchExamData();
  }, []);

  const fetchExamData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/examReport");
      setExamData(response.data.data);
    } catch (error) {
      console.error("❌ Error fetching exam data", error);
    }
  };

  // ===============================
  // FILTER DATA
  // ===============================
  const filteredData = examData.filter((item) =>
    item.group_name.toLowerCase().includes(search.toLowerCase())
  );

  // ===============================
  // GROUP DATA
  // ===============================
  const groupedByInstrument = filteredData.reduce((acc, item) => {
    const key = item.group_name.split(" ")[0];

    if (!acc[key]) acc[key] = [];

    acc[key].push({
      grade: item.grade_name || "Not Set",
      date: item.exam_date,
      time: `${item.start_time} - ${item.end_time}`,
      group: item.group_name,
    });

    return acc;
  }, {});

  // ===============================
  // GENERATE PDF
  // ===============================
  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);

    setTimeout(async () => {
      const element = pdfRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save("Exam_Report.pdf");

      setIsGeneratingPDF(false);
    }, 300);
  };

  const showOnlyTable = expandedTable !== null;

  return (
    <div className="exam-report-container">
      {/* ================= PDF CONTENT ================= */}
      <div ref={pdfRef}>

        {/* ===== PDF HEADER (ONLY IN PDF) ===== */}
        {isGeneratingPDF && (
          <div className="pdf-header">
            <div className="pdf-header-top">
              <div className="pdf-logo-section">
                <img src="/logo192.png" alt="logo" className="pdf-logo" />
                <div>
                  <h1 className="pdf-title">ARADANA</h1>
                  <p className="pdf-subtitle">Music Academy</p>
                </div>
              </div>

              <div className="pdf-date">
                Date: {new Date().toLocaleDateString("en-GB")}
              </div>
            </div>

            <hr className="pdf-divider" />

            <h2 className="pdf-report-title">Exam Report</h2>
          </div>
        )}

        {/* ===== BACK BUTTON ===== */}
        {showOnlyTable && (
          <div className="back-button" onClick={() => setExpandedTable(null)}>
            ← Back
          </div>
        )}

        {/* ===== SEARCH (NOT IN PDF) ===== */}
        {!showOnlyTable && !isGeneratingPDF && (
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

        {/* ===== TABLE SECTIONS ===== */}
        {Object.keys(groupedByInstrument).map(
          (instrument) =>
            (expandedTable === null || expandedTable === instrument) && (
              <ExamSection
                key={instrument}
                title={instrument}
                data={groupedByInstrument[instrument]}
                isExpanded={expandedTable === instrument}
                onExpand={() => setExpandedTable(instrument)}
              />
            )
        )}
      </div>
      {/* ================= END PDF CONTENT ================= */}

      <div className="generate-btn-container">
        <button className="generate-btn" onClick={handleGeneratePDF}>
          Generate PDF
        </button>
      </div>
    </div>
  );
}

// ===============================
// TABLE COMPONENT
// ===============================
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
