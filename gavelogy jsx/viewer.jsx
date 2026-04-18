/* Course viewer — the core product experience */

function CourseViewerPage({route, go}){
  const [ttsPlaying, setTts] = useState(false);
  const [sidebarW] = useState(240);
  const [railW] = useState(260);

  const modules = [
    {t:"Module 01 · The Preamble", items:[{t:"Preamble — text & intent", done:true},{t:"Constituent Assembly debates", done:true}]},
    {t:"Module 02 · Fundamental Rights", items:[{t:"Art. 12 — State", done:true},{t:"Art. 13 — Void laws", done:true},{t:"Art. 14 — Equality", done:true},{t:"Art. 19 — Liberty", done:true},{t:"Art. 21 — Life & Liberty", active:true},{t:"Art. 32 — Remedies", done:false},]},
    {t:"Module 03 · DPSP", items:[{t:"Art. 36–51 — Directives", done:false},{t:"DPSP vs FR — balance", done:false}]},
  ];

  return (
    <div style={{display:"flex", minHeight:"100vh", background:"var(--bg)"}}>
      <AppSidebar route={route} go={go}/>
      <main style={{flex:1, minWidth:0, display:"flex", flexDirection:"column"}}>
        {/* Viewer topbar */}
        <div style={{padding:"14px 24px", borderBottom:"1px solid var(--border)", background:"var(--surface)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16}}>
          <div style={{display:"flex", alignItems:"center", gap:12, fontSize:12.5, color:"var(--ink-3)"}}>
            <a onClick={()=>go('/courses')} style={{cursor:"pointer"}}>Courses</a>{I.chev}
            <span>Static Subjects</span>{I.chev}
            <span>Constitutional Law</span>{I.chev}
            <span style={{color:"var(--ink)", fontWeight:500}}>Article 21</span>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <Btn size="sm" variant="outline" leading={ttsPlaying?I.pause:I.play} onClick={()=>setTts(!ttsPlaying)}>{ttsPlaying?"Pause":"Listen"}</Btn>
            <Btn size="sm" variant="outline" leading={I.edit}>Annotate</Btn>
            <Btn size="sm" variant="outline" leading={I.bolt}>Quiz me</Btn>
            <span style={{width:1, height:24, background:"var(--border)"}}/>
            <Btn size="sm" variant="ghost" leading={I.settings}/>
          </div>
        </div>

        <div style={{display:"grid", gridTemplateColumns:`${sidebarW}px 1fr ${railW}px`, flex:1, minHeight:0}}>
          {/* Table of contents */}
          <div style={{borderRight:"1px solid var(--border)", background:"var(--surface)", padding:"20px 14px", overflowY:"auto"}}>
            <div style={{padding:"0 8px 14px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".14em"}}>Course</div>
                <div style={{fontSize:14, fontWeight:600, color:"var(--ink)", marginTop:2}}>Constitutional Law</div>
              </div>
              <Badge tone="brand" size="sm">42%</Badge>
            </div>
            {modules.map(m=>(
              <div key={m.t} style={{marginBottom:12}}>
                <div style={{padding:"6px 8px", fontSize:11, fontWeight:600, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".12em"}}>{m.t}</div>
                {m.items.map(it=>(
                  <div key={it.t} style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding:"7px 8px", borderRadius:"var(--radius-sm)", marginBottom:2,
                    background: it.active?"var(--brand-soft)":"transparent",
                    color: it.active?"var(--brand)":"var(--ink-2)",
                    fontSize:13, fontWeight: it.active?600:500, cursor:"pointer",
                    border: it.active?"1px solid var(--brand-border)":"1px solid transparent",
                  }}>
                    <span style={{width:14, height:14, borderRadius:4, border:"1px solid var(--border-strong)", background: it.done?"var(--success)":"var(--surface)", display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                      {it.done && <span style={{color:"#fff", fontSize:9}}>✓</span>}
                    </span>
                    <span style={{whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{it.t}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Reading pane */}
          <div style={{padding:"40px 48px 80px", overflowY:"auto", width:"100%", minWidth:0}}>
            <div style={{fontSize:11.5, color:"var(--ink-3)", letterSpacing:".14em", textTransform:"uppercase", fontWeight:600, marginBottom:10}}>
              Constitutional Law · Part III · Article 21
            </div>
            <h1 className="serif" style={{fontSize:42, letterSpacing:"-.025em", lineHeight:1.1, fontWeight:500, margin:"0 0 12px"}}>
              Right to Life and Personal Liberty
            </h1>
            <div style={{display:"flex", gap:18, fontSize:12.5, color:"var(--ink-3)", marginBottom:28}}>
              <span style={{display:"inline-flex", alignItems:"center", gap:4}}>{I.clock} 18 min read</span>
              <span style={{display:"inline-flex", alignItems:"center", gap:4}}>{I.notebook} 7 cases</span>
              <span style={{display:"inline-flex", alignItems:"center", gap:4}}>Author: Aarav Menon (NLSIU '22)</span>
            </div>
            <p style={{fontSize:17, lineHeight:1.8, color:"var(--ink)", margin:"0 0 18px", fontFamily:"'Source Serif 4', Georgia, serif"}}>
              Article 21 of the Constitution of India guarantees that "no person shall be deprived of his life or personal liberty except according to procedure established by law." It is the most litigated of all fundamental rights, and its expansive judicial reading has made it the fountainhead of unenumerated rights in Indian constitutional law.
            </p>
            <p style={{fontSize:17, lineHeight:1.8, color:"var(--ink-2)", margin:"0 0 22px", fontFamily:"'Source Serif 4', Georgia, serif"}}>
              The foundational turn came in <em>Maneka Gandhi v. Union of India</em> (1978), where the Supreme Court overruled the restrictive interpretation of <em>A.K. Gopalan</em> and held that the "procedure" contemplated by Article 21 must be fair, just and reasonable — effectively importing a substantive due process standard into Indian jurisprudence.
            </p>

            <div style={{margin:"26px 0", padding:"18px 22px", borderLeft:"3px solid var(--brand)", background:"var(--brand-soft)", borderRadius:"0 var(--radius-sm) var(--radius-sm) 0"}}>
              <div style={{fontSize:11, fontWeight:700, color:"var(--brand)", letterSpacing:".14em", textTransform:"uppercase"}}>Landmark case</div>
              <div className="serif" style={{fontSize:18, fontWeight:600, marginTop:6}}>Maneka Gandhi v. Union of India</div>
              <div style={{fontSize:13, color:"var(--ink-2)", marginTop:4}}>AIR 1978 SC 597 · 7‑judge bench</div>
              <p style={{fontSize:14, color:"var(--ink-2)", marginTop:10, lineHeight:1.65, marginBottom:0}}>
                Held that Articles 14, 19 and 21 are not mutually exclusive; any procedure that deprives life or liberty must survive the twin tests of non‑arbitrariness and reasonableness.
              </p>
            </div>

            <h2 className="serif" style={{fontSize:26, fontWeight:600, letterSpacing:"-.015em", margin:"32px 0 10px"}}>1. Scope of "life"</h2>
            <p style={{fontSize:17, lineHeight:1.8, color:"var(--ink-2)", margin:"0 0 18px", fontFamily:"'Source Serif 4', Georgia, serif"}}>
              In <em>Francis Coralie Mullin v. Administrator, UT of Delhi</em> (1981), Bhagwati J. observed that the right to life is not confined to mere animal existence — it includes the right to live with human dignity and all that goes along with it: adequate nutrition, clothing, shelter, and the facilities for reading, writing and expressing oneself.
            </p>
            <ul style={{fontSize:16, lineHeight:1.8, color:"var(--ink-2)", paddingLeft:22, fontFamily:"'Source Serif 4', Georgia, serif"}}>
              <li>Right to livelihood — <em>Olga Tellis v. BMC</em> (1985)</li>
              <li>Right to shelter — <em>Chameli Singh v. State of UP</em> (1996)</li>
              <li>Right to health — <em>Parmanand Katara v. UoI</em> (1989)</li>
              <li>Right to privacy — <em>K.S. Puttaswamy v. UoI</em> (2017)</li>
            </ul>

            {/* End-of-section action bar */}
            <div style={{marginTop:36, padding:"16px 20px", border:"1px solid var(--border)", borderRadius:"var(--radius)", background:"var(--panel)", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <div style={{fontSize:13.5, color:"var(--ink-2)"}}>Mark this section complete to unlock the 14‑question quiz.</div>
              <div style={{display:"flex", gap:8}}>
                <Btn size="sm" variant="outline">Save for later</Btn>
                <Btn size="sm" onClick={()=>go('/quiz')} trailing={I.arrow}>Mark complete</Btn>
              </div>
            </div>
          </div>

          {/* Right rail */}
          <div style={{borderLeft:"1px solid var(--border)", background:"var(--panel)", padding:"20px 18px", overflowY:"auto"}}>
            <SectionLabel style={{marginBottom:10}}>Your progress</SectionLabel>
            <Card style={{marginBottom:12}}>
              <div style={{fontSize:12.5, color:"var(--ink-2)"}}>Accuracy · Article 21</div>
              <div className="serif" style={{fontSize:26, fontWeight:600, marginTop:4, letterSpacing:"-.015em"}}>78%</div>
              <div style={{marginTop:8}}><Progress value={78}/></div>
              <div style={{fontSize:11.5, color:"var(--ink-3)", marginTop:8}}>28 of 36 Q correct</div>
            </Card>
            <Card style={{marginBottom:18}}>
              <div style={{fontSize:12.5, color:"var(--ink-2)"}}>Due for review</div>
              <div className="serif" style={{fontSize:26, fontWeight:600, marginTop:4}}>6 cards</div>
              <div style={{fontSize:11.5, color:"var(--ink-3)"}}>via spaced repetition</div>
              <Btn size="sm" variant="secondary" style={{marginTop:10, width:"100%"}} onClick={()=>go('/quiz')}>Review now</Btn>
            </Card>

            <SectionLabel style={{marginBottom:10}}>Key cases in this chapter</SectionLabel>
            {[
              "Maneka Gandhi v. UoI (1978)",
              "Olga Tellis v. BMC (1985)",
              "K.S. Puttaswamy v. UoI (2017)",
              "Francis Coralie Mullin (1981)",
            ].map(c=>(
              <div key={c} style={{padding:"8px 10px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", marginBottom:6, fontSize:12.5, color:"var(--ink-2)", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer"}}>
                <span>{c}</span>{I.external}
              </div>
            ))}
          </div>
        </div>

        {/* TTS mini-player */}
        {ttsPlaying && (
          <div style={{position:"sticky", bottom:0, padding:"12px 20px", borderTop:"1px solid var(--border)", background:"var(--surface)", display:"flex", alignItems:"center", gap:14, boxShadow:"var(--s3)"}}>
            <Btn size="sm" onClick={()=>setTts(false)} leading={I.pause}>Pause</Btn>
            <div style={{fontSize:13, color:"var(--ink-2)"}}>Listening · Article 21 · 2:14 / 18:06</div>
            <div style={{flex:1, height:4, background:"var(--panel)", borderRadius:999, overflow:"hidden"}}><div style={{width:"14%", height:"100%", background:"var(--brand)"}}/></div>
            <Btn size="sm" variant="ghost">1.0x</Btn>
          </div>
        )}
      </main>
    </div>
  );
}

Object.assign(window, { CourseViewerPage });
