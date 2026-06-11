import React, { useRef, useEffect, useState } from 'react';
import CloseIcon from '../../assets/icons/Close.png';
import AradanaIcon from '../../assets/images/Aradana-logo.png';
import '../../Styles/Students-css/IDcardModal.css';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import { getUserQR } from '../../integration/studentAPI';

const IDCardModal = ({ isOpen, onClose, userData }) => {
  const cardRef = useRef();
  const modalRef = useRef();

  const [scaleFactor, setScaleFactor] = useState(1);

  const [qrImage, setQrImage] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userData?.id) return;

    const loadQR = async () => {
      setQrLoading(true);
      const qr = await getUserQR(userData.id);
      setQrImage(qr); 
      setQrLoading(false);
    };

    loadQR();
  }, [isOpen, userData?.id]);


  useEffect(() => {
    const adjustModalScale = () => {
      if (!modalRef.current) return;

      const modal = modalRef.current;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const modalRect = modal.getBoundingClientRect();
      const modalWidth = modalRect.width;
      const modalHeight = modalRect.height;

      const scaleX = Math.min(1, viewportWidth * 0.9 / modalWidth);
      const scaleY = Math.min(1, viewportHeight * 0.9 / modalHeight);
      const scale = Math.min(scaleX, scaleY);

      setScaleFactor(scale);

      if (viewportWidth <= 480) {
        modal.style.transform = `scale(${scale})`;
        modal.style.transformOrigin = 'center center';
      } else {
        modal.style.transform = 'scale(1)';
      }
    };

    if (isOpen) adjustModalScale();
    window.addEventListener('resize', adjustModalScale);

    return () => window.removeEventListener('resize', adjustModalScale);
  }, [isOpen]);

  if (!isOpen || !userData) return null;

  const validQR = qrImage && qrImage.startsWith("data:image");

  const qrCodeSrc = validQR ? qrImage : AradanaIcon;

  const isStudent = userData.role_name?.toLowerCase() === 'student';
  const fields = isStudent
    ? [
        { label: 'Student ID', value: userData.student_no || 'N/A' },
        { label: 'Full Name', value: `${userData.salutation || ''} ${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'N/A' },
        { label: 'Role', value: userData.role_name || 'N/A' },
        { label: 'Course', value: userData.course || 'N/A' },
        { label: 'Branch', value: userData.branch || 'N/A' },
      ]
    : [
        { label: 'Full Name', value: `${userData.salutation || ''} ${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'N/A' },
        { label: 'Role', value: userData.role_name || 'N/A' },
      ];

  const handleDownloadPDF = () => {
    const input = cardRef.current;
    const modal = modalRef.current;

    const images = input.querySelectorAll('img');
    const loadPromises = Array.from(images).map((img) => {
      return new Promise((resolve, reject) => {
        if (img.complete && img.naturalHeight !== 0) resolve();
        img.onload = () => resolve();
        img.onerror = () => reject(`Image failed: ${img.src}`);
      });
    });

    Promise.all(loadPromises)
      .then(() => {
        const originalTransform = modal.style.transform;
        modal.style.transform = 'scale(1)';

        const rect = input.getBoundingClientRect();
        const modalWidth = rect.width / scaleFactor;
        const modalHeight = rect.height / scaleFactor;

        const pdfWidth = Math.max(480, modalWidth);
        const pdfHeight = Math.max(280, modalHeight);

        html2canvas(input, {
          scale: 3,
          useCORS: true,
          backgroundColor: '#1F6978',
        }).then((canvas) => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [pdfWidth, pdfHeight],
          });

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

          const fileName = isStudent
            ? `${userData.student_no}_id_card.pdf`
            : `${userData.id}_id_card.pdf`;

          pdf.save(fileName);
          modal.style.transform = originalTransform;
        });
      })
      .catch((err) => {
        console.error('Image load error:', err);
        alert('Failed to generate ID card PDF.');
      });
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1001 }}>
      <div className="id-card-modal" ref={modalRef}>
        <button className="id-close-btn" onClick={onClose}>
          <img src={CloseIcon} alt="Close" />
        </button>

        <div className="id-card-content-wrapper" ref={cardRef}>
          <div className="id-card-header">
            <img src={AradanaIcon} alt="Logo" className="id-card-logo" />
            <h2 className="id-card-heading">ARADANA MUSIC ACADEMY</h2>
          </div>

          <div className="id-card-line"></div>

          <div className="id-card-content">
            <div className="id-card-left">
              <img
                src={
                  userData.photo_url ||
                  'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp'
                }
                alt="Profile"
                className="id-card-profile-pic"
                onError={(e) => {
                  e.target.src =
                    'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp';
                }}
              />
            </div>

            <div className="id-card-middle">
              <div className="id-card-info">
                {fields.map((field, index) => (
                  <div className="id-card-row" key={index}>
                    <span className="id-card-label">{field.label}</span>
                    <span className="id-card-separater">:</span>
                    <span className="id-card-value">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="id-card-right">
              {qrLoading ? (
                <p style={{ fontSize: '12px', color: '#fff' }}>Loading QR...</p>
              ) : (
                <img
                  src={qrCodeSrc}
                  alt="QR Code"
                  className="id-card-qr-code"
                  style={{ width: '100px', height: '100px', border: '1px solid black' }}
                />
              )}
            </div>
          </div>
        </div>

        <button className="id-download-btn" onClick={handleDownloadPDF}>
          Download
        </button>
      </div>
    </div>
  );
};

export default IDCardModal;
