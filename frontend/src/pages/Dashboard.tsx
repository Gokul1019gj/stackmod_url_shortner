import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { UrlEntry } from '../types';
import { ExternalLink, Trash2, Clock, MousePointer2, BarChart2 } from 'lucide-react';
import UrlStatsModal from '../components/UrlStatsModal';

export default function Dashboard() {
  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsShortCode, setStatsShortCode] = useState<string | null>(null);

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      setLoading(true);
      const data = await api.getMyUrls();
      setUrls(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load URLs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shortCode: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    try {
      await api.deleteUrl(shortCode);
      setUrls(urls.filter(u => u.short_code !== shortCode));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (loading) return <div className="spinner" style={{ margin: '4rem auto' }}></div>;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h2 className="hero-title" style={{ fontSize: '2.5rem', margin: 0 }}>My <span>Links</span></h2>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {urls.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>You haven't shortened any links yet.</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {urls.map((url) => (
            <div key={url.short_code} className="glass-panel url-card">
              <div className="url-card-header">
                <div>
                  <div className="url-card-title">/{url.short_code}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    {url.original_url.length > 40 ? `${url.original_url.substring(0, 40)}...` : url.original_url}
                  </div>
                </div>
                <button className="delete-btn" onClick={() => handleDelete(url.short_code)}>
                  <Trash2 size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
                <a href={url.short_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ flex: 1, padding: '0.6rem', gap: '0.4rem' }}>
                  <ExternalLink size={16} /> Open
                </a>
                <button className="btn btn-secondary" style={{ padding: '0.6rem 0.8rem' }} onClick={() => setStatsShortCode(url.short_code)} title="View Stats">
                  <BarChart2 size={16} />
                </button>
              </div>

              <div className="stats-row" style={{ flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MousePointer2 size={14} />
                    <span>{url.clicks} clicks</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={14} />
                    <span>{new Date(url.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {url.last_accessed && (
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    Last access: {new Date(url.last_accessed).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {statsShortCode && (
        <UrlStatsModal shortCode={statsShortCode} onClose={() => setStatsShortCode(null)} />
      )}
    </div>
  );
}
