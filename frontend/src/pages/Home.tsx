import { useState } from 'react';
import { api } from '../services/api';
import type { ShortenResponse } from '../types';
import { Copy, Check, Zap, BarChart2 } from 'lucide-react';
import UrlStatsModal from '../components/UrlStatsModal';

export default function Home() {
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShortenResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [statsShortCode, setStatsShortCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      setLoading(true);
      const data = await api.shorten({
        original_url: url,
        custom_alias: customAlias || undefined,
        expires_at: expiresAt || undefined,
      });
      setResult(data);
      setUrl('');
      setCustomAlias('');
      setExpiresAt('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (result?.short_url) {
      await navigator.clipboard.writeText(result.short_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="main-content">
      <h1 className="hero-title">
        Shorten Your <span>Links.</span><br />
        Expand Your <span>Reach.</span>
      </h1>
      <p className="hero-subtitle">
        Create powerful, memorable short links instantly. A faster, more intelligent way to share the websites you care about.
      </p>

      <div className="glass-panel">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          {/* Main URL Input and Submit Button */}
          <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flexGrow: 1 }}>
              <input
                type="url"
                className="form-input"
                placeholder="Paste your long URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: '0 2rem' }}
            >
              {loading ? <div className="spinner"></div> : <><Zap size={18} /> Shorten</>}
            </button>
          </div>

          {/* Optional Settings Row */}
          <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Custom Alias (Optional)"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                disabled={loading}
                style={{ fontSize: '1rem', padding: '1rem' }}
              />
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '0 1rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
                Expires:
              </span>
              <input
                type="date"
                className="form-input"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                onClick={(e) => {
                  try {
                    (e.target as HTMLInputElement).showPicker();
                  } catch {
                    // Ignored if browser does not support showPicker
                  }
                }}
                min={new Date().toISOString().split('T')[0]}
                disabled={loading}
                style={{ 
                  fontSize: '1rem', 
                  padding: '1rem 0', 
                  color: expiresAt ? 'inherit' : 'var(--text-secondary)',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  flexGrow: 1,
                  cursor: 'pointer',
                  colorScheme: 'dark'
                }}
              />
            </div>
          </div>
        </form>
        {error && <div className="error-msg">{error}</div>}

        {result && (
          <div className="result-card">
            <div className="result-row">
              <span className="result-label">Original URL</span>
              <span className="result-value" style={{ opacity: 0.8 }}>
                {result.original_url.length > 50 ? `${result.original_url.substring(0, 50)}...` : result.original_url}
              </span>
            </div>
            <div className="result-row">
              <span className="result-label">Shortened URL</span>
              <span className="result-value short">
                <a href={result.short_url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                  {result.short_url}
                </a>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                className="copy-btn"
                onClick={copyToClipboard}
                style={{ flex: 1, padding: '0.9rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
              >
                {copied ? <><Check size={18} /> Copied!</> : <><Copy size={18} /> Copy Short Link</>}
              </button>
              <button
                className="copy-btn"
                onClick={() => setStatsShortCode(result.short_code)}
                style={{ padding: '0.9rem 1.2rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
                title="View stats"
              >
                <BarChart2 size={18} /> Stats
              </button>
            </div>
          </div>
        )}
      </div>

      {statsShortCode && (
        <UrlStatsModal shortCode={statsShortCode} onClose={() => setStatsShortCode(null)} />
      )}
    </div>
  );
}
