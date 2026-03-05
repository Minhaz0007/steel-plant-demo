import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ─── Slider component ─────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step = 1, unit = '', onChange, accent = '#00d4ff' }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-label)', fontWeight: 500, letterSpacing: '0.5px' }}>
          {label}
        </span>
        <span className="mono" style={{ fontSize: '13px', color: accent, fontWeight: 700 }}>
          {typeof value === 'number' && step < 1 ? value.toFixed(step === 0.1 ? 1 : 2) : value}
          {unit && <span style={{ color: 'var(--text-muted)', marginLeft: '2px', fontSize: '11px' }}>{unit}</span>}
        </span>
      </div>
      <div style={{ position: 'relative', height: '6px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-input)', borderRadius: '3px' }} />
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
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{min}</span>
        <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{max}</span>
      </div>
    </div>
  )
}

// ─── NumberInput component ─────────────────────────────────────────────────────
function NumberInput({ label, value, min, max, step, onChange, accent = '#00d4ff' }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-label)', fontWeight: 500 }}>{label}</span>
        <input
          type="number" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{
            width: '80px', padding: '4px 8px',
            background: 'var(--bg-input)', border: `1px solid ${accent}44`,
            borderRadius: '6px', color: accent,
            fontFamily: 'JetBrains Mono', fontSize: '12px', fontWeight: 700,
            textAlign: 'right',
          }}
        />
      </div>
    </div>
  )
}

// ─── MetricCard component ─────────────────────────────────────────────────────
function MetricCard({ title, value, unit, subtitle, icon, color, isLoading, error, badge, children }) {
  return (
    <div style={{
      background: 'var(--gradient-card)',
      border: `1px solid ${color}33`,
      borderRadius: '16px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: `0 4px 24px ${color}11, inset 0 1px 0 ${color}22`,
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 120, height: 120,
        background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '22px' }}>{icon}</span>
        <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          {title}
        </span>
        {badge && (
          <span style={{
            marginLeft: 'auto', padding: '2px 7px',
            background: `${color}22`, border: `1px solid ${color}44`,
            borderRadius: '4px', fontSize: '10px', fontWeight: 700,
            color: color, fontFamily: 'JetBrains Mono', letterSpacing: '0.5px',
          }}>{badge}</span>
        )}
      </div>

      {error ? (
        <div style={{ fontSize: '12px', color: 'var(--red)', fontFamily: 'JetBrains Mono' }}>✗ {error}</div>
      ) : isLoading ? (
        <div>
          <div className="skeleton" style={{ height: '44px', width: '70%', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '16px', width: '50%' }} />
        </div>
      ) : value == null ? (
        <div style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Awaiting data...</div>
      ) : (
        <>
          <div className="mono" style={{
            fontSize: '42px', fontWeight: 700, color: color,
            lineHeight: 1, marginBottom: '6px',
            textShadow: `0 0 20px ${color}66`,
          }}>
            {value}
            {unit && <span style={{ fontSize: '16px', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 400 }}>{unit}</span>}
          </div>
          {subtitle && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{subtitle}</div>}
          {children}
        </>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // Parameters
  const [productionTarget,      setProductionTarget]      = useState(163)
  const [castInRow,             setCastInRow]             = useState(18)
  const [numCrystallizer,       setNumCrystallizer]       = useState(12)
  const [numStream,             setNumStream]             = useState(3)
  const [castingSpeed,          setCastingSpeed]          = useState(2.0)
  const [waterFlow,             setWaterFlow]             = useState(2155)
  const [waterTempDelta,        setWaterTempDelta]        = useState(9)
  const [swingFrequency,        setSwingFrequency]        = useState(200)
  const [crystallizerMovement,  setCrystallizerMovement]  = useState(7)
  const [C_pct,                 setC_pct]                 = useState(0.19)
  const [Si_pct,                setSi_pct]                = useState(0.19)
  const [Mn_pct,                setMn_pct]                = useState(0.70)
  const [P_pct,                 setP_pct]                 = useState(0.01)
  const [Cu_pct,                setCu_pct]                = useState(0.04)
  const [shift,                 setShift]                 = useState('Day Shift')

  // UI state
  const [prediction,   setPrediction]   = useState(null)
  const [isLoading,    setIsLoading]    = useState(false)
  const [isWarmingUp,  setIsWarmingUp]  = useState(true)
  const [error,        setError]        = useState(null)
  const [isDark,       setIsDark]       = useState(true)

  // Theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [isDark])

  const COLORS = isDark ? {
    blue:   '#00d4ff',
    green:  '#00ff88',
    amber:  '#ffaa00',
    red:    '#ff4466',
    purple: '#b388ff',
    orange: '#ff7043',
  } : {
    blue:   '#0077bb',
    green:  '#007744',
    amber:  '#b86800',
    red:    '#cc2244',
    purple: '#6633bb',
    orange: '#cc4400',
  }

  // ── fetchPrediction ──────────────────────────────────────────────────────────
  const fetchPrediction = useCallback(async (params) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || `HTTP ${res.status}`)
      }
      setPrediction(await res.json())
    } catch {
      setError('Connection error — is the backend running?')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Poll /health until models_loaded has 5 items ────────────────────────────
  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      while (!cancelled) {
        try {
          const res = await fetch(`${API_URL}/health`)
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data.models_loaded) && data.models_loaded.length >= 5) {
              if (!cancelled) setIsWarmingUp(false)
              return
            }
          }
        } catch { /* still sleeping */ }
        await new Promise(r => setTimeout(r, 3000))
      }
    }
    poll()
    return () => { cancelled = true }
  }, [])

  // ── Debounced prediction trigger ─────────────────────────────────────────────
  const debounceRef = useRef(null)
  const triggerPrediction = useCallback(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchPrediction({
        production_target: productionTarget,
        cast_in_row: castInRow,
        num_crystallizer: numCrystallizer,
        num_stream: numStream,
        casting_speed: castingSpeed,
        water_flow: waterFlow,
        water_temp_delta: waterTempDelta,
        swing_frequency: swingFrequency,
        crystallizer_movement: crystallizerMovement,
        C_pct, Si_pct, Mn_pct, P_pct, Cu_pct,
        shift,
      })
    }, 400)
  }, [
    productionTarget, castInRow, numCrystallizer, numStream,
    castingSpeed, waterFlow, waterTempDelta, swingFrequency,
    crystallizerMovement, C_pct, Si_pct, Mn_pct, P_pct, Cu_pct,
    shift, fetchPrediction,
  ])

  useEffect(() => {
    if (isWarmingUp) return
    triggerPrediction()
  }, [isWarmingUp, triggerPrediction])

  // ── Derived colors ───────────────────────────────────────────────────────────
  const temp = prediction?.steel_temperature_celsius
  const tempColor = !temp ? COLORS.blue
    : temp > 1570 ? COLORS.red
    : temp >= 1540 ? COLORS.green
    : COLORS.blue

  const yieldPct = prediction?.yield_pct ?? 0
  const yieldColor = yieldPct >= 90 ? COLORS.green : yieldPct >= 70 ? COLORS.amber : COLORS.red

  const rul = prediction?.rul_heats ?? 0
  const rulColor = rul > 20000 ? COLORS.green : rul >= 5000 ? COLORS.amber : COLORS.red
  const rulStatus = rul > 20000 ? 'Healthy — no maintenance required'
    : rul >= 5000 ? 'Monitor — schedule inspection soon'
    : 'Service required — critical wear detected'

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
        background: 'var(--gradient-header)',
        border: '1px solid var(--bg-border)',
        borderRadius: '14px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '42px', height: '42px',
            background: 'var(--blue-dim)',
            border: '1px solid var(--blue-glow)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px',
          }}>🏭</div>
          <div>
            <h1 style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '22px', letterSpacing: '2px', color: 'var(--text-main)' }}>
              STEEL PLANT <span style={{ color: 'var(--blue)' }}>OPTIMIZATION</span>
            </h1>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '1px' }}>
              ML-POWERED PRODUCTION INTELLIGENCE
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setIsDark(d => !d)}
            style={{
              padding: '7px 14px',
              background: 'var(--bg-card2)',
              border: '1px solid var(--bg-border)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '13px', letterSpacing: '0.5px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {isDark ? '☀ LIGHT' : '🌙 DARK'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: isWarmingUp ? COLORS.amber : error ? COLORS.red : COLORS.green,
              boxShadow: `0 0 8px ${isWarmingUp ? COLORS.amber : error ? COLORS.red : COLORS.green}`,
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {isWarmingUp ? 'WARMING UP' : error ? 'DISCONNECTED' : 'LIVE'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', flex: 1 }}>

        {/* ─── LEFT PANEL ─── */}
        <div style={{
          background: 'var(--gradient-panel)',
          border: '1px solid var(--bg-border)',
          borderRadius: '14px',
          padding: '24px',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 180px)',
        }}>
          <div style={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '2px',
            color: 'var(--blue)', marginBottom: '20px',
            textTransform: 'uppercase', borderBottom: '1px solid var(--bg-border)', paddingBottom: '12px',
          }}>
            ⚙ Production Parameters
          </div>

          <Slider label="Production Target" value={productionTarget} min={154} max={172} step={0.5} unit="t"   onChange={setProductionTarget} accent={COLORS.blue}  />
          <Slider label="Active Streams"    value={numStream}        min={1}   max={6}   step={1}            onChange={setNumStream}        accent={COLORS.blue}  />
          <Slider label="Crystallizers"     value={numCrystallizer}  min={3}   max={24}  step={1}            onChange={setNumCrystallizer}  accent={COLORS.blue}  />
          <Slider label="Cast Sequence"     value={castInRow}        min={1}   max={46}  step={1}   unit="rows" onChange={setCastInRow}     accent={COLORS.blue}  />
          <Slider label="Casting Speed"     value={castingSpeed}     min={1}   max={3}   step={0.1} unit="m/min" onChange={setCastingSpeed}  accent={COLORS.amber} />
          <Slider label="Water Flow"        value={waterFlow}        min={1255} max={2155} step={50} unit="L/min" onChange={setWaterFlow}   accent={COLORS.blue}  />

          {/* Alloy Composition */}
          <div style={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '2px',
            color: 'var(--blue)', margin: '20px 0 14px',
            textTransform: 'uppercase', borderBottom: '1px solid var(--bg-border)', paddingBottom: '12px',
          }}>
            ⬡ Alloy Composition
          </div>
          <NumberInput label="Carbon (C%)"     value={C_pct}  min={0.06}  max={0.30}  step={0.01}  onChange={setC_pct}  accent={COLORS.orange} />
          <NumberInput label="Silicon (Si%)"   value={Si_pct} min={0.10}  max={0.68}  step={0.01}  onChange={setSi_pct} accent={COLORS.orange} />
          <NumberInput label="Manganese (Mn%)" value={Mn_pct} min={0.45}  max={1.58}  step={0.01}  onChange={setMn_pct} accent={COLORS.orange} />
          <NumberInput label="Phosphorus (P%)" value={P_pct}  min={0.005} max={0.039} step={0.001} onChange={setP_pct}  accent={COLORS.orange} />
          <NumberInput label="Copper (Cu%)"    value={Cu_pct} min={0.007} max={0.084} step={0.001} onChange={setCu_pct} accent={COLORS.orange} />

          {/* Shift Schedule */}
          <div style={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '2px',
            color: 'var(--blue)', margin: '20px 0 14px',
            textTransform: 'uppercase', borderBottom: '1px solid var(--bg-border)', paddingBottom: '12px',
          }}>
            ◷ Shift Schedule
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { name: 'Day Shift',   icon: '☀',  load: 'Medium Load'  },
              { name: 'Night Shift', icon: '🌙', load: 'Maximum Load' },
              { name: 'Weekend',     icon: '🏖', load: 'Light Load'   },
            ].map(s => (
              <button
                key={s.name}
                onClick={() => setShift(s.name)}
                style={{
                  padding: '10px 14px',
                  background: shift === s.name ? 'var(--blue-dim)' : 'transparent',
                  border: shift === s.name ? '1px solid var(--blue-glow)' : '1px solid var(--bg-border)',
                  borderRadius: '8px',
                  color: shift === s.name ? 'var(--blue)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '14px',
                  textAlign: 'left', letterSpacing: '0.5px', transition: 'all 0.15s',
                }}
              >
                {s.icon} {s.name}
                <span style={{ fontSize: '11px', marginLeft: '8px', color: 'var(--text-dim)' }}>{s.load}</span>
              </button>
            ))}
          </div>

          {error && (
            <div style={{
              marginTop: '16px', padding: '12px 14px',
              background: 'var(--red-dim)', border: '1px solid var(--red)',
              borderRadius: '8px', fontSize: '12px', color: 'var(--red)',
              fontFamily: 'JetBrains Mono',
            }}>
              ✗ {error}
            </div>
          )}
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* TOP ROW — 4 metric cards */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>

            <MetricCard
              title="Steel Temperature" icon="🌡" color={tempColor}
              badge="XGBoost" isLoading={isLoading} error={error}
              value={temp?.toFixed(1)} unit="°C"
              subtitle={
                !temp ? null
                  : temp > 1570  ? 'Above optimal range'
                  : temp >= 1540 ? 'Optimal range'
                  : 'Below optimal range'
              }
            />

            <MetricCard
              title="Production Output" icon="⚙" color={COLORS.green}
              badge="LightGBM" isLoading={isLoading} error={error}
              value={prediction?.production_tonnes?.toFixed(1)} unit="t"
              subtitle={prediction ? `Yield: ${prediction.yield_pct}%` : null}
            />

            <MetricCard
              title="Energy Consumption" icon="⚡" color={COLORS.amber}
              badge="LightGBM" isLoading={isLoading} error={error}
              value={prediction?.energy_mwh?.toFixed(2)} unit="MWh"
              subtitle={prediction ? `Cost: $${prediction.energy_cost_usd}` : null}
            />

            <MetricCard
              title="Workforce Required" icon="👷" color={COLORS.purple}
              badge="Shift formula" isLoading={isLoading} error={error}
              value={prediction?.workforce} unit=""
              subtitle="workers on shift"
            />
          </div>

          {/* MIDDLE — Production Yield Score */}
          <div style={{
            background: 'var(--gradient-card)',
            border: '1px solid var(--bg-border)',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  ▲ Production Yield Score
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Based on actual vs theoretical steel weight — LightGBM model
                </div>
              </div>
              <div className="mono" style={{
                fontSize: '36px', fontWeight: 700,
                color: isLoading ? 'var(--text-dim)' : yieldColor,
                textShadow: isLoading ? 'none' : `0 0 20px ${yieldColor}66`,
              }}>
                {isLoading ? '—' : prediction ? `${yieldPct.toFixed(1)}%` : '—'}
              </div>
            </div>

            <div style={{ height: '12px', background: 'var(--bg-input)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
              {isLoading ? (
                <div className="skeleton" style={{ height: '100%', borderRadius: '6px' }} />
              ) : (
                <div style={{
                  height: '100%',
                  width: `${yieldPct}%`,
                  background: `linear-gradient(90deg, ${yieldColor}88, ${yieldColor})`,
                  borderRadius: '6px',
                  boxShadow: `0 0 12px ${yieldColor}66`,
                  transition: 'width 0.5s ease',
                }} />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              {[0, 25, 50, 75, 100].map(v => (
                <span key={v} className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{v}%</span>
              ))}
            </div>
          </div>

          {/* BOTTOM ROW — 6 parameter echo cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'Cast Sequence',  value: castInRow,                unit: 'rows'   },
              { label: 'Crystallizers',  value: numCrystallizer,           unit: 'units'  },
              { label: 'Active Streams', value: numStream,                 unit: ''       },
              { label: 'Casting Speed',  value: castingSpeed.toFixed(1),   unit: 'm/min'  },
              { label: 'Water Flow',     value: waterFlow,                 unit: 'L/min'  },
              { label: 'Shift',          value: shift,                     unit: ''       },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
                borderRadius: '10px', padding: '14px 16px',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  {stat.label}
                </div>
                <div className="mono" style={{ fontSize: '16px', color: 'var(--text-label)', fontWeight: 600 }}>
                  {stat.value}
                  {stat.unit && <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginLeft: '4px' }}>{stat.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* CRYSTALLIZER HEALTH CARD */}
          <div style={{
            background: 'var(--gradient-card)',
            border: `1px solid ${rulColor}33`,
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 4px 24px ${rulColor}11`,
          }}>
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 120, height: 120,
              background: `radial-gradient(circle, ${rulColor}20 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '22px' }}>🔩</span>
              <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Crystallizer Health
              </span>
              <span style={{
                marginLeft: 'auto', padding: '2px 7px',
                background: `${rulColor}22`, border: `1px solid ${rulColor}44`,
                borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                color: rulColor, fontFamily: 'JetBrains Mono',
              }}>LightGBM</span>
            </div>

            {error ? (
              <div style={{ fontSize: '12px', color: 'var(--red)', fontFamily: 'JetBrains Mono' }}>✗ {error}</div>
            ) : isLoading ? (
              <div>
                <div className="skeleton" style={{ height: '44px', width: '60%', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '16px', width: '80%' }} />
              </div>
            ) : prediction == null ? (
              <div style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Awaiting data...</div>
            ) : (
              <>
                <div className="mono" style={{
                  fontSize: '42px', fontWeight: 700, color: rulColor,
                  lineHeight: 1, marginBottom: '6px',
                  textShadow: `0 0 20px ${rulColor}66`,
                }}>
                  {rul.toLocaleString()}
                  <span style={{ fontSize: '16px', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 400 }}>heats</span>
                </div>
                <div style={{ fontSize: '13px', color: rulColor }}>{rulStatus}</div>
              </>
            )}
          </div>

          {/* MODEL BADGES FOOTER */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'Temperature Model', badge: 'XGBoost',  color: COLORS.orange },
              { label: 'Production Model',  badge: 'LightGBM', color: COLORS.green  },
              { label: 'Yield Model',       badge: 'LightGBM', color: COLORS.blue   },
              { label: 'Energy Model',      badge: 'LightGBM', color: COLORS.amber  },
              { label: 'RUL Model',         badge: 'LightGBM', color: COLORS.purple },
            ].map(m => (
              <div key={m.label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
                borderRadius: '8px', padding: '10px 16px',
                display: 'flex', alignItems: 'center', gap: '10px',
                flex: 1,
              }}>
                <div style={{
                  padding: '2px 8px',
                  background: `${m.color}22`, border: `1px solid ${m.color}44`,
                  borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                  color: m.color, letterSpacing: '0.5px', fontFamily: 'JetBrains Mono',
                }}>{m.badge}</div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
