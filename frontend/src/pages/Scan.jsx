import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { ChevronLeft, ScanLine, Loader2 } from 'lucide-react';

export default function Scan() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const doneRef = useRef(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

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

            setProcessing(true);

            try {
              const cardRes = await fetch(`/api/cards/${decoded}`);
              const card = await cardRes.json();

              if (card.error) {
                navigate(`/card/${decoded}`);
                return;
              }

              if (card.stamps === 10) {
                navigate(`/card/${decoded}`, { state: { needsRedeem: true } });
                return;
              }

              const stampRes = await fetch(`/api/cards/${decoded}/stamp`, { method: 'POST' });
              const stampData = await stampRes.json();

              navigate(`/card/${decoded}`, {
                state: { autoStamped: true, freeEarned: stampData.freeEarned, card: stampData.card },
              });
            } catch {
              navigate(`/card/${decoded}`);
            }
          },
          () => {}
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
        <button className="btn-back" onClick={() => navigate('/')}>
          <ChevronLeft size={20} /> Back
        </button>
        <h2>Scan Card</h2>
      </div>

      <p className="scan-hint">
        <ScanLine size={15} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
        Point camera at QR code — stamp added automatically
      </p>

      {error ? (
        <div className="error-box">{error}</div>
      ) : processing ? (
        <div className="scan-processing">
          <Loader2 size={28} className="spin" />
          Adding stamp...
        </div>
      ) : (
        <div className="qr-reader-wrap">
          <div id="qr-reader" />
        </div>
      )}
    </div>
  );
}
