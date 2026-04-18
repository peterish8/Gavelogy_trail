/* Dashboard page — the daily surface. */

function DashboardPage({route, go}){
  const [tab, setTab] = useState("overview");
  return (
    <AppLayout route={route} go={go}
      title="Welcome back, Aanya"
      subtitle={<span>You have <strong style={{color:"var(--ink)"}}>12 cards due</strong> for review today · current streak <strong style={{color:"var(--ink)"}}>14 days</strong></span>}
      actions={<Btn size="sm" leading={I.plus} onClick={()=>go('/quiz')}>Start review</Btn>}
    >
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20}}>
        <Tabs value={tab} onChange={setTab} items={[
          {value:"overview", label:"Overview"},
          {value:"analytics", label:"Analytics"},
          {value:"courses", label:"Courses"},
        ]}/>
        <div style={{display:"flex", gap:8}}>
          <Btn size="sm" variant="outline" leading={I.calendar}>Apr 2026</Btn>
          <Btn size="sm" variant="outline" leading={I.filter}>Filter</Btn>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"var(--gap)", marginBottom:"var(--gap)"}}>
        <Card>
          <Stat label="Accuracy (30d)" value="76%" hint="+8 pts vs last month" trailing={<Badge tone="success" size="sm">↑ 8</Badge>}/>
          <div style={{marginTop:14}}><Sparkline points={[52,58,55,61,64,68,66,72,70,74,76]} width={220} height={38}/></div>
        </Card>
        <Card>
          <Stat label="Questions / day" value="48" hint="Target: 50" />
          <div style={{marginTop:14}}><Progress value={48} max={50}/></div>
          <div style={{fontSize:12, color:"var(--ink-3)", marginTop:8}}>96% of goal</div>
        </Card>
        <Card>
          <Stat label="Cards due" value="12" hint="Across 4 subjects"/>
          <div style={{marginTop:14, display:"flex", gap:6, flexWrap:"wrap"}}>
            <Badge tone="neutral">Const · 5</Badge>
            <Badge tone="neutral">Contract · 4</Badge>
            <Badge tone="neutral">IPR · 2</Badge>
            <Badge tone="neutral">Torts · 1</Badge>
          </div>
        </Card>
        <Card>
          <Stat label="Mock percentile" value="82" hint="Mock #14 · Apr 11"/>
          <div style={{marginTop:14}}><Sparkline points={[58,60,62,68,65,70,72,74,76,79,82]} width={220} height={38} color="var(--success)"/></div>
        </Card>
      </div>

      {/* Two-col */}
      <div style={{display:"grid", gridTemplateColumns:"2fr 1fr", gap:"var(--gap)"}}>
        {/* Left column */}
        <div style={{display:"flex", flexDirection:"column", gap:"var(--gap)"}}>
          {/* Performance panel */}
          <Card>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18}}>
              <div>
                <div style={{fontSize:15, fontWeight:600, color:"var(--ink)"}}>Accuracy by subject</div>
                <div style={{fontSize:12.5, color:"var(--ink-3)", marginTop:2}}>Last 30 days · across 13 static subjects</div>
              </div>
              <Tabs dense value="30d" onChange={()=>{}} items={[
                {value:"7d", label:"7d"},{value:"30d", label:"30d"},{value:"all", label:"All"}
              ]}/>
            </div>
            {[
              {s:"Constitutional Law", a:84, q:214, c:"var(--success)"},
              {s:"Criminal Law", a:78, q:168, c:"var(--success)"},
              {s:"Contract Law", a:71, q:142, c:"var(--brand)"},
              {s:"Jurisprudence", a:64, q:96, c:"var(--warn)"},
              {s:"IPR", a:58, q:72, c:"var(--warn)"},
              {s:"Tax Law", a:46, q:54, c:"var(--danger)"},
            ].map(r=>(
              <div key={r.s} style={{display:"grid", gridTemplateColumns:"180px 1fr 50px 60px", alignItems:"center", gap:14, padding:"10px 0", borderBottom:"1px solid var(--border)"}}>
                <div style={{fontSize:13.5, color:"var(--ink)", fontWeight:500}}>{r.s}</div>
                <div style={{height:8, background:"var(--panel)", borderRadius:999, overflow:"hidden", border:"1px solid var(--border)"}}>
                  <div style={{height:"100%", width:`${r.a}%`, background:r.c}}/>
                </div>
                <div className="mono" style={{fontSize:12.5, color:"var(--ink-2)", textAlign:"right"}}>{r.a}%</div>
                <div style={{fontSize:11.5, color:"var(--ink-3)", textAlign:"right"}}>{r.q} Q</div>
              </div>
            ))}
            <div style={{marginTop:14, display:"flex", gap:8, justifyContent:"flex-end"}}>
              <Btn size="sm" variant="ghost" trailing={I.arrow}>See full report</Btn>
            </div>
          </Card>

          {/* Spaced repetition calendar */}
          <Card>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
              <div>
                <div style={{fontSize:15, fontWeight:600}}>Review calendar</div>
                <div style={{fontSize:12.5, color:"var(--ink-3)", marginTop:2}}>30‑day spaced repetition schedule</div>
              </div>
              <div style={{display:"flex", gap:10, fontSize:11, color:"var(--ink-3)"}}>
                <span style={{display:"inline-flex", alignItems:"center", gap:4}}><span style={{width:10, height:10, borderRadius:2, background:"var(--panel)"}}/> None</span>
                <span style={{display:"inline-flex", alignItems:"center", gap:4}}><span style={{width:10, height:10, borderRadius:2, background:"color-mix(in oklab, var(--brand) 25%, var(--panel))"}}/> Low</span>
                <span style={{display:"inline-flex", alignItems:"center", gap:4}}><span style={{width:10, height:10, borderRadius:2, background:"color-mix(in oklab, var(--brand) 60%, var(--panel))"}}/> Med</span>
                <span style={{display:"inline-flex", alignItems:"center", gap:4}}><span style={{width:10, height:10, borderRadius:2, background:"var(--brand)"}}/> High</span>
              </div>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(30, 1fr)", gap:4}}>
              {Array.from({length:30}).map((_,i)=>{
                const vals = [0,1,2,3,1,0,2,3,1,2,3,1,2,3,2,1,0,2,1,3,2,1,0,1,2,3,2,1,0,2];
                const v = vals[i]||0;
                const bg = v===0?"var(--panel)":v===1?"color-mix(in oklab, var(--brand) 20%, var(--panel))":v===2?"color-mix(in oklab, var(--brand) 55%, var(--panel))":"var(--brand)";
                return <div key={i} title={`Apr ${i+1}`} style={{aspectRatio:"1", background:bg, borderRadius:3, border:"1px solid var(--border)", cursor:"pointer"}}/>;
              })}
            </div>
            <div style={{marginTop:12, display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:12, color:"var(--ink-3)"}}>
              <span>Apr 1 — Apr 30</span>
              <span>342 cards reviewed this month</span>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div style={{display:"flex", flexDirection:"column", gap:"var(--gap)"}}>
          <Card>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12}}>
              <div style={{fontSize:15, fontWeight:600}}>Today's plan</div>
              <Badge tone="brand" size="sm">Auto‑generated</Badge>
            </div>
            {[
              {t:"Review 12 due cards", d:"Constitutional · Contract · IPR", i:I.target, done:false, tone:"brand"},
              {t:"Article 21 — Post Maneka", d:"Continue where you left off", i:I.book, done:false, tone:"neutral"},
              {t:"Mock #15 — Section I (Const.)", d:"45 minutes · 60 Q", i:I.clock, done:false, tone:"neutral"},
              {t:"Weekly reflection", d:"3 mins · what went well", i:I.edit, done:true, tone:"neutral"},
            ].map((x,i)=>(
              <div key={i} style={{display:"flex", gap:12, padding:"12px 0", borderBottom:i<3?"1px solid var(--border)":"none"}}>
                <div style={{width:28, height:28, borderRadius:"var(--radius-sm)", background: x.done?"var(--success-soft)":"var(--panel)", color: x.done?"var(--success)":"var(--ink-2)", display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:"1px solid var(--border)"}}>
                  {x.done ? I.check : x.i}
                </div>
                <div style={{minWidth:0, flex:1}}>
                  <div style={{fontSize:13.5, fontWeight:500, color:"var(--ink)", textDecoration: x.done?"line-through":"none", opacity: x.done?.6:1}}>{x.t}</div>
                  <div style={{fontSize:12, color:"var(--ink-3)", marginTop:1}}>{x.d}</div>
                </div>
              </div>
            ))}
          </Card>

          <Card>
            <div style={{fontSize:15, fontWeight:600, marginBottom:12}}>Recent activity</div>
            {[
              {t:"Mock #14 completed", s:"82 percentile · 70/120", ago:"2h", i:I.trophy, c:"var(--success)"},
              {t:"12 cards added to review", s:"From Jurisprudence quiz", ago:"5h", i:I.target, c:"var(--brand)"},
              {t:"Module: Art. 19 finished", s:"Constitutional Law", ago:"1d", i:I.book, c:"var(--ink-2)"},
              {t:"Contemporary: Apr 2025", s:"8 cases read · 6 quizzed", ago:"2d", i:I.scale, c:"var(--ink-2)"},
              {t:"Joined weekly cohort call", s:"Mentors: Aarav, Priya", ago:"3d", i:I.headphones, c:"var(--ink-2)"},
            ].map((x,i)=>(
              <div key={i} style={{display:"flex", gap:12, padding:"10px 0", borderBottom:i<4?"1px solid var(--border)":"none"}}>
                <div style={{width:28, height:28, borderRadius:999, background:"var(--panel)", color:x.c, display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:"1px solid var(--border)"}}>{x.i}</div>
                <div style={{minWidth:0, flex:1}}>
                  <div style={{fontSize:13, fontWeight:500, color:"var(--ink)"}}>{x.t}</div>
                  <div style={{fontSize:12, color:"var(--ink-3)"}}>{x.s}</div>
                </div>
                <div style={{fontSize:11.5, color:"var(--ink-3)", whiteSpace:"nowrap"}}>{x.ago}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

Object.assign(window, { DashboardPage });
