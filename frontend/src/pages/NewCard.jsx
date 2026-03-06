import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Phone, ArrowRight } from 'lucide-react';

export default function NewCard() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Customer name is required.'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: name.trim(), phoneNumber: phone.trim() }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      navigate(`/print/${data.cardId}`);
    } catch {
      setError('Failed to create card. Check your connection.');
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          <ChevronLeft size={20} /> Back
        </button>
        <h2>New Card</h2>
      </div>

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-group">
          <label htmlFor="name">
            <User size={14} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            Customer Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah"
            autoFocus
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">
            <Phone size={14} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            Phone Number (optional)
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 07700 900000"
            disabled={loading}
          />
        </div>

        {error && <div className="error-box">{error}</div>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : (
            <>
              Create Card
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
