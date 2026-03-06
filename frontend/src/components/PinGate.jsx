import { useState, useEffect } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

const SESSION_KEY = 'nft_pin_ok';

export default function PinGate({ children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true); // checking IP on load
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Already unlocked this session
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      setUnlocked(true);
      setChecking(false);
      return;
    }

    // Check if device is on the allowed IP (store WiFi)
    fetch('/api/check-access')
      .then((r) => r.json())
      .then((data) => {
        if (data.allowed) {
          sessionStorage.setItem(SESSION_KEY, 'true');
          setUnlocked(true);
        }
      })
      .catch(() => {}) // on error, fall through to PIN screen
      .finally(() => setChecking(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pin.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        setUnlocked(true);
      } else {
        setError('Incorrect PIN. Try again.');
        setPin('');
      }
    } catch {
      setError('Connection error. Try again.');
    }
    setLoading(false);
  }

  if (checking) return null; // brief blank while checking IP
  if (unlocked) return children;

  return (
    <div className="pin-page">
      <div className="pin-card">
        <img src="/nft-logo.png" alt="NFT Digital Hub" className="pin-logo" />
        <h1 className="pin-title">NFT Digital Hub</h1>
        <p className="pin-subtitle">Staff Access Only</p>
        <form onSubmit={handleSubmit} className="pin-form">
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            autoFocus
            disabled={loading}
            className="pin-input"
          />
          {error && <div className="error-box">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading
              ? <><ShieldCheck size={18} /> Checking...</>
              : <><Lock size={18} /> Unlock</>}
          </button>
        </form>
      </div>
    </div>
  );
}
