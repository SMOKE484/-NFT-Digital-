import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function getExpiryDate(firstStampAt) {
  if (!firstStampAt) return null;
  return new Date(new Date(firstStampAt).getTime() + EXPIRY_MS);
}

function isExpired(firstStampAt, stamps) {
  if (!firstStampAt || stamps === 0) return false;
  return new Date() > getExpiryDate(firstStampAt);
}

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function Card() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/cards/${cardId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setCard(data);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load card.'); setLoading(false); });
  }, [cardId]);

  async function handleStamp() {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/cards/${cardId}/stamp`, { method: 'POST' });
      const data = await res.json();
      setCard(data.card);
      if (data.freeEarned) {
        setSuccess('🎉 10 stamps! Give the customer their free scoop, then tap Redeem.');
      }
    } catch {
      setError('Failed to add stamp.');
    }
    setBusy(false);
  }

  async function handleRedeem() {
    if (!window.confirm('Confirm: give customer a free ice cream and reset their card?')) return;
    setBusy(true);
    setSuccess('');
    try {
      const res = await fetch(`/api/cards/${cardId}/redeem`, { method: 'POST' });
      const data = await res.json();
      setCard(data);
      setSuccess('✅ Redeemed! Card reset to 0 stamps.');
    } catch {
      setError('Failed to redeem.');
    }
    setBusy(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${card.customerName}'s card? This cannot be undone.`)) return;
    try {
      await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
      navigate('/');
    } catch {
      setError('Failed to delete card.');
    }
  }

  if (loading) return <div className="page"><div className="loading">Loading...</div></div>;

  if (!card) return (
    <div className="page">
      <button className="btn-back" onClick={() => navigate('/')}>← Back</button>
      <div className="error-box">{error || 'Card not found.'}</div>
    </div>
  );

  const expired = isExpired(card.firstStampAt, card.stamps);
  const expiryDate = getExpiryDate(card.firstStampAt);
  const isFull = card.stamps === 10;

  let actionBtn;
  if (isFull) {
    actionBtn = (
      <button className="btn-action redeem" onClick={handleRedeem} disabled={busy}>
        {busy ? 'Processing...' : '🎉 Redeem Free Scoop'}
      </button>
    );
  } else if (expired) {
    actionBtn = (
      <button className="btn-action expired" onClick={handleStamp} disabled={busy}>
        {busy ? 'Processing...' : '⚠️ Expired — Tap to Restart'}
      </button>
    );
  } else {
    actionBtn = (
      <button className="btn-action stamp" onClick={handleStamp} disabled={busy}>
        {busy ? 'Adding...' : '+ Add Stamp'}
      </button>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/')}>← Back</button>
        <span className="card-id-tag">{card.cardId}</span>
      </div>

      <div className="customer-card">
        <div className="customer-name">{card.customerName}</div>
        {card.phoneNumber && <div className="customer-phone">{card.phoneNumber}</div>}
        {card.lastVisit && (
          <div className="customer-visit">Last visit: {formatDate(card.lastVisit)}</div>
        )}
      </div>

      <div className="stamp-grid">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={`stamp-slot${i < card.stamps ? ' filled' : ''}`}>
            {i < card.stamps ? '⭐' : ''}
          </div>
        ))}
      </div>

      <div className="stamp-count">
        <span className="stamps-big">{card.stamps}</span>
        <span className="stamps-label">/10 stamps</span>
      </div>

      {expiryDate && !expired && card.stamps > 0 && (
        <p className="expiry-line">Valid until {formatDate(expiryDate)}</p>
      )}
      {expired && (
        <p className="expiry-line expired">30-day period has expired</p>
      )}

      {success && <div className="success-box">{success}</div>}
      {error && <div className="error-box">{error}</div>}

      {actionBtn}

      <div className="card-footer">
        <span>Total free scoops: <strong>{card.totalRedeemed}</strong></span>
        <button className="btn-delete" onClick={handleDelete}>Delete card</button>
      </div>
    </div>
  );
}
