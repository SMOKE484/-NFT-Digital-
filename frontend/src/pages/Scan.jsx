import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

export default function Scan() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const doneRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const qrcode = new Html5Qrcode('qr-reader');
    scannerRef.current = qrcode;

    async function start() {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setError('No camera found on this device.');
          return;
        }

        // Prefer back/environment camera
        const cam =
          cameras.find(
            (c) =>
              c.label.toLowerCase().includes('back') ||
              c.label.toLowerCase().includes('rear') ||
              c.label.toLowerCase().includes('environment')
          ) || cameras[cameras.length - 1];

        await qrcode.start(
          cam.id,
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decoded) => {
            if (doneRef.current) return;
            doneRef.current = true;
            try { await qrcode.stop(); } catch (_) {}
            navigate(`/card/${decoded}`);
          },
          () => {} // ignore per-frame errors
        );
      } catch {
        setError('Camera access denied. Please allow camera permission and try again.');
      }
    }

    start();

    return () => {
      doneRef.current = true;
      scannerRef.current?.stop().catch(() => {});
    };
  }, [navigate]);

  return (
    <div className="page scan-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/')}>← Back</button>
        <h2>Scan Card</h2>
      </div>

      <p className="scan-hint">Point camera at the QR code on the customer's card</p>

      {error ? (
        <div className="error-box">{error}</div>
      ) : (
        <div className="qr-reader-wrap">
          <div id="qr-reader" />
        </div>
      )}
    </div>
  );
}
