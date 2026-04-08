import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import type { TopUrlEntry, DailyTrendEntry, BotSuspectEntry, CountryClickEntry } from '../types';
import { AlertTriangle, TrendingUp, Link as LinkIcon, Shield, Calendar, RefreshCw, Globe } from 'lucide-react';

type ActiveTab = 'top-urls' | 'trend' | 'countries' | 'bot-report';

interface DateRange { from: string; to: string; }

// Returns YYYY-MM-DD for today offset by `days`
function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const PRESETS = [
  { label: 'Last 7 days',  from: () => isoDate(-7),  to: () => isoDate() },
  { label: 'Last 30 days', from: () => isoDate(-30), to: () => isoDate() },
  { label: 'Last 90 days', from: () => isoDate(-90), to: () => isoDate() },
];

//─── Date Range Picker sub-component ─────────────────────────────────────────
function DateRangeFilter({
  range,
  onChange,
}: {
  range: DateRange;
  onChange: (r: DateRange) => void;
}) {
  const [local, setLocal] = useState(range);

  const apply = () => onChange(local);

  return (
    <div className="date-range-bar">
      {PRESETS.map((p) => {
        const pFrom = p.from();
        const pTo = p.to();
        const isActive = local.from === pFrom && local.to === pTo;
        return (
          <button
            key={p.label}
            className={`preset-btn ${isActive ? 'active' : ''}`}
            onClick={() => {
              const next = { from: pFrom, to: pTo };
              setLocal(next);
              onChange(next);
            }}
          >
            {p.label}
          </button>
        );
      })}
      <div className="date-inputs">
        <div className="date-input-group">
          <Calendar size={14} />
          <input
            type="date"
            className="date-input"
            value={local.from}
            max={local.to}
            onChange={(e) => setLocal((r) => ({ ...r, from: e.target.value }))}
          />
        </div>
        <span style={{ color: 'var(--text-secondary)' }}>→</span>
        <div className="date-input-group">
          <Calendar size={14} />
          <input
            type="date"
            className="date-input"
            value={local.to}
            min={local.from}
            max={isoDate()}
            onChange={(e) => setLocal((r) => ({ ...r, to: e.target.value }))}
          />
        </div>
        <button className="apply-btn" onClick={apply}>
          <RefreshCw size={14} /> Apply
        </button>
      </div>
    </div>
  );
}

//─── Main Analytics page ──────────────────────────────────────────────────────
export default function Analytics() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('top-urls');

  // Top URLs state
  const [topRange, setTopRange]     = useState<DateRange>({ from: isoDate(-7), to: isoDate() });
  const [topUrls, setTopUrls]       = useState<TopUrlEntry[]>([]);
  const [topLoading, setTopLoading] = useState(false);
  const [topError, setTopError]     = useState<string | null>(null);

  // Click Trend state
  const [trendRange, setTrendRange]     = useState<DateRange>({ from: isoDate(-30), to: isoDate() });
  const [trend, setTrend]               = useState<DailyTrendEntry[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError]     = useState<string | null>(null);

  // Bot Report state
  const [botReport, setBotReport]     = useState<BotSuspectEntry[]>([]);
  const [botLoading, setBotLoading]   = useState(false);
  const [botError, setBotError]       = useState<string | null>(null);

  // Countries state
  const [countryRange, setCountryRange]     = useState<DateRange>({ from: isoDate(-30), to: isoDate() });
  const [countries, setCountries]           = useState<CountryClickEntry[]>([]);
  const [countryLoading, setCountryLoading] = useState(false);
  const [countryError, setCountryError]     = useState<string | null>(null);

  const loadTopUrls = useCallback(async (range: DateRange) => {
    setTopLoading(true);
    setTopError(null);
    try {
      const data = await api.getTopUrls(range.from, range.to);
      setTopUrls(data);
    } catch (err: unknown) {
      setTopError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setTopLoading(false);
    }
  }, []);

  const loadTrend = useCallback(async (range: DateRange) => {
    setTrendLoading(true);
    setTrendError(null);
    try {
      const data = await api.getDailyTrend(range.from, range.to);
      setTrend(data);
    } catch (err: unknown) {
      setTrendError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setTrendLoading(false);
    }
  }, []);

  const loadBotReport = useCallback(async () => {
    setBotLoading(true);
    setBotError(null);
    try {
      const data = await api.getBotReport();
      setBotReport(data);
    } catch (err: unknown) {
      setBotError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setBotLoading(false);
    }
  }, []);

  const loadCountries = useCallback(async (range: DateRange) => {
    setCountryLoading(true);
    setCountryError(null);
    try {
      const data = await api.getGlobalCountries(range.from, range.to);
      setCountries(data);
    } catch (err: unknown) {
      setCountryError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setCountryLoading(false);
    }
  }, []);

  // Load on tab switch
  useEffect(() => {
    if (activeTab === 'top-urls') loadTopUrls(topRange);
    if (activeTab === 'trend')    loadTrend(trendRange);
    if (activeTab === 'countries') loadCountries(countryRange);
    if (activeTab === 'bot-report') loadBotReport();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'top-urls',   label: 'Top URLs',     icon: <LinkIcon size={16} /> },
    { id: 'trend',      label: 'Click Trend',  icon: <TrendingUp size={16} /> },
    { id: 'countries',  label: 'By Country',   icon: <Globe size={16} /> },
    { id: 'bot-report', label: 'Bot Report',   icon: <Shield size={16} /> },
  ];

  const formatChangePct = (pct: number | null) => {
    if (pct === null) return <span style={{ color: 'var(--text-secondary)' }}>—</span>;
    const isPositive = pct >= 0;
    return (
      <span style={{ color: isPositive ? '#00d2ff' : '#ff4d4f', fontWeight: 600 }}>
        {isPositive ? '+' : ''}{pct}%
      </span>
    );
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="hero-title" style={{ fontSize: '2.5rem', margin: 0 }}>
          Analytics <span>Dashboard</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
          Track your link performance, click trends, and detect anomalies.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding: '0.6rem 1.4rem', fontSize: '0.9rem', gap: '0.4rem' }}
          >
            {tab.icon}{tab.label}
            {tab.id === 'bot-report' && !botLoading && botReport.length > 0 && (
              <span style={{
                background: '#ff4d4f',
                color: '#fff',
                borderRadius: '9999px',
                padding: '0.1rem 0.5rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                marginLeft: '0.2rem',
              }}>{botReport.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Top URLs ─────────────────────────────────────────────────── */}
      {activeTab === 'top-urls' && (
        <div>
          <DateRangeFilter
            range={topRange}
            onChange={(r) => { setTopRange(r); loadTopUrls(r); }}
          />
          <div className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <LinkIcon size={20} style={{ color: 'var(--brand-secondary)' }} />
              <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: '1.2rem' }}>
                Top 10 Most-Clicked URLs
              </h3>
            </div>

            {topLoading && <div className="spinner" style={{ margin: '2rem auto' }}></div>}
            {topError && <div className="error-msg">{topError}</div>}
            {!topLoading && !topError && topUrls.length === 0 && (
              <p style={{ color: 'var(--text-secondary)' }}>No click data in this date range.</p>
            )}
            {!topLoading && !topError && topUrls.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      {['#', 'Short Code', 'Original URL', 'Clicks', 'Unique Visitors'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topUrls.map((row, i) => (
                      <tr key={row.short_code} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.7rem 0.8rem', color: 'var(--text-secondary)' }}>{i + 1}</td>
                        <td style={{ padding: '0.7rem 0.8rem', fontWeight: 600, color: 'var(--brand-secondary)', whiteSpace: 'nowrap' }}>/{row.short_code}</td>
                        <td style={{ padding: '0.7rem 0.8rem', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <a href={row.original_url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{row.original_url}</a>
                        </td>
                        <td style={{ padding: '0.7rem 0.8rem', fontWeight: 600 }}>{row.total_clicks.toLocaleString()}</td>
                        <td style={{ padding: '0.7rem 0.8rem', color: 'var(--text-secondary)' }}>{row.unique_visitors.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Click Trend ──────────────────────────────────────────────── */}
      {activeTab === 'trend' && (
        <div>
          <DateRangeFilter
            range={trendRange}
            onChange={(r) => { setTrendRange(r); loadTrend(r); }}
          />
          <div className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <TrendingUp size={20} style={{ color: 'var(--brand-secondary)' }} />
              <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: '1.2rem' }}>Daily Click Trend</h3>
            </div>

            {trendLoading && <div className="spinner" style={{ margin: '2rem auto' }}></div>}
            {trendError && <div className="error-msg">{trendError}</div>}
            {!trendLoading && !trendError && trend.length === 0 && (
              <p style={{ color: 'var(--text-secondary)' }}>No data for this date range.</p>
            )}
            {!trendLoading && !trendError && trend.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      {['Date', 'Total Clicks', 'Prev Day', 'Change %'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trend.map((row) => (
                      <tr key={row.date} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.7rem 0.8rem', whiteSpace: 'nowrap' }}>{row.date}</td>
                        <td style={{ padding: '0.7rem 0.8rem', fontWeight: 600 }}>{row.total_clicks.toLocaleString()}</td>
                        <td style={{ padding: '0.7rem 0.8rem', color: 'var(--text-secondary)' }}>
                          {row.prev_clicks !== null ? row.prev_clicks.toLocaleString() : '—'}
                        </td>
                        <td style={{ padding: '0.7rem 0.8rem' }}>{formatChangePct(row.change_pct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bot Report ───────────────────────────────────────────────── */}
      {activeTab === 'bot-report' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <Shield size={20} style={{ color: 'var(--brand-secondary)' }} />
            <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: '1.2rem' }}>Bot Suspect Report</h3>
            {!botLoading && !botError && botReport.length > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                background: 'rgba(255,77,79,0.15)', border: '1px solid rgba(255,77,79,0.4)',
                color: '#ff4d4f', borderRadius: '999px', padding: '0.2rem 0.7rem',
                fontSize: '0.8rem', fontWeight: 600,
              }}>
                <AlertTriangle size={13} />
                {botReport.length} suspicious {botReport.length === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </div>

          {botLoading && <div className="spinner" style={{ margin: '2rem auto' }}></div>}
          {botError && <div className="error-msg">{botError}</div>}
          {!botLoading && !botError && botReport.length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>✅ No suspicious activity detected.</p>
          )}
          {!botLoading && !botError && botReport.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {['Short Code', 'Hour (UTC)', 'Click Count', 'Unique IPs'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {botReport.map((row, i) => (
                    <tr key={`${row.short_code}-${row.hour}-${i}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.7rem 0.8rem', fontWeight: 600, color: 'var(--brand-secondary)', whiteSpace: 'nowrap' }}>/{row.short_code}</td>
                      <td style={{ padding: '0.7rem 0.8rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{row.hour}</td>
                      <td style={{ padding: '0.7rem 0.8rem', fontWeight: 600, color: '#ff4d4f' }}>{row.click_count.toLocaleString()}</td>
                      <td style={{ padding: '0.7rem 0.8rem', color: 'var(--text-secondary)' }}>{row.unique_ips}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Clicks by Country ────────────────────────────────────────── */}
      {activeTab === 'countries' && (
        <div>
          <DateRangeFilter
            range={countryRange}
            onChange={(r) => { setCountryRange(r); loadCountries(r); }}
          />
          <div className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
              <Globe size={20} style={{ color: 'var(--brand-secondary)' }} />
              <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: '1.2rem' }}>Clicks by Country</h3>
            </div>

            {countryLoading && <div className="spinner" style={{ margin: '2rem auto' }}></div>}
            {countryError && <div className="error-msg">{countryError}</div>}
            {!countryLoading && !countryError && countries.length === 0 && (
              <p style={{ color: 'var(--text-secondary)' }}>No data for this date range.</p>
            )}
            {!countryLoading && !countryError && countries.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      {['Country', 'Clicks'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {countries.map((row) => (
                      <tr key={row.country} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.7rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>
                            {row.country === 'Unknown' ? '❓' : row.country === 'Local' ? '🏠' : (
                              // Simple flag emoji hack
                              row.country
                            )}
                          </span>
                          <span style={{ fontWeight: 600 }}>
                            {row.country === 'Local' ? 'Internal/Local Traffic' : row.country}
                          </span>
                        </td>
                        <td style={{ padding: '0.7rem 0.8rem', fontWeight: 600 }}>{row.clicks.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
