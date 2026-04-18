/* Landing page — the conversion-critical one. */

function AnnouncementBar({go}){
  return (
    <div style={{borderBottom:"1px solid var(--border)", background:"var(--panel)"}}>
      <div style={{maxWidth:1200, margin:"0 auto", padding:"8px 28px", display:"flex", alignItems:"center", justifyContent:"center", gap:12, fontSize:13, color:"var(--ink-2)"}}>
        <Badge tone="brand" size="xs" style={{textTransform:"uppercase", letterSpacing:".12em"}}>New</Badge>
        <span>CLAT PG 2027 mock series — now included with every bundle.</span>
        <a onClick={(e)=>{e.preventDefault(); go('/courses')}} style={{cursor:"pointer", color:"var(--brand)", fontWeight:600, display:"inline-flex", alignItems:"center", gap:4}}>Read more {I.chev}</a>
      </div>
    </div>
  );
}

function Hero({go}){
  return (
    <section style={{padding:"72px 28px 80px", maxWidth:1200, margin:"0 auto", position:"relative"}}>
      {/* quiet backdrop: hairline vertical rules, no blobs */}
      <div aria-hidden style={{position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(90deg, transparent 0 119px, var(--border) 119px 120px)", opacity:.55, pointerEvents:"none", maskImage:"linear-gradient(to bottom, transparent, #000 20%, #000 80%, transparent)"}}/>
      <div style={{position:"relative"}}>
        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:22}}>
          <Badge tone="outline" size="sm"><span style={{color:"var(--brand)", marginRight:4}}>●</span>For the CLAT PG 2027 cohort</Badge>
        </div>
        <h1 className="serif" style={{
          fontSize:"clamp(44px, 6vw, 76px)", lineHeight:1.04, letterSpacing:"-.025em",
          margin:0, fontWeight:500, color:"var(--ink)", maxWidth:900,
        }}>
          A serious preparation<br/>
          platform for India's most<br/>
          <em style={{fontStyle:"italic", color:"var(--brand)"}}>competitive law exam.</em>
        </h1>
        <p style={{fontSize:19, lineHeight:1.6, color:"var(--ink-2)", marginTop:22, maxWidth:620}}>
          Gavelogy tracks every mistake you make, rebuilds weak concepts with spaced repetition, and takes you from 50% to 80%+ accuracy — on the same syllabus NLU rankers study.
        </p>
        <div style={{display:"flex", gap:10, marginTop:28, alignItems:"center"}}>
          <Btn size="lg" onClick={()=>go('/signup')} trailing={I.arrow}>Start 7‑day free trial</Btn>
          <Btn size="lg" variant="outline" onClick={()=>document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'})}>View pricing</Btn>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:18, marginTop:20, fontSize:13, color:"var(--ink-3)"}}>
          <span style={{display:"inline-flex", alignItems:"center", gap:6}}>{I.check} No card required</span>
          <span style={{display:"inline-flex", alignItems:"center", gap:6}}>{I.check} 600+ questions free</span>
          <span style={{display:"inline-flex", alignItems:"center", gap:6}}>{I.check} Cancel anytime</span>
        </div>

        {/* Proof row */}
        <div style={{marginTop:56, paddingTop:28, borderTop:"1px solid var(--border)", display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:32}}>
          {[
            {k:"Students enrolled", v:"2,400+"},
            {k:"NLU rankers on faculty", v:"11"},
            {k:"Questions in bank", v:"12,800"},
            {k:"Average accuracy lift", v:"+23 pts"},
          ].map(s=>(
            <div key={s.k}>
              <div className="serif" style={{fontSize:32, fontWeight:600, letterSpacing:"-.02em", color:"var(--ink)"}}>{s.v}</div>
              <div style={{fontSize:12.5, color:"var(--ink-3)", marginTop:2, letterSpacing:".02em"}}>{s.k}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductPreview(){
  // A polished, static mock of the viewer surface — shown in a framed browser-chrome.
  return (
    <section style={{padding:"0 28px", maxWidth:1200, margin:"0 auto"}}>
      <div style={{
        border:"1px solid var(--border)", borderRadius:"calc(var(--radius) + 4px)",
        background:"var(--surface)", boxShadow:"var(--s3)", overflow:"hidden",
      }}>
        <div style={{display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderBottom:"1px solid var(--border)", background:"var(--panel)"}}>
          <div style={{display:"flex", gap:6}}>
            <span style={{width:10, height:10, borderRadius:999, background:"#E5E5DF"}}/>
            <span style={{width:10, height:10, borderRadius:999, background:"#E5E5DF"}}/>
            <span style={{width:10, height:10, borderRadius:999, background:"#E5E5DF"}}/>
          </div>
          <div style={{flex:1, textAlign:"center", fontSize:12, color:"var(--ink-3)"}}>gavelogy.in / study / constitutional‑law / article‑21</div>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"220px 1fr 280px", minHeight:420}}>
          {/* sidebar */}
          <div style={{borderRight:"1px solid var(--border)", padding:"16px 12px", fontSize:12.5}}>
            <div style={{fontSize:10, fontWeight:700, color:"var(--ink-3)", letterSpacing:".14em", textTransform:"uppercase", padding:"0 6px 8px"}}>Module 04</div>
            {["The Preamble","Fundamental Rights","Art. 14 — Equality","Art. 19 — Liberty","Art. 21 — Life","Art. 32 — Remedies","DPSP"].map((t,i)=>(
              <div key={t} style={{
                padding:"7px 10px", borderRadius:"var(--radius-sm)", marginBottom:2,
                background: i===4?"var(--brand-soft)":"transparent",
                color: i===4?"var(--brand)":"var(--ink-2)",
                fontWeight: i===4?600:500,
                display:"flex", alignItems:"center", gap:8,
              }}>
                <span style={{width:16, height:16, borderRadius:4, background: i<4?"var(--success-soft)":"var(--panel)", color: i<4?"var(--success)":"var(--ink-3)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:10}}>{i<4?"✓":i+1}</span>
                {t}
              </div>
            ))}
          </div>
          {/* content */}
          <div style={{padding:"32px 44px"}}>
            <div style={{fontSize:11, color:"var(--ink-3)", letterSpacing:".14em", textTransform:"uppercase", fontWeight:600}}>Constitutional Law · Article 21</div>
            <h3 className="serif" style={{fontSize:28, letterSpacing:"-.02em", fontWeight:600, margin:"6px 0 14px"}}>Right to Life and Personal Liberty</h3>
            <p style={{fontSize:14.5, lineHeight:1.75, color:"var(--ink-2)", margin:0}}>
              Article 21 guarantees that no person shall be deprived of his life or personal liberty except according to procedure established by law. Post <em>Maneka Gandhi v. Union of India</em> (1978), the Supreme Court read "procedure" to mean a fair, just and reasonable procedure — importing a due process standard.
            </p>
            <div style={{marginTop:18, padding:"14px 16px", borderLeft:"3px solid var(--brand)", background:"var(--brand-soft)", borderRadius:"0 var(--radius-sm) var(--radius-sm) 0"}}>
              <div style={{fontSize:11, fontWeight:700, color:"var(--brand)", letterSpacing:".12em", textTransform:"uppercase"}}>Key case</div>
              <div style={{fontSize:14, color:"var(--ink)", marginTop:4, fontWeight:500}}>Maneka Gandhi v. Union of India, AIR 1978 SC 597</div>
            </div>
          </div>
          {/* right rail */}
          <div style={{borderLeft:"1px solid var(--border)", padding:"20px 20px", fontSize:12.5, background:"var(--panel)"}}>
            <div style={{fontSize:10, fontWeight:700, color:"var(--ink-3)", letterSpacing:".14em", textTransform:"uppercase", marginBottom:10}}>Your progress</div>
            <div style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:12, marginBottom:10}}>
              <div style={{fontSize:12, color:"var(--ink-2)"}}>Accuracy</div>
              <div className="serif" style={{fontSize:22, fontWeight:600, marginTop:2}}>78%</div>
              <Progress value={78}/>
            </div>
            <div style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:12}}>
              <div style={{fontSize:12, color:"var(--ink-2)"}}>Due for review</div>
              <div className="serif" style={{fontSize:22, fontWeight:600, marginTop:2}}>6 cards</div>
              <div style={{fontSize:11, color:"var(--ink-3)"}}>via spaced repetition</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features(){
  const feats = [
    {t:"Mistake‑first learning", d:"Every wrong answer becomes a card. Spaced repetition surfaces it at the exact moment you're about to forget — the single highest‑yield technique for law prep.", icon:I.target},
    {t:"Syllabus, not just questions", d:"13 static subjects — Constitutional, Criminal, Contract, Torts, Admin, Jurisprudence, Environment, Property, Family, Labour, Tax, Corporate, IPR. Structured, sectioned, sourced.", icon:I.book},
    {t:"Contemporary cases, curated", d:"150 judgments from 2023–2025, month‑wise, with headnote summaries and quiz‑able ratio. Written by NLU‑grad mentors — not ML scraped.", icon:I.scale},
    {t:"Judgment PDF reader", d:"Read bare judgments inside Gavelogy with a legal dictionary, citation expander, and TTS for when you're commuting.", icon:I.pdf},
    {t:"Confidence‑weighted scoring", d:"You mark each answer as certain or a guess. Your accuracy metric separates real mastery from lucky ticks.", icon:I.chart},
    {t:"Full‑length mocks", d:"20 CLAT‑PG pattern mocks with real‑world negative marking, sectional timers, and an honest percentile benchmark.", icon:I.clock},
  ];
  return (
    <section id="features" style={{padding:"88px 28px", maxWidth:1200, margin:"0 auto"}}>
      <div style={{maxWidth:680, marginBottom:48}}>
        <SectionLabel>What you get</SectionLabel>
        <h2 className="serif" style={{fontSize:44, letterSpacing:"-.02em", fontWeight:500, margin:"10px 0 12px", lineHeight:1.1}}>Every tool a serious aspirant actually uses.</h2>
        <p style={{fontSize:16.5, color:"var(--ink-2)", lineHeight:1.65, margin:0}}>No gimmicks, no streak badges to game. The product is narrow and deep: read, attempt, review, repeat.</p>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:0, border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden", background:"var(--surface)"}}>
        {feats.map((f,i)=>(
          <div key={f.t} style={{
            padding:"28px 28px 32px",
            borderRight: (i%3!==2)?"1px solid var(--border)":"none",
            borderBottom: (i<3)?"1px solid var(--border)":"none",
          }}>
            <div style={{width:36, height:36, borderRadius:"var(--radius-sm)", background:"var(--brand-soft)", color:"var(--brand)", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:14, border:"1px solid var(--brand-border)"}}>{f.icon}</div>
            <h3 className="serif" style={{fontSize:20, letterSpacing:"-.01em", fontWeight:600, margin:"0 0 6px"}}>{f.t}</h3>
            <p style={{fontSize:14, color:"var(--ink-2)", lineHeight:1.65, margin:0}}>{f.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonial(){
  return (
    <section style={{padding:"32px 28px 8px", maxWidth:1100, margin:"0 auto"}}>
      <div style={{padding:"40px 48px", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)"}}>
        <div style={{color:"var(--brand)", marginBottom:10}}>{I.quote}</div>
        <p className="serif" style={{fontSize:26, lineHeight:1.45, fontWeight:500, letterSpacing:"-.01em", color:"var(--ink)", margin:0, maxWidth:900}}>
          I used to do random PYQs and hope. Gavelogy turned preparation into a system — I saw the same mistakes returning and finally fixed them. Went from 54% to 82% accuracy in eleven weeks.
        </p>
        <div style={{display:"flex", alignItems:"center", gap:14, marginTop:26}}>
          <div style={{width:44, height:44, borderRadius:999, background:"var(--panel)", border:"1px solid var(--border)", color:"var(--ink)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontWeight:600}}>SR</div>
          <div>
            <div style={{fontSize:14.5, fontWeight:600, color:"var(--ink)"}}>Shruti Rao</div>
            <div style={{fontSize:13, color:"var(--ink-3)"}}>CLAT PG 2025 · AIR 47 · NLSIU Bengaluru</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing({go}){
  const feature = (t)=>(<li style={{display:"flex", alignItems:"flex-start", gap:10, fontSize:14, color:"var(--ink-2)", lineHeight:1.55, padding:"6px 0"}}><span style={{color:"var(--success)", marginTop:2, flexShrink:0}}>{I.check}</span>{t}</li>);
  return (
    <section id="pricing" style={{padding:"88px 28px", maxWidth:1200, margin:"0 auto"}}>
      <div style={{textAlign:"center", maxWidth:680, margin:"0 auto 48px"}}>
        <SectionLabel style={{textAlign:"center"}}>Pricing</SectionLabel>
        <h2 className="serif" style={{fontSize:44, letterSpacing:"-.02em", fontWeight:500, margin:"10px 0 12px"}}>One course. Two. Or the full prep.</h2>
        <p style={{fontSize:16, color:"var(--ink-2)", lineHeight:1.6, margin:0}}>No subscriptions. Pay once, get access until you write the exam.</p>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"var(--gap)", alignItems:"stretch"}}>
        {/* Static */}
        <Card style={{display:"flex", flexDirection:"column"}}>
          <div style={{fontSize:13, color:"var(--ink-2)", fontWeight:600}}>Static Subjects</div>
          <div style={{display:"flex", alignItems:"baseline", gap:10, marginTop:10}}>
            <span className="serif" style={{fontSize:42, fontWeight:600, letterSpacing:"-.02em"}}>₹1,999</span>
            <span style={{fontSize:13, color:"var(--ink-3)"}}>one‑time</span>
          </div>
          <p style={{fontSize:13.5, color:"var(--ink-2)", marginTop:8, lineHeight:1.55}}>13 law subjects · 650 questions · 20 full‑length mocks.</p>
          <ul style={{listStyle:"none", padding:0, margin:"18px 0 22px", flex:1}}>
            {feature("All 13 CLAT PG static subjects")}
            {feature("650 concept‑tagged MCQs")}
            {feature("20 full‑length pattern mocks")}
            {feature("Mistake tracker & spaced review")}
          </ul>
          <Btn variant="secondary" onClick={()=>go('/signup')}>Buy Static Subjects</Btn>
        </Card>

        {/* Bundle — recommended */}
        <Card style={{display:"flex", flexDirection:"column", border:"1px solid var(--ink)", boxShadow:"var(--s3)", position:"relative"}}>
          <div style={{position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:"var(--ink)", color:"var(--surface)", fontSize:11, fontWeight:600, letterSpacing:".12em", padding:"4px 12px", borderRadius:999, textTransform:"uppercase"}}>Recommended</div>
          <div style={{fontSize:13, color:"var(--ink-2)", fontWeight:600}}>Bundle · Static + Cases</div>
          <div style={{display:"flex", alignItems:"baseline", gap:10, marginTop:10}}>
            <span className="serif" style={{fontSize:42, fontWeight:600, letterSpacing:"-.02em"}}>₹2,999</span>
            <span style={{fontSize:14, color:"var(--ink-3)", textDecoration:"line-through"}}>₹3,498</span>
            <Badge tone="gold" size="sm">Save ₹500</Badge>
          </div>
          <p style={{fontSize:13.5, color:"var(--ink-2)", marginTop:8, lineHeight:1.55}}>Everything in Static plus three years of contemporary judgments.</p>
          <ul style={{listStyle:"none", padding:0, margin:"18px 0 22px", flex:1}}>
            {feature("Everything in Static Subjects")}
            {feature("150 contemporary cases (2023–25)")}
            {feature("Month‑wise combined quizzes")}
            {feature("Priority mentor replies (48h)")}
            {feature("Judgment PDF reader with TTS")}
          </ul>
          <Btn onClick={()=>go('/signup')} trailing={I.arrow}>Buy the bundle</Btn>
        </Card>

        {/* Contemporary */}
        <Card style={{display:"flex", flexDirection:"column"}}>
          <div style={{fontSize:13, color:"var(--ink-2)", fontWeight:600}}>Contemporary Cases</div>
          <div style={{display:"flex", alignItems:"baseline", gap:10, marginTop:10}}>
            <span className="serif" style={{fontSize:42, fontWeight:600, letterSpacing:"-.02em"}}>₹1,499</span>
            <span style={{fontSize:13, color:"var(--ink-3)"}}>one‑time</span>
          </div>
          <p style={{fontSize:13.5, color:"var(--ink-2)", marginTop:8, lineHeight:1.55}}>150 recent judgments, 2023–2025 · month‑wise quizzes.</p>
          <ul style={{listStyle:"none", padding:0, margin:"18px 0 22px", flex:1}}>
            {feature("50 landmark cases from 2023")}
            {feature("50 landmark cases from 2024")}
            {feature("50 recent cases from 2025")}
            {feature("Month‑wise combined quizzes")}
          </ul>
          <Btn variant="secondary" onClick={()=>go('/signup')}>Buy Contemporary Cases</Btn>
        </Card>
      </div>

      <div style={{marginTop:24, padding:"14px 20px", border:"1px dashed var(--border-strong)", borderRadius:"var(--radius)", display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:13.5, color:"var(--ink-2)"}}>
        <span><strong style={{color:"var(--ink)"}}>Student pricing:</strong> 20% off with a valid college ID. Apply at checkout.</span>
        <a style={{color:"var(--brand)", fontWeight:600, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:4}}>Eligibility {I.chev}</a>
      </div>
    </section>
  );
}

function Mentors(){
  const m = [
    {n:"Aarav Menon", c:"NLSIU '22 · Constitutional", i:"AM"},
    {n:"Priya Iyer", c:"NALSAR '21 · Contract & IPR", i:"PI"},
    {n:"Rohan Desai", c:"NLIU '23 · Criminal", i:"RD"},
    {n:"Kavya Nair", c:"NLU Delhi '22 · Jurisprudence", i:"KN"},
    {n:"Ishaan Shah", c:"WBNUJS '23 · Corporate & Tax", i:"IS"},
    {n:"Meera Saxena", c:"NALSAR '22 · Environment", i:"MS"},
  ];
  return (
    <section style={{padding:"72px 28px", maxWidth:1200, margin:"0 auto"}}>
      <div style={{display:"grid", gridTemplateColumns:"1fr 2fr", gap:48, alignItems:"start"}}>
        <div>
          <SectionLabel>Faculty</SectionLabel>
          <h2 className="serif" style={{fontSize:36, letterSpacing:"-.02em", fontWeight:500, margin:"10px 0 12px", lineHeight:1.15}}>Written by NLU graduates. Not scraped.</h2>
          <p style={{fontSize:15, color:"var(--ink-2)", lineHeight:1.65, margin:0}}>Every subject module is authored by a graduate of a top‑tier National Law University and reviewed by a practising advocate.</p>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14}}>
          {m.map(p=>(
            <div key={p.n} style={{padding:"18px", border:"1px solid var(--border)", borderRadius:"var(--radius)", background:"var(--surface)", display:"flex", alignItems:"center", gap:14}}>
              <div style={{width:44, height:44, borderRadius:999, background:"var(--panel)", border:"1px solid var(--border)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontWeight:600, fontSize:14, color:"var(--ink)"}}>{p.i}</div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:14, fontWeight:600, color:"var(--ink)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{p.n}</div>
                <div style={{fontSize:12, color:"var(--ink-3)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{p.c}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({q, a, open, onClick}){
  return (
    <div style={{borderBottom:"1px solid var(--border)"}}>
      <button onClick={onClick} style={{width:"100%", background:"transparent", border:0, padding:"22px 4px", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", color:"var(--ink)", fontFamily:"inherit"}}>
        <span className="serif" style={{fontSize:19, fontWeight:500, letterSpacing:"-.01em"}}>{q}</span>
        <span style={{color:"var(--ink-3)", transition:"transform .2s ease", transform: open?"rotate(45deg)":"none"}}>{I.plus}</span>
      </button>
      <div style={{maxHeight: open?240:0, overflow:"hidden", transition:"max-height .3s ease"}}>
        <p style={{fontSize:15, color:"var(--ink-2)", lineHeight:1.7, margin:"0 0 22px", maxWidth:720}}>{a}</p>
      </div>
    </div>
  );
}

function FAQ(){
  const [open, setOpen] = useState(0);
  const items = [
    {q:"How long do I get access after paying?", a:"Until you write the exam you bought the course for. If you're on the CLAT PG 2027 cohort, access continues through May 2027."},
    {q:"Is there a free trial?", a:"Yes — you get 7 days of full access, no card required. After that, Free includes 600 questions from the question bank with weekly reset."},
    {q:"How does the mistake tracker work?", a:"Every wrong answer becomes a spaced‑repetition card. Due cards are surfaced on your dashboard and in the viewer, and they stop appearing once you've answered them correctly three times in a row across spaced intervals."},
    {q:"Do mentors actually reply?", a:"Bundle students get priority replies within 48 hours from an NLU‑grad mentor assigned to the subject. We publish response‑time stats monthly on this page."},
    {q:"Can I pay with UPI?", a:"Yes. UPI, cards, net banking, and EMI on orders above ₹2,500 — all handled via Razorpay."},
  ];
  return (
    <section id="faq" style={{padding:"72px 28px", maxWidth:900, margin:"0 auto"}}>
      <div style={{textAlign:"center", marginBottom:32}}>
        <SectionLabel style={{textAlign:"center"}}>Frequently asked</SectionLabel>
        <h2 className="serif" style={{fontSize:40, letterSpacing:"-.02em", fontWeight:500, margin:"10px 0 0"}}>Questions, answered plainly.</h2>
      </div>
      <div>
        {items.map((it,i)=>(
          <FAQItem key={it.q} {...it} open={open===i} onClick={()=>setOpen(open===i?-1:i)}/>
        ))}
      </div>
    </section>
  );
}

function FinalCTA({go}){
  return (
    <section style={{padding:"16px 28px 96px", maxWidth:1200, margin:"0 auto"}}>
      <div style={{border:"1px solid var(--border-strong)", borderRadius:"var(--radius-lg)", padding:"56px 56px", background:"linear-gradient(180deg, var(--surface), var(--panel))", textAlign:"center"}}>
        <h2 className="serif" style={{fontSize:44, letterSpacing:"-.02em", fontWeight:500, margin:0, lineHeight:1.1}}>Your NLU seat is a prep system away.</h2>
        <p style={{fontSize:17, color:"var(--ink-2)", maxWidth:580, margin:"16px auto 0", lineHeight:1.6}}>Try Gavelogy free for seven days. If it doesn't raise your accuracy, cancel — no questions asked.</p>
        <div style={{display:"flex", gap:10, justifyContent:"center", marginTop:28}}>
          <Btn size="lg" onClick={()=>go('/signup')} trailing={I.arrow}>Start 7‑day free trial</Btn>
          <Btn size="lg" variant="outline" onClick={()=>go('/courses')}>Browse courses</Btn>
        </div>
      </div>
    </section>
  );
}

function LandingPage({route, go}){
  return (
    <div className="page">
      <AnnouncementBar go={go}/>
      <MarketingNav route={route} go={go}/>
      <Hero go={go}/>
      <ProductPreview/>
      <Features/>
      <Testimonial/>
      <Pricing go={go}/>
      <Mentors/>
      <FAQ/>
      <FinalCTA go={go}/>
      <MarketingFooter go={go}/>
    </div>
  );
}

Object.assign(window, { LandingPage });
