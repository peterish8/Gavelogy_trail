/* Login + Signup */

function AuthPage({mode, route, go}){
  const isLogin = mode==="login";
  return (
    <div style={{minHeight:"100vh", display:"grid", gridTemplateColumns:"1fr 1fr", background:"var(--bg)"}}>
      {/* Left panel — scholarly, typographic */}
      <div style={{background:"var(--ink)", color:"#F5F3ED", padding:"56px 64px", display:"flex", flexDirection:"column", justifyContent:"space-between", position:"relative", overflow:"hidden"}}>
        <div aria-hidden style={{position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(0deg, transparent 0 34px, rgba(255,255,255,.04) 34px 35px)", pointerEvents:"none"}}/>
        <div style={{position:"relative"}}>
          <Logo inverted/>
        </div>
        <div style={{position:"relative", maxWidth:480}}>
          <div style={{color:"#B5A98C", marginBottom:18}}>{I.quote}</div>
          <p className="serif" style={{fontSize:28, lineHeight:1.35, letterSpacing:"-.015em", fontWeight:500, margin:0, color:"#F5F3ED"}}>
            Preparation is not a feeling. It's a system that turns every wrong answer into a lesson, and every lesson into a reflex.
          </p>
          <div style={{marginTop:22, fontSize:13.5, color:"#B5A98C"}}>— The Gavelogy method</div>
        </div>
        <div style={{position:"relative", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:1, border:"1px solid rgba(255,255,255,.08)", borderRadius:"var(--radius)", overflow:"hidden", maxWidth:520}}>
          {[["2,400+","Aspirants"],["AIR 47","Top rank"],["82%","Avg. mock %ile"]].map(([v,k])=>(
            <div key={k} style={{padding:"18px 18px", background:"rgba(255,255,255,.02)"}}>
              <div className="serif" style={{fontSize:22, fontWeight:600, color:"#F5F3ED", letterSpacing:"-.01em"}}>{v}</div>
              <div style={{fontSize:11, letterSpacing:".14em", color:"#B5A98C", textTransform:"uppercase", marginTop:2, fontWeight:600}}>{k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{display:"flex", alignItems:"center", justifyContent:"center", padding:"48px 40px"}}>
        <div style={{width:"100%", maxWidth:420}}>
          <div style={{fontSize:13, color:"var(--ink-3)", marginBottom:8}}>
            {isLogin ? "New to Gavelogy?" : "Already have an account?"}
            <a onClick={()=>go(isLogin?'/signup':'/login')} style={{color:"var(--brand)", fontWeight:600, cursor:"pointer", marginLeft:6}}>{isLogin?"Create an account":"Sign in"}</a>
          </div>
          <h1 className="serif" style={{fontSize:36, letterSpacing:"-.02em", fontWeight:500, margin:"4px 0 6px"}}>{isLogin?"Welcome back.":"Create your account."}</h1>
          <p style={{fontSize:14.5, color:"var(--ink-2)", margin:"0 0 24px", lineHeight:1.55}}>{isLogin?"Pick up where you left off on Article 21.":"Start with a 7‑day free trial. No card required."}</p>

          <Btn variant="outline" size="lg" style={{width:"100%", marginBottom:10}} leading={
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.99.66-2.25 1.05-3.72 1.05-2.86 0-5.28-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.85 14.09a6.62 6.62 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.67-2.84Z"/><path fill="#EA4335" d="M12 4.75c1.62 0 3.07.56 4.21 1.65l3.16-3.16C17.45 1.49 14.97.5 12 .5A11 11 0 0 0 2.18 7.07l3.67 2.84C6.72 6.68 9.14 4.75 12 4.75Z"/></svg>
          }>Continue with Google</Btn>

          <div style={{display:"flex", alignItems:"center", gap:12, margin:"18px 0"}}>
            <div style={{flex:1, height:1, background:"var(--border)"}}/>
            <span style={{fontSize:11, color:"var(--ink-3)", letterSpacing:".14em", textTransform:"uppercase"}}>or</span>
            <div style={{flex:1, height:1, background:"var(--border)"}}/>
          </div>

          <div style={{display:"flex", flexDirection:"column", gap:14}}>
            {!isLogin && <Input label="Full name" placeholder="Aanya Khanna"/>}
            <Input label="Email" type="email" placeholder="you@college.edu"/>
            <Input label="Password" type="password" placeholder="••••••••" trailing={<span style={{fontSize:12, color:"var(--brand)", fontWeight:600, cursor:"pointer"}}>{isLogin?"Forgot?":""}</span>}/>
            {!isLogin && (
              <label style={{display:"flex", gap:10, alignItems:"flex-start", fontSize:12.5, color:"var(--ink-2)", lineHeight:1.55}}>
                <input type="checkbox" defaultChecked style={{marginTop:3}}/>
                <span>I agree to the <a style={{color:"var(--brand)", fontWeight:600}}>Terms</a> and <a style={{color:"var(--brand)", fontWeight:600}}>Privacy Policy</a>.</span>
              </label>
            )}
          </div>

          <Btn size="lg" style={{width:"100%", marginTop:18}} onClick={()=>go('/dashboard')} trailing={I.arrow}>
            {isLogin?"Sign in":"Create account"}
          </Btn>

          <div style={{fontSize:12, color:"var(--ink-3)", textAlign:"center", marginTop:18, lineHeight:1.55}}>
            Protected by industry‑standard encryption.<br/>
            Your study data stays on our servers in Mumbai (ap‑south‑1).
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AuthPage });
