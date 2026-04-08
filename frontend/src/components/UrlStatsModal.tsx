import { useEffect, useState } from 'react';
import { Globe2, MousePointer2, Users, X } from 'lucide-react';

// The shape coming from GET /api/urls/:short_code/stats
interface StatsResponse {
  short_code: string;
  original_url: string;
  user_id: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  analytics: {
    total_clicks: number;
    unique_visitors: number;
    clicks_by_country: { country: string; clicks: number }[];
  };
}

interface Props {
  shortCode: string;
  onClose: () => void;
}

export default function UrlStatsModal({ shortCode, onClose }: Props) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`http://localhost:8081/api/urls/${shortCode}/stats`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch stats');
        setStats(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    })();
  }, [shortCode]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-card">
        <div className="modal-header">
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3rem' }}>
            Stats for <span style={{ color: 'var(--brand-secondary)' }}>/{shortCode}</span>
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={22} /></button>
        </div>

        {loading && <div className="spinner" style={{ margin: '2rem auto' }}></div>}
        {error && <div className="error-msg">{error}</div>}

        {stats && (
          <>
            {/* Original URL */}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', wordBreak: 'break-all' }}>
              {stats.original_url}
            </p>

            {/* Top metrics */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div className="stat-block">
                <MousePointer2 size={20} style={{ color: 'var(--brand-secondary)', marginBottom: '0.5rem' }} />
                <span className="stat-block-value">{stats.analytics.total_clicks.toLocaleString()}</span>
                <span className="stat-block-label">Total Clicks</span>
              </div>
              <div className="stat-block">
                <Users size={20} style={{ color: 'var(--brand-secondary)', marginBottom: '0.5rem' }} />
                <span className="stat-block-value">{stats.analytics.unique_visitors.toLocaleString()}</span>
                <span className="stat-block-label">Unique Visitors</span>
              </div>
              <div className="stat-block">
                <Globe2 size={20} style={{ color: 'var(--brand-secondary)', marginBottom: '0.5rem' }} />
                <span className="stat-block-value">{stats.analytics.clicks_by_country.length}</span>
                <span className="stat-block-label">Countries</span>
              </div>
            </div>

            {/* Clicks by country */}
            {stats.analytics.clicks_by_country.length > 0 && (
              <>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Clicks by Country
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {stats.analytics.clicks_by_country.map(({ country, clicks }) => {
                    const maxClicks = stats.analytics.clicks_by_country[0].clicks;
                    const pct = Math.round((clicks / maxClicks) * 100);
                    return (
                      <div key={country} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ minWidth: '90px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{country}</span>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: '8px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))',
                            borderRadius: 4,
                            transition: 'width 0.6s ease',
                          }} />
                        </div>
                        <span style={{ minWidth: '36px', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>{clicks}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {stats.analytics.clicks_by_country.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No click data yet.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
