import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { markAttendance, resolveQRCode } from '../../integration/attendanceApi';
import '../../Styles/Attendance/QRScanner.css';

function QRScanner({ onAttendanceMarked, stopScanning }) {
  const [error, setError] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const html5QrCode = useRef(null);
  const isStarting = useRef(false);
  const lastScan = useRef({ text: null, time: 0 });
  const debounceTime =100; 

  const startScanner = async () => {
    if (isStarting.current) return;
    isStarting.current = true;

    const qrReaderElement = document.getElementById('qr-reader');
    if (!qrReaderElement) {
      setError('QR scanner not initialized properly.');
      isStarting.current = false;
      return;
    }

    if (!html5QrCode.current) {
      html5QrCode.current = new Html5Qrcode('qr-reader');
    }

    try {
      await html5QrCode.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: window.innerWidth * 0.7, height: window.innerWidth * 0.7 } },
        async (decodedText) => {
          const now = Date.now();
          if (
            decodedText === lastScan.current.text &&
            now - lastScan.current.time < debounceTime
          ) {
            return;
          }

          lastScan.current = { text: decodedText, time: now };
          console.log('QR detected:', decodedText);
          setScanResult(decodedText);
          setError(null);

          try {
            const result = await resolveQRCode(decodedText);
            if (result.user?.id) {
              setUserDetails(result.user);

              try {
                await markAttendance(result.user.id);
                console.log('Attendance marked successfully');
                onAttendanceMarked?.();
              } catch (markErr) {
                if (markErr.response?.status === 409) {
                  setError('Attendance already marked for this student today.');
                } else {
                  setError('Failed to mark attendance. Try again.');
                }
              }
            } else {
              setError('Invalid QR code.');
            }
          } catch (err) {
            console.error('QR processing error:', err);
            setError('Failed to process QR code.');
          }
        }
      );

      console.log('Scanner started');
      setError(null);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Unable to access camera. Please check permissions.');
    } finally {
      isStarting.current = false;
    }
  };

const stopScanner = async () => {
  if (!html5QrCode.current) return;

  try {
    console.log('Stopping QR scanner...');

    // Step 1: Stop the scanner (stops camera + tracks)
    await html5QrCode.current.stop().catch((err) => {
      console.warn('Error during stop():', err);
    });

    // Step 2: Give the browser a moment to fully release the stream
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Step 3: ONLY clear the DOM *after* everything is stopped
    // But do NOT call .clear() if the element is about to be unmounted anyway!
    // Instead, just remove the video element manually and safely

    const qrReaderElement = document.getElementById('qr-reader');
    if (qrReaderElement) {
      qrReaderElement.innerHTML = ''; 
    }

    const video = document.querySelector('#qr-reader video');
    if (video?.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    html5QrCode.current = null;

    console.log('Scanner stopped and cleaned safely');
  } catch (err) {
    console.warn('Error in stopScanner:', err);
  }
};

useEffect(() => {
  let isMounted = true;

  const runScanner = async () => {
    await new Promise((res) => setTimeout(res, 300));
    if (isMounted && !stopScanning) {
      await startScanner();
    }
  };

  runScanner();

  return () => {
    isMounted = false;
    stopScanner();
  };
}, [stopScanning]);

  return (
    <div className="qr-scanner-container">
      <h2>Scan Student QR Code</h2>

      <div id="qr-reader" className="qr-reader"></div>

      {error && (
        <p className="error-message">{error}</p>
      )}

      {scanResult && userDetails && (
        <div className="scan-result">
          <h3>Scanned Student Details</h3>
          <p>
            <strong>Name:</strong> {userDetails.first_name} {userDetails.last_name}
          </p>
          <p>
            <strong>Student No:</strong> {userDetails.student_no || 'N/A'}
          </p>
          <p className="success-message">Attendance processed successfully!</p>
        </div>
      )}
    </div>
  );
}

export default QRScanner;