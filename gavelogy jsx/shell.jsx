/* App shell: sidebar + topbar for "app" pages (dashboard, courses, viewer, profile, etc.)
   Marketing shell: top nav + footer for landing + auth pages. */

function Logo({size=22, inverted=false}){
  return (
    <div style={{display:"inline-flex", alignItems:"center", gap:10}}>
      <div style={{
        width:size+6, height:size+6, borderRadius:6,
        background: inverted?"#fff":"var(--ink)",
        color: inverted?"var(--ink)":"#fff",
        display:"inline-flex", alignItems:"center", justifyContent:"center",
        fontFamily:"'Source Serif 4', serif", fontWeight:700, fontSize:size-4, letterSpacing:"-.02em",
      }}>G</div>
      <span className="serif" style={{fontSize:size, fontWeight:600, letterSpacing:"-.02em", color: inverted?"#fff":"var(--ink)"}}>Gavelogy</span>
    </div>
  );
}

/* ---------- Marketing nav ---------- */
function MarketingNav({route, go}){
  return (
    <header style={{
      position:"sticky", top:0, zIndex:40,
      background:"color-mix(in oklab, var(--bg) 86%, transparent)",
      backdropFilter:"saturate(140%) blur(8px)",
      borderBottom:"1px solid var(--border)",
    }}>
      <div style={{maxWidth:1200, margin:"0 auto", padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <a href="#/" onClick={(e)=>{e.preventDefault(); go("/")}}><Logo/></a>
        <nav style={{display:"flex", alignItems:"center", gap:28, fontSize:14, color:"var(--ink-2)"}}>
          <a href="#features" onClick={e=>{e.preventDefault(); document.getElementById('features')?.scrollIntoView({behavior:'smooth'})}} style={{cursor:"pointer"}}>Features</a>
          <a href="#pricing" onClick={e=>{e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'})}} style={{cursor:"pointer"}}>Pricing</a>
          <a href="#faq" onClick={e=>{e.preventDefault(); document.getElementById('faq')?.scrollIntoView({behavior:'smooth'})}} style={{cursor:"pointer"}}>FAQ</a>
          <a href="#/courses" onClick={e=>{e.preventDefault(); go('/courses')}} style={{cursor:"pointer"}}>Courses</a>
        </nav>
        <div style={{display:"flex", alignItems:"center", gap:8}}>
          <Btn variant="ghost" size="sm" onClick={()=>go("/login")}>Sign in</Btn>
          <Btn size="sm" onClick={()=>go("/signup")} trailing={I.arrow}>Get started</Btn>
        </div>
      </div>
    </header>
  );
}

function MarketingFooter({go}){
  const colTitle = {fontSize:11, fontWeight:600, letterSpacing:".14em", textTransform:"uppercase", color:"var(--ink-3)", marginBottom:14};
  const link = {display:"block", fontSize:14, color:"var(--ink-2)", padding:"5px 0", cursor:"pointer"};
  return (
    <footer style={{borderTop:"1px solid var(--border)", marginTop:96, background:"var(--panel)"}}>
      <div style={{maxWidth:1200, margin:"0 auto", padding:"64px 28px 40px", display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:48}}>
        <div>
          <Logo/>
          <p style={{fontSize:14, color:"var(--ink-2)", lineHeight:1.7, maxWidth:320, marginTop:16}}>
            Systematic CLAT&nbsp;PG preparation for India's most competitive postgraduate law aspirants. Built by rankers, for rankers.
          </p>
        </div>
        <div>
          <div style={colTitle}>Product</div>
          <a style={link} onClick={()=>go('/courses')}>Courses</a>
          <a style={link} onClick={()=>go('/dashboard')}>Dashboard</a>
          <a style={link} onClick={()=>go('/course-viewer')}>Study viewer</a>
          <a style={link} onClick={()=>go('/mistakes')}>Mistake tracker</a>
        </div>
        <div>
          <div style={colTitle}>Company</div>
          <a style={link}>About</a>
          <a style={link}>Mentors</a>
          <a style={link}>Press</a>
          <a style={link}>Contact</a>
        </div>
        <div>
          <div style={colTitle}>Legal</div>
          <a style={link}>Terms</a>
          <a style={link}>Privacy</a>
          <a style={link}>Refund policy</a>
        </div>
      </div>
      <div style={{borderTop:"1px solid var(--border)", padding:"20px 28px", maxWidth:1200, margin:"0 auto", display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--ink-3)"}}>
        <div>© 2026 Gavelogy Education Pvt. Ltd. · Bengaluru, India</div>
        <div style={{display:"flex", gap:18}}>
          <span>GST 29AAECG1234F1Z5</span>
          <span>support@gavelogy.in</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------- App sidebar ---------- */
function AppSidebar({route, go}){
  const items = [
    {k:"/dashboard", label:"Dashboard", icon:I.home},
    {k:"/courses", label:"Courses", icon:I.book},
    {k:"/course-viewer", label:"Study viewer", icon:I.notebook},
    {k:"/mistakes", label:"Mistakes", icon:I.target},
    {k:"/quiz", label:"Quiz", icon:I.bolt},
    {k:"/leaderboard", label:"Leaderboard", icon:I.trophy},
  ];
  const sec = [
    {k:"/profile", label:"Profile", icon:I.user},
    {k:"/", label:"Sign out", icon:I.chev},
  ];
  return (
    <aside style={{
      width:248, flexShrink:0, height:"100vh", position:"sticky", top:0,
      background:"var(--surface)", borderRight:"1px solid var(--border)",
      display:"flex", flexDirection:"column",
    }}>
      <div style={{padding:"20px 20px 16px"}}>
        <a href="#/" onClick={(e)=>{e.preventDefault(); go('/')}}><Logo size={18}/></a>
      </div>
      <div style={{padding:"0 12px"}}>
        <button style={{
          width:"100%", display:"flex", alignItems:"center", gap:8,
          padding:"8px 10px", background:"var(--panel)", border:"1px solid var(--border)",
          borderRadius:"var(--radius-sm)", color:"var(--ink-3)", fontSize:13, cursor:"pointer", textAlign:"left",
        }}>
          {I.search} <span>Jump to…</span>
          <span style={{marginLeft:"auto", fontSize:11, color:"var(--ink-3)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:4, padding:"1px 6px"}}>⌘K</span>
        </button>
      </div>
      <nav style={{padding:"16px 12px", display:"flex", flexDirection:"column", gap:2, flex:1, overflowY:"auto"}}>
        <div style={{fontSize:10, fontWeight:600, letterSpacing:".14em", textTransform:"uppercase", color:"var(--ink-3)", padding:"10px 10px 6px"}}>Study</div>
        {items.map(it=>{
          const active = route.path===it.k || (it.k!=="/" && route.path.startsWith(it.k));
          return (
            <a key={it.k} href={`#${it.k}`} onClick={(e)=>{e.preventDefault(); go(it.k)}} style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"8px 10px", borderRadius:"var(--radius-sm)",
              background: active?"var(--brand-soft)":"transparent",
              color: active?"var(--brand)":"var(--ink-2)",
              fontSize:13.5, fontWeight: active?600:500, cursor:"pointer",
              border: active?"1px solid var(--brand-border)":"1px solid transparent",
            }}>{it.icon}<span>{it.label}</span>{it.k==="/mistakes" && <span style={{marginLeft:"auto", fontSize:10, fontWeight:600, color:"var(--danger)", background:"var(--danger-soft)", padding:"2px 6px", borderRadius:999, border:"1px solid color-mix(in oklab, var(--danger) 18%, transparent)"}}>12</span>}</a>
          );
        })}
        <div style={{fontSize:10, fontWeight:600, letterSpacing:".14em", textTransform:"uppercase", color:"var(--ink-3)", padding:"16px 10px 6px"}}>Account</div>
        {sec.map(it=>(
          <a key={it.k+it.label} href={`#${it.k}`} onClick={(e)=>{e.preventDefault(); go(it.k)}} style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"8px 10px", borderRadius:"var(--radius-sm)",
            color:"var(--ink-2)", fontSize:13.5, cursor:"pointer",
          }}>{it.icon}<span>{it.label}</span></a>
        ))}
      </nav>
      <div style={{margin:12, padding:14, border:"1px solid var(--border)", borderRadius:"var(--radius)", background:"var(--panel)"}}>
        <div style={{fontSize:11, fontWeight:600, letterSpacing:".12em", color:"var(--ink-3)", textTransform:"uppercase", marginBottom:6}}>Your plan</div>
        <div style={{fontSize:13, fontWeight:600, color:"var(--ink)"}}>Bundle · Static + Cases</div>
        <div style={{fontSize:12, color:"var(--ink-2)", marginTop:2}}>CLAT PG 2027 cohort</div>
        <div style={{marginTop:10}}><Progress value={42} /></div>
        <div style={{fontSize:11, color:"var(--ink-3)", marginTop:6}}>42% course completion</div>
      </div>
    </aside>
  );
}

function AppTopbar({title, subtitle, actions, breadcrumb}){
  return (
    <div style={{
      padding:"20px 32px", borderBottom:"1px solid var(--border)",
      background:"color-mix(in oklab, var(--surface) 70%, transparent)",
      backdropFilter:"blur(6px)",
      display:"flex", alignItems:"center", justifyContent:"space-between", gap:24,
      position:"sticky", top:0, zIndex:10,
    }}>
      <div>
        {breadcrumb && <div style={{fontSize:12, color:"var(--ink-3)", marginBottom:4, display:"flex", alignItems:"center", gap:6}}>{breadcrumb}</div>}
        <h1 className="serif" style={{margin:0, fontSize:24, fontWeight:600, letterSpacing:"-.02em", color:"var(--ink)"}}>{title}</h1>
        {subtitle && <div style={{fontSize:13.5, color:"var(--ink-2)", marginTop:2}}>{subtitle}</div>}
      </div>
      <div style={{display:"flex", alignItems:"center", gap:10}}>
        {actions}
        <button style={{height:36, width:36, border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", background:"var(--surface)", color:"var(--ink-2)", cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center"}}>{I.bell}</button>
        <div style={{height:36, width:36, border:"1px solid var(--border)", borderRadius:999, background:"var(--panel)", color:"var(--ink)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontWeight:600, fontSize:13}}>AK</div>
      </div>
    </div>
  );
}

function AppLayout({route, go, children, title, subtitle, actions, breadcrumb}){
  return (
    <div style={{display:"flex", minHeight:"100vh", background:"var(--bg)"}}>
      <AppSidebar route={route} go={go}/>
      <main style={{flex:1, minWidth:0}}>
        <AppTopbar title={title} subtitle={subtitle} actions={actions} breadcrumb={breadcrumb}/>
        <div style={{padding:"28px 32px 80px"}}>{children}</div>
      </main>
    </div>
  );
}

Object.assign(window, { MarketingNav, MarketingFooter, AppSidebar, AppTopbar, AppLayout, Logo });
