/* Core primitives used throughout the prototype. */
const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;

/* ---------- Icon ---------- */
function Icon({ name, size=16, className="", style }) {
  return <i className={`i ${className}`} style={{fontSize:size, ...style}} aria-hidden="true">{lucideGlyph(name)}</i>;
}
// Map of commonly used lucide names to their codepoints — lucide-static ships a font where class "icon-name" works,
// but using a span+content-before via CSS is overkill. Easier: use the unicode map directly via data attributes.
// We'll instead use <i class="i-{name}"> with pseudo content. Simpler: inline SVGs for icons we actually use.
function lucideGlyph(){return ""}

/* Use inline SVG icons — tiny, no fetch. */
const I = {
  arrow:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
  check:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  x:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  search:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>,
  home:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>,
  book:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  chart:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 14v4"/><path d="M12 9v9"/><path d="M17 4v14"/></svg>,
  trophy:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  target:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  flag:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>,
  user:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  lock:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  clock:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  bolt:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  scale:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>,
  sparkles: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.94 14.06 3 21l6.94-6.94L12 12l-2.06 2.06Z"/><path d="M14.5 5.5 20 11"/><path d="M19 3v4"/><path d="M17 5h4"/></svg>,
  play:     <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>,
  pause:    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>,
  mic:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v4"/></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>,
  bell:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  logo:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h10l6 6v10a0 0 0 0 1 0 0H4z"/><path d="M14 4v6h6"/><path d="M8 14h8"/><path d="M8 18h5"/></svg>,
  grid:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
  layers:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 8 4-8 4-8-4 8-4Z"/><path d="m4 14 8 4 8-4"/><path d="m4 10 8 4 8-4"/></svg>,
  notebook: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><rect width="16" height="20" x="6" y="2" rx="2"/></svg>,
  headphones:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M16 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2Z"/><path d="M3 14a9 9 0 0 1 18 0"/></svg>,
  menu:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
  chev:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  chevDown: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  dot:      <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor"><circle cx="3" cy="3" r="3"/></svg>,
  plus:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  minus:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>,
  external:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>,
  quote:    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>,
  pdf:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>,
  filter:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  edit:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>,
  flame:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/></svg>,
  star:     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

/* ---------- Button ---------- */
function Btn({variant="primary", size="md", children, onClick, className="", type="button", leading, trailing, disabled, as:As="button", href}) {
  const base = {
    fontFamily:"inherit", fontWeight:600, letterSpacing:"-0.005em",
    borderRadius:"var(--radius-sm)",
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:"8px",
    cursor: disabled?"not-allowed":"pointer", transition:"background .15s ease, border-color .15s ease, color .15s ease, transform .08s ease, box-shadow .15s ease",
    border:"1px solid transparent",
    opacity: disabled?.55:1,
    whiteSpace:"nowrap",
  };
  const sizes = {
    sm: {padding:"6px 12px", fontSize:13, height:32},
    md: {padding:"10px 16px", fontSize:14, height:40},
    lg: {padding:"14px 22px", fontSize:15, height:48},
    xl: {padding:"16px 26px", fontSize:16, height:54},
  };
  const variants = {
    primary: { background:"var(--brand)", color:"#fff", borderColor:"var(--brand)" },
    secondary: { background:"var(--surface)", color:"var(--ink)", borderColor:"var(--border-strong)" },
    ghost: { background:"transparent", color:"var(--ink)", borderColor:"transparent" },
    outline: { background:"transparent", color:"var(--ink)", borderColor:"var(--border-strong)" },
    subtle: { background:"var(--panel)", color:"var(--ink)", borderColor:"var(--border)" },
    danger: { background:"var(--surface)", color:"var(--danger)", borderColor:"color-mix(in oklab, var(--danger) 30%, var(--border-strong))" },
  };
  const [hover, setHover] = useState(false);
  const hv = hover && !disabled ? {
    primary: {background:"var(--brand-hover)"},
    secondary:{background:"var(--panel)"},
    ghost:{background:"var(--panel)"},
    outline:{background:"var(--panel)"},
    subtle:{background:"var(--surface)", borderColor:"var(--border-strong)"},
    danger:{background:"var(--danger-soft)"},
  }[variant] : {};
  const style = {...base, ...sizes[size], ...variants[variant], ...hv};
  if (As==="a") {
    return <a href={href} onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} style={style} className={className}>{leading}{children}{trailing}</a>;
  }
  return <button type={type} disabled={disabled} onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} style={style} className={className}>{leading}{children}{trailing}</button>;
}

/* ---------- Card ---------- */
function Card({children, style={}, pad=true, hover=false, onClick, className=""}) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={()=>hover&&setH(true)} onMouseLeave={()=>hover&&setH(false)}
      className={className}
      style={{
        background:"var(--surface)",
        border:"1px solid var(--border)",
        borderRadius:"var(--radius)",
        boxShadow: h?"var(--s2)":"var(--s1)",
        padding: pad?"var(--card-pad)":0,
        transition:"box-shadow .2s ease, transform .2s ease, border-color .2s ease",
        transform: h?"translateY(-2px)":"none",
        cursor: onClick?"pointer":"default",
        ...style,
      }}>{children}</div>
  );
}

/* ---------- Badge / Chip ---------- */
function Badge({children, tone="neutral", size="sm", style={}}) {
  const tones = {
    neutral:{bg:"var(--panel)", color:"var(--ink-2)", bd:"var(--border)"},
    brand:{bg:"var(--brand-soft)", color:"var(--brand)", bd:"var(--brand-border)"},
    success:{bg:"var(--success-soft)", color:"var(--success)", bd:"color-mix(in oklab, var(--success) 22%, transparent)"},
    warn:{bg:"var(--warn-soft)", color:"var(--warn)", bd:"color-mix(in oklab, var(--warn) 22%, transparent)"},
    danger:{bg:"var(--danger-soft)", color:"var(--danger)", bd:"color-mix(in oklab, var(--danger) 22%, transparent)"},
    gold:{bg:"var(--gold-soft)", color:"var(--gold-ink)", bd:"var(--gold-border)"},
    plum:{bg:"var(--brand-2-soft)", color:"var(--brand-2)", bd:"var(--brand-2-border)"},
    outline:{bg:"transparent", color:"var(--ink-2)", bd:"var(--border-strong)"},
  };
  const t = tones[tone]||tones.neutral;
  const sizes = {
    xs:{fs:10, pad:"2px 6px", h:18},
    sm:{fs:11, pad:"3px 8px", h:22},
    md:{fs:12, pad:"4px 10px", h:26},
  };
  const s = sizes[size];
  return <span style={{
    display:"inline-flex", alignItems:"center", gap:4,
    background:t.bg, color:t.color, border:`1px solid ${t.bd}`,
    borderRadius:999, padding:s.pad, fontSize:s.fs, fontWeight:600, letterSpacing:".01em",
    fontFamily:"inherit", ...style
  }}>{children}</span>;
}

/* ---------- Input ---------- */
function Input({label, hint, error, leading, trailing, ...props}){
  const [focus, setFocus] = useState(false);
  return (
    <label style={{display:"flex", flexDirection:"column", gap:6}}>
      {label && <span style={{fontSize:12, fontWeight:600, color:"var(--ink-2)", letterSpacing:".01em"}}>{label}</span>}
      <div style={{
        display:"flex", alignItems:"center", gap:8,
        background:"var(--surface)", border:`1px solid ${error?"var(--danger)":(focus?"var(--brand)":"var(--border-strong)")}`,
        borderRadius:"var(--radius-sm)", padding:"0 12px", height:42,
        boxShadow: focus?`0 0 0 4px color-mix(in oklab, var(--ring) 14%, transparent)`:"none",
        transition:"border-color .15s ease, box-shadow .15s ease",
      }}>
        {leading && <span style={{color:"var(--ink-3)", display:"inline-flex"}}>{leading}</span>}
        <input {...props}
          onFocus={(e)=>{setFocus(true); props.onFocus&&props.onFocus(e)}}
          onBlur={(e)=>{setFocus(false); props.onBlur&&props.onBlur(e)}}
          style={{flex:1, border:0, outline:"none", background:"transparent", color:"var(--ink)", fontSize:14, fontFamily:"inherit", height:"100%"}} />
        {trailing}
      </div>
      {hint && !error && <span style={{fontSize:12, color:"var(--ink-3)"}}>{hint}</span>}
      {error && <span style={{fontSize:12, color:"var(--danger)"}}>{error}</span>}
    </label>
  );
}

/* ---------- Section helpers ---------- */
function SectionLabel({children, style={}}){
  return <div style={{fontSize:11, fontWeight:600, letterSpacing:".14em", color:"var(--ink-3)", textTransform:"uppercase", ...style}}>{children}</div>;
}

function Divider({style={}}){ return <div style={{height:1, background:"var(--border)", ...style}}/> }

/* ---------- Tabs ---------- */
function Tabs({items, value, onChange, dense=false}){
  const refs = useRef({});
  const [ind, setInd] = useState({left:0, width:0});
  useEffect(()=>{
    const el = refs.current[value];
    if (el) setInd({left: el.offsetLeft, width: el.offsetWidth});
  }, [value, items.length]);
  return (
    <div style={{position:"relative", display:"inline-flex", gap:0, background:"var(--panel)", padding:4, borderRadius:"var(--radius-sm)", border:"1px solid var(--border)"}}>
      <div style={{position:"absolute", top:4, bottom:4, left:ind.left, width:ind.width, background:"var(--surface)", borderRadius: `calc(var(--radius-sm) - 2px)`, boxShadow:"var(--s1)", border:"1px solid var(--border)", transition:"all .22s cubic-bezier(.4,0,.2,1)"}} />
      {items.map(it=>(
        <button key={it.value} ref={el=>refs.current[it.value]=el}
          onClick={()=>onChange(it.value)}
          style={{
            position:"relative", zIndex:1,
            background:"transparent", border:0,
            padding: dense?"6px 12px":"8px 16px",
            fontSize:13, fontWeight:600,
            color: value===it.value?"var(--ink)":"var(--ink-2)",
            cursor:"pointer", borderRadius:"calc(var(--radius-sm) - 2px)",
            display:"inline-flex", alignItems:"center", gap:6,
            fontFamily:"inherit",
          }}>{it.leading}{it.label}{it.trailing}</button>
      ))}
    </div>
  );
}

/* ---------- Progress ---------- */
function Progress({value, max=100, tone="brand"}){
  const pct = Math.max(0, Math.min(100, (value/max)*100));
  const colors = {brand:"var(--brand)", success:"var(--success)", warn:"var(--warn)", danger:"var(--danger)"};
  return (
    <div style={{height:6, background:"var(--panel)", borderRadius:999, overflow:"hidden", border:"1px solid var(--border)"}}>
      <div style={{height:"100%", width:`${pct}%`, background:colors[tone]||colors.brand, transition:"width .4s ease"}}/>
    </div>
  );
}

/* ---------- Stat ---------- */
function Stat({label, value, hint, tone="neutral", trailing}){
  return (
    <div style={{display:"flex", flexDirection:"column", gap:4, minWidth:0}}>
      <div style={{fontSize:11, color:"var(--ink-3)", fontWeight:600, letterSpacing:".12em", textTransform:"uppercase"}}>{label}</div>
      <div style={{display:"flex", alignItems:"baseline", gap:8}}>
        <div className="serif" style={{fontSize:28, fontWeight:600, color:"var(--ink)", letterSpacing:"-0.02em", lineHeight:1}}>{value}</div>
        {trailing}
      </div>
      {hint && <div style={{fontSize:12, color:"var(--ink-2)"}}>{hint}</div>}
    </div>
  );
}

/* ---------- Hairline pattern bg (subtle serif-paper texture alternative) ---------- */
function Paper({children, style={}}){
  return <div style={{
    background: `
      linear-gradient(var(--bg), var(--bg)),
      repeating-linear-gradient(0deg, transparent 0 28px, color-mix(in oklab, var(--ink) 3%, transparent) 28px 29px)
    `,
    ...style
  }}>{children}</div>;
}

/* ---------- Sparkline ---------- */
function Sparkline({points, height=36, width=120, color="var(--brand)", fill=true}){
  const min = Math.min(...points), max = Math.max(...points);
  const span = max-min || 1;
  const step = points.length>1 ? width/(points.length-1) : 0;
  const path = points.map((p,i)=>`${i===0?"M":"L"} ${i*step} ${height - ((p-min)/span)*height}`).join(" ");
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} style={{display:"block"}}>
      {fill && <path d={area} fill={color} opacity=".08"/>}
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

Object.assign(window, { I, Btn, Card, Badge, Input, SectionLabel, Divider, Tabs, Progress, Stat, Paper, Sparkline });
