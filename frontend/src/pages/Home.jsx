import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Plus, Users, Gift, ChevronRight } from 'lucide-react';
const logo = '/nft-logo.png';

const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function getExpiryDate(firstStampAt) {
  if (!firstStampAt) return null;
  return new Date(new Date(firstStampAt).getTime() + EXPIRY_MS);
}

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function Home() {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cards')
      .then((r) => r.json())
      .then((data) => { setCards(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalRedeemed = cards.reduce((sum, c) => sum + (c.totalRedeemed || 0), 0);

  return (
    <div className="page">
      <div className="home-header">
        <img src={logo} alt="NFT Digital Hub" className="home-logo" />
        <h1>NFT Digital Hub</h1>
        <p className="home-subtitle">Loyalty Card System</p>
        <div className="stats">
          <div className="stat">
            <span className="stat-value">{cards.length}</span>
            <span className="stat-label">
              <Users size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
              Cards
            </span>
          </div>
          <div className="stat">
            <span className="stat-value">{totalRedeemed}</span>
            <span className="stat-label">
              <Gift size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
              Rewards Given
            </span>
          </div>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => navigate('/scan')}>
          <Camera size={18} />
          Scan Card
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/new')}>
          <Plus size={18} />
          New Card
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="card-list">
          {cards.length === 0 && (
            <div className="empty">No cards yet. Tap "New Card" to create the first one.</div>
          )}
          {cards.map((card) => {
            const now = new Date();
            const expiry = getExpiryDate(card.firstStampAt);
            const expired = card.stamps > 0 && card.firstStampAt && now > expiry;
            const full = card.stamps === 10;

            return (
              <div
                key={card.cardId}
                className="card-item"
                onClick={() => navigate(`/card/${card.cardId}`)}
              >
                <div className="card-item-top">
                  <span className="card-name">{card.customerName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`badge ${full ? 'badge-free' : expired ? 'badge-expired' : 'badge-active'}`}>
                      {full ? 'FREE!' : expired ? 'Expired' : `${card.stamps}/10`}
                    </span>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                </div>
                <div className="stamp-mini">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={`stamp-dot${i < card.stamps ? ' filled' : ''}`} />
                  ))}
                </div>
                <div className="card-item-bottom">
                  <span className="card-id-small">{card.cardId}</span>
                  <span className="card-meta">
                    {expiry && !expired && card.stamps > 0
                      ? `Valid until ${formatDate(expiry)}`
                      : card.lastVisit
                      ? `Last visit: ${formatDate(card.lastVisit)}`
                      : 'No visits yet'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
