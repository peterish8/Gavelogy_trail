/* Tweaks panel — lives in prototype; mirrors TWEAK_DEFAULTS in tokens.jsx */

function TweaksPanel(){
  const [enabled, setEnabled] = useState(false);
  const [cfg, setCfg] = useState(window.__tokens.TWEAK_DEFAULTS);

  useEffect(()=>{
    const onMsg = (e)=>{
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "__activate_edit_mode") setEnabled(true);
      if (e.data.type === "__deactivate_edit_mode") setEnabled(false);
    };
    window.addEventListener("message", onMsg);
    // announce availability AFTER registering the handler
    window.parent.postMessage({type:"__edit_mode_available"}, "*");
    return ()=>window.removeEventListener("message", onMsg);
  }, []);

  function update(k, v){
    const next = {...cfg, [k]: v};
    setCfg(next);
    window.__tokens.applyTheme(next);
    window.parent.postMessage({type:"__edit_mode_set_keys", edits:{[k]: v}}, "*");
  }

  if (!enabled) return null;

  const row = {display:"flex", flexDirection:"column", gap:6, padding:"12px 0", borderBottom:"1px solid var(--border)"};
  const lbl = {fontSize:11, fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:"var(--ink-3)"};
  const chip = (on)=>({padding:"6px 10px", borderRadius:"var(--radius-sm)", border:`1px solid ${on?"var(--brand)":"var(--border-strong)"}`, background: on?"var(--brand-soft)":"var(--surface)", color: on?"var(--brand)":"var(--ink-2)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit"});

  return (
    <div style={{
      position:"fixed", bottom:20, right:20, zIndex:9999,
      width:280, background:"var(--surface)", border:"1px solid var(--border-strong)",
      borderRadius:"var(--radius)", boxShadow:"var(--s3)", padding:"14px 16px",
      fontFamily:"'Inter', sans-serif",
    }}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div className="serif" style={{fontSize:16, fontWeight:600, letterSpacing:"-.01em"}}>Tweaks</div>
        <button onClick={()=>setEnabled(false)} style={{background:"transparent", border:0, cursor:"pointer", color:"var(--ink-3)"}}>{I.x}</button>
      </div>

      <div style={row}>
        <div style={lbl}>Brand color</div>
        <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
          {Object.entries(window.__tokens.BRANDS).map(([k,v])=>(
            <button key={k} onClick={()=>update("brand", k)} style={{
              width:28, height:28, borderRadius:"var(--radius-sm)",
              background:v.brand, cursor:"pointer",
              border:`2px solid ${cfg.brand===k?"var(--ink)":"transparent"}`,
              outline: "1px solid var(--border)",
            }} title={k}/>
          ))}
        </div>
      </div>

      <div style={row}>
        <div style={lbl}>Surface tone</div>
        <div style={{display:"flex", gap:6}}>
          {["lilac","warm","cool","pure"].map(k=>(
            <button key={k} onClick={()=>update("surface", k)} style={chip(cfg.surface===k)}>{k}</button>
          ))}
        </div>
      </div>

      <div style={row}>
        <div style={lbl}>Display font</div>
        <div style={{display:"flex", gap:6}}>
          <button onClick={()=>update("serifDisplay", true)} style={chip(cfg.serifDisplay)}>Serif</button>
          <button onClick={()=>update("serifDisplay", false)} style={chip(!cfg.serifDisplay)}>All sans</button>
        </div>
      </div>

      <div style={row}>
        <div style={lbl}>Density</div>
        <div style={{display:"flex", gap:6}}>
          {["airy","balanced","dense"].map(k=>(
            <button key={k} onClick={()=>update("density", k)} style={chip(cfg.density===k)}>{k}</button>
          ))}
        </div>
      </div>

      <div style={row}>
        <div style={lbl}>Shadow</div>
        <div style={{display:"flex", gap:6}}>
          {["soft","crisp","flat"].map(k=>(
            <button key={k} onClick={()=>update("shadowStrength", k)} style={chip(cfg.shadowStrength===k)}>{k}</button>
          ))}
        </div>
      </div>

      <div style={{...row, borderBottom:0}}>
        <div style={lbl}>Corner radius · {cfg.radius}px</div>
        <input type="range" min="4" max="18" step="1" value={cfg.radius} onChange={e=>update("radius", +e.target.value)} style={{width:"100%"}}/>
      </div>
    </div>
  );
}

Object.assign(window, { TweaksPanel });
