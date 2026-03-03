import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SHIFTS = {
  'Day Shift':   { week_status: 'Weekday', day_of_week: 'Monday',   load_type: 'Medium_Load'  },
  'Night Shift': { week_status: 'Weekday', day_of_week: 'Tuesday',  load_type: 'Maximum_Load' },
  'Weekend':     { week_status: 'Weekend', day_of_week: 'Saturday', load_type: 'Light_Load'   },
}

const DEFAULT_PARAMS = {
  workpiece_weight:      163,
  num_stream:            3,
  num_crystallizer:      12,
  cast_in_row:           5,
  alloy_speed:           1.2,
  water_consumption:     280,
  swing_frequency:       120,
  crystallizer_movement: 5,
  metal_residue_grab1:   2,
  P_pct:  0.02,
  Si_pct: 0.25,
  C_pct:  0.15,
  Mn_pct: 1.0,
  Cu_pct: 0.05,
  lagging_reactive: 50,
  leading_reactive: 25,
  co2:              2.5,
  lagging_pf:       0.85,
  leading_pf:       0.90,
  nsm:              50,
}

// ─── Helper hooks ─────────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ─── Slider component ─────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step = 1, unit = '', onChange, accent = '#00d4ff' }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: '#9999bb', fontWeight: 500, letterSpacing: '0.5px' }}>
          {label}
        </span>
        <span className="mono" style={{ fontSize: '13px', color: accent, fontWeight: 700 }}>
          {typeof value === 'number' && step < 1 ? value.toFixed(step === 0.1 ? 1 : 2) : value}
          {unit && <span style={{ color: '#6b6b8a', marginLeft: '2px', fontSize: '11px' }}>{unit}</span>}
        </span>
      </div>
      <div style={{ position: 'relative', height: '6px' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: '#1e1e2e', borderRadius: '3px',
        }} />
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct}%`, background: accent,
          borderRadius: '3px',
          boxShadow: `0 0 8px ${accent}66`,
          transition: 'width 0.1s',
        }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute', inset: 0, width: '100%', opacity: 0,
            cursor: 'pointer', height: '100%',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
        <span style={{ fontSize: '10px', color: '#44445a' }}>{min}</span>
        <span style={{ fontSize: '10px', color: '#44445a' }}>{max}</span>
      </div>
    </div>
  )
}

// ─── MetricCard component ─────────────────────────────────────────────────────
function MetricCard({ title, value, unit, subtitle, icon, color, loading, children }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #12121a 0%, #1a1a26 100%)',
      border: `1px solid ${color}33`,
      borderRadius: '16px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: `0 4px 24px ${color}11, inset 0 1px 0 ${color}22`,
      flex: 1,
      minWidth: 0,
    }}>
      {/* Glow top-right */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 120, height: 120,
        background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '22px' }}>{icon}</span>
        <span style={{
          fontSize: '12px', fontWeight: 600, letterSpacing: '1.5px',
          textTransform: 'uppercase', color: '#6b6b8a',
        }}>{title}</span>
      </div>

      {/* Value */}
      {loading ? (
        <div>
          <div className="skeleton" style={{ height: '44px', width: '70%', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '16px', width: '50%' }} />
        </div>
      ) : (
        <>
          <div className="mono" style={{
            fontSize: '42px', fontWeight: 700, color: color,
            lineHeight: 1, marginBottom: '6px',
            textShadow: `0 0 20px ${color}66`,
          }}>
            {value !== null && value !== undefined ? value : '—'}
            {unit && (
              <span style={{ fontSize: '16px', color: '#6b6b8a', marginLeft: '6px', fontWeight: 400 }}>
                {unit}
              </span>
            )}
          </div>
          {subtitle && (
            <div style={{ fontSize: '13px', color: '#6b6b8a' }}>{subtitle}</div>
          )}
          {children}
        </>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [params, setParams]   = useState(DEFAULT_PARAMS)
  const [shift, setShift]     = useState('Day Shift')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // Debounce all param changes before firing API
  const debouncedParams = useDebounce(params, 300)
  const debouncedShift  = useDebounce(shift, 300)

  // API call
  const fetchPrediction = useCallback(async (p, s) => {
    setLoading(true)
    setError(null)
    try {
      const shiftData = SHIFTS[s]
      const body = { ...p, ...shiftData }
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrediction(debouncedParams, debouncedShift)
  }, [debouncedParams, debouncedShift, fetchPrediction])

  const setParam = (key) => (val) => setParams(prev => ({ ...prev, [key]: val }))

  // Temperature color logic
  const tempColor = !result ? '#00d4ff'
    : result.temperature < 1530 ? '#00d4ff'
    : result.temperature <= 1560 ? '#00ff88'
    : '#ff4466'

  const effScore   = result?.efficiency_score ?? 0
  const effColor   = effScore >= 85 ? '#00ff88' : effScore >= 60 ? '#ffaa00' : '#ff4466'

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      minHeight: '100vh',
      padding: '24px',
      display: 'flex', flexDirection: 'column', gap: '24px',
    }}>

      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 28px',
        background: 'linear-gradient(90deg, #12121a 0%, #1a1a26 100%)',
        border: '1px solid #252535',
        borderRadius: '14px',
        boxShadow: '0 2px 20px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '42px', height: '42px',
            background: 'linear-gradient(135deg, #00d4ff22, #00d4ff44)',
            border: '1px solid #00d4ff55',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px',
          }}>🏭</div>
          <div>
            <h1 style={{
              fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '22px',
              letterSpacing: '2px', color: '#e8e8f0',
            }}>
              STEEL PLANT <span style={{ color: '#00d4ff' }}>OPTIMIZATION</span>
            </h1>
            <div style={{ fontSize: '12px', color: '#6b6b8a', letterSpacing: '1px' }}>
              ML-POWERED PRODUCTION INTELLIGENCE
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: error ? '#ff4466' : '#00ff88',
            boxShadow: `0 0 8px ${error ? '#ff4466' : '#00ff88'}`,
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span className="mono" style={{ fontSize: '12px', color: '#6b6b8a' }}>
            {error ? 'DISCONNECTED' : 'LIVE'}
          </span>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        gap: '24px',
        flex: 1,
      }}>

        {/* ─── LEFT PANEL: Controls ─── */}
        <div style={{
          background: 'linear-gradient(180deg, #12121a 0%, #0e0e18 100%)',
          border: '1px solid #252535',
          borderRadius: '14px',
          padding: '24px',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 180px)',
        }}>
          <div style={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '2px',
            color: '#00d4ff', marginBottom: '20px',
            textTransform: 'uppercase', borderBottom: '1px solid #252535',
            paddingBottom: '12px',
          }}>
            ⚙ Production Parameters
          </div>

          <Slider
            label="Production Target"
            value={params.workpiece_weight}
            min={150} max={185} step={0.5}
            unit="t"
            onChange={setParam('workpiece_weight')}
            accent="#00d4ff"
          />
          <Slider
            label="Active Streams"
            value={params.num_stream}
            min={1} max={6} step={1}
            onChange={setParam('num_stream')}
            accent="#00d4ff"
          />
          <Slider
            label="Crystallizers"
            value={params.num_crystallizer}
            min={1} max={24} step={1}
            onChange={setParam('num_crystallizer')}
            accent="#00d4ff"
          />
          <Slider
            label="Cast Sequence"
            value={params.cast_in_row}
            min={1} max={20} step={1}
            unit="rows"
            onChange={setParam('cast_in_row')}
            accent="#00d4ff"
          />
          <Slider
            label="Casting Speed"
            value={params.alloy_speed}
            min={0.5} max={2.0} step={0.1}
            unit="m/min"
            onChange={setParam('alloy_speed')}
            accent="#ffaa00"
          />
          <Slider
            label="Water Flow"
            value={params.water_consumption}
            min={100} max={500} step={5}
            unit="L/min"
            onChange={setParam('water_consumption')}
            accent="#00d4ff"
          />

          {/* Shift selector */}
          <div style={{ margin: '20px 0 14px' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '2px',
              color: '#00d4ff', marginBottom: '14px',
              textTransform: 'uppercase', borderBottom: '1px solid #252535',
              paddingBottom: '12px',
            }}>
              ◷ Shift Schedule
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.keys(SHIFTS).map(s => (
                <button
                  key={s}
                  onClick={() => setShift(s)}
                  style={{
                    padding: '10px 14px',
                    background: shift === s
                      ? 'linear-gradient(90deg, #00d4ff22, #00d4ff11)'
                      : 'transparent',
                    border: `1px solid ${shift === s ? '#00d4ff55' : '#252535'}`,
                    borderRadius: '8px',
                    color: shift === s ? '#00d4ff' : '#6b6b8a',
                    cursor: 'pointer',
                    fontFamily: 'Rajdhani',
                    fontWeight: 600,
                    fontSize: '14px',
                    textAlign: 'left',
                    letterSpacing: '0.5px',
                    transition: 'all 0.15s',
                  }}
                >
                  {s === 'Day Shift' ? '☀ ' : s === 'Night Shift' ? '🌙 ' : '🏖 '}{s}
                  <span style={{ fontSize: '11px', marginLeft: '8px', color: '#44445a' }}>
                    {SHIFTS[s].load_type.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: '16px', padding: '12px 14px',
              background: '#ff446618', border: '1px solid #ff446644',
              borderRadius: '8px', fontSize: '12px', color: '#ff8899',
              fontFamily: 'JetBrains Mono',
            }}>
              ✗ {error}
            </div>
          )}
        </div>

        {/* ─── RIGHT PANEL: Metrics ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Metric cards row */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>

            {/* Temperature */}
            <MetricCard
              title="Steel Temperature"
              icon="🌡"
              color={tempColor}
              loading={loading}
              value={result?.temperature?.toFixed(1)}
              unit="°C"
              subtitle={
                result
                  ? result.temperature < 1530 ? 'Below optimal range'
                  : result.temperature <= 1560 ? 'Optimal range'
                  : 'Above optimal range'
                  : 'Awaiting data'
              }
            />

            {/* Production */}
            <MetricCard
              title="Production Output"
              icon="⚙"
              color="#00ff88"
              loading={loading}
              value={result?.production?.toFixed(1)}
              unit="t"
              subtitle={result ? `Efficiency: ${result.efficiency_score?.toFixed(1)}%` : 'Awaiting data'}
            />

            {/* Energy */}
            <MetricCard
              title="Energy Consumption"
              icon="⚡"
              color="#ffaa00"
              loading={loading}
              value={result ? (result.energy_kwh / 1000).toFixed(2) : null}
              unit="MWh"
              subtitle={result ? `Cost: $${result.energy_cost_usd?.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Awaiting data'}
            />

            {/* Workforce */}
            <MetricCard
              title="Workforce Required"
              icon="👷"
              color="#b388ff"
              loading={loading}
              value={result?.manpower}
              unit=""
              subtitle="workers on shift"
            />
          </div>

          {/* ── Efficiency Score bar ── */}
          <div style={{
            background: 'linear-gradient(135deg, #12121a 0%, #1a1a26 100%)',
            border: '1px solid #252535',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '16px',
            }}>
              <div>
                <div style={{
                  fontSize: '11px', fontWeight: 700, letterSpacing: '2px',
                  textTransform: 'uppercase', color: '#6b6b8a',
                }}>
                  ▲ Production Efficiency Score
                </div>
                <div style={{ fontSize: '12px', color: '#44445a', marginTop: '4px' }}>
                  Based on production output vs. 170t target
                </div>
              </div>
              <div className="mono" style={{
                fontSize: '36px', fontWeight: 700,
                color: loading ? '#44445a' : effColor,
                textShadow: loading ? 'none' : `0 0 20px ${effColor}66`,
              }}>
                {loading ? '—' : `${effScore.toFixed(1)}%`}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              height: '12px',
              background: '#1e1e2e',
              borderRadius: '6px',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {loading ? (
                <div className="skeleton" style={{ height: '100%', borderRadius: '6px' }} />
              ) : (
                <div style={{
                  height: '100%',
                  width: `${effScore}%`,
                  background: `linear-gradient(90deg, ${effColor}88, ${effColor})`,
                  borderRadius: '6px',
                  boxShadow: `0 0 12px ${effColor}66`,
                  transition: 'width 0.5s ease',
                }} />
              )}
            </div>

            {/* Tick labels */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: '6px',
            }}>
              {[0, 25, 50, 75, 100].map(v => (
                <span key={v} className="mono" style={{ fontSize: '10px', color: '#44445a' }}>{v}%</span>
              ))}
            </div>
          </div>

          {/* ── Detail stats grid ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
          }}>
            {[
              { label: 'Cast Sequence',    value: params.cast_in_row,           unit: 'rows'  },
              { label: 'Crystallizers',    value: params.num_crystallizer,       unit: 'units' },
              { label: 'Active Streams',   value: params.num_stream,             unit: ''      },
              { label: 'Casting Speed',    value: params.alloy_speed.toFixed(1), unit: 'm/min' },
              { label: 'Water Flow',       value: params.water_consumption,      unit: 'L/min' },
              { label: 'Shift',            value: shift,                          unit: ''      },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#12121a',
                border: '1px solid #252535',
                borderRadius: '10px',
                padding: '14px 16px',
              }}>
                <div style={{ fontSize: '11px', color: '#44445a', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  {stat.label}
                </div>
                <div className="mono" style={{ fontSize: '16px', color: '#9999bb', fontWeight: 600 }}>
                  {stat.value}
                  {stat.unit && <span style={{ fontSize: '11px', color: '#44445a', marginLeft: '4px' }}>{stat.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* ── Model info footer ── */}
          <div style={{
            display: 'flex', gap: '12px', flexWrap: 'wrap',
          }}>
            {[
              { label: 'Temperature Model', badge: 'XGBoost',  color: '#ff7043' },
              { label: 'Production Model',  badge: 'LightGBM', color: '#00ff88' },
              { label: 'Energy Model',      badge: 'LightGBM', color: '#ffaa00' },
            ].map(m => (
              <div key={m.label} style={{
                background: '#12121a',
                border: '1px solid #252535',
                borderRadius: '8px',
                padding: '10px 16px',
                display: 'flex', alignItems: 'center', gap: '10px',
                flex: 1,
              }}>
                <div style={{
                  padding: '2px 8px',
                  background: `${m.color}22`,
                  border: `1px solid ${m.color}44`,
                  borderRadius: '4px',
                  fontSize: '10px', fontWeight: 700,
                  color: m.color, letterSpacing: '0.5px',
                  fontFamily: 'JetBrains Mono',
                }}>{m.badge}</div>
                <span style={{ fontSize: '12px', color: '#6b6b8a' }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Global pulse animation ── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
