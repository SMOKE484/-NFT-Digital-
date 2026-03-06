import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
const logo = '/nft-logo.png';

export default function PrintCard() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cards/${cardId}`)
      .then((r) => r.json())
      .then((data) => { setCard(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [cardId]);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `NFT Digital Hub Loyalty Card — ${cardId}`,
          text: `Loyalty card for ${card?.customerName}. Card ID: ${cardId}`,
        });
      } catch (_) {}
    } else {
      alert('Take a screenshot of the QR code below to print and hand to the customer.');
    }
  }

  if (loading) return <div className="page"><div className="loading">Loading...</div></div>;

  return (
    <div className="page print-page">
      <div className="page-header" style={{ width: '100%' }}>
        <button className="btn-back" onClick={() => navigate('/')}>← Home</button>
        <h2>Print Card</h2>
      </div>

      <div className="print-note">
        🖨️ Print this card and hand it to the customer. You won't need this screen again.
      </div>

      <div className="qr-card">
        <img src={logo} alt="NFT Digital Hub" className="qr-logo-print" />
        <QRCodeSVG value={cardId} size={210} level="M" fgColor="#1B4FD8" />
        <div className="qr-name">{card?.customerName}</div>
        <div className="qr-id">{cardId}</div>
        <div className="qr-tagline">Collect 10 stamps — earn a FREE reward!</div>
      </div>

      <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleShare}>
        📤 Share / Screenshot
      </button>

      <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/')}>
        Done — Go to Home
      </button>
    </div>
  );
}
