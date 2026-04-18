/* Courses list + course viewer */

function CoursesPage({route, go}){
  const courses = [
    {
      id:"static",
      subj:"Core curriculum",
      title:"Static Subjects Course",
      desc:"All 13 law subjects, concept‑tagged and cross‑referenced. Rebuilt from scratch for the 2027 syllabus.",
      price:1999, orig:null, badge:"Most popular",
      stats:[["Subjects","13"],["Questions","650"],["Mocks","20"]],
      features:["Judgment PDF reader","Concept maps","Case notes","Quizzes & flashcards","Mistake tracker"],
      purchased:true,
    },
    {
      id:"cases",
      subj:"Current affairs",
      title:"Contemporary Cases Course",
      desc:"150 judgments from 2023–2025, curated month‑wise with headnotes and ratio summaries.",
      price:1499, orig:null, badge:null,
      stats:[["Cases","150"],["Years","2023–25"],["Quizzes","36"]],
      features:["Month‑wise quizzes","Landmark headnotes","Citation map","Ratio explainer","Mentor Q&A"],
      purchased:false,
    },
    {
      id:"bundle",
      subj:"Full prep",
      title:"Bundle · Static + Contemporary",
      desc:"Everything Gavelogy makes. One‑time, valid until exam day.",
      price:2999, orig:3498, badge:"Best value",
      stats:[["Subjects","13"],["Cases","150"],["Mocks","20"]],
      features:["Everything in Static","Everything in Contemporary","Priority mentor (48h)","1:1 mock review"],
      purchased:false,
    },
  ];
  return (
    <AppLayout route={route} go={go}
      title="Courses"
      subtitle="One‑time purchase, valid through your exam cycle."
      breadcrumb={<span style={{display:"inline-flex", alignItems:"center", gap:6}}><span>Gavelogy</span>{I.chev}<span>Courses</span></span>}
      actions={<Btn size="sm" variant="outline" leading={I.filter}>Filter</Btn>}>

      <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"var(--gap)"}}>
        {courses.map(c=>(
          <Card key={c.id} hover pad={false} style={{display:"flex", flexDirection:"column", border: c.id==="bundle"?"1px solid var(--ink)":"1px solid var(--border)"}}>
            {/* Card banner — subtle ruled paper, course-distinct accent */}
            <div style={{
              padding:"22px 24px", borderBottom:"1px solid var(--border)",
              background: c.id==="static"
                ? `linear-gradient(135deg, var(--brand-soft), var(--surface))`
                : c.id==="cases"
                ? `linear-gradient(135deg, color-mix(in oklab, var(--success) 10%, var(--surface)), var(--surface))`
                : `linear-gradient(135deg, var(--gold-soft), var(--surface))`,
              position:"relative",
            }}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                <SectionLabel>{c.subj}</SectionLabel>
                {c.badge && <Badge tone={c.id==="bundle"?"gold":"brand"} size="sm">{c.badge}</Badge>}
              </div>
              <h3 className="serif" style={{fontSize:22, letterSpacing:"-.01em", fontWeight:600, margin:"8px 0 4px"}}>{c.title}</h3>
              <p style={{fontSize:13.5, color:"var(--ink-2)", lineHeight:1.55, margin:0}}>{c.desc}</p>
            </div>

            <div style={{padding:"18px 24px", borderBottom:"1px solid var(--border)", display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:4}}>
              {c.stats.map(([k,v])=>(
                <div key={k}>
                  <div className="serif" style={{fontSize:22, fontWeight:600, letterSpacing:"-.01em"}}>{v}</div>
                  <div style={{fontSize:11, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".12em", fontWeight:600}}>{k}</div>
                </div>
              ))}
            </div>

            <div style={{padding:"18px 24px", flex:1}}>
              <ul style={{listStyle:"none", padding:0, margin:0}}>
                {c.features.map(f=>(
                  <li key={f} style={{display:"flex", gap:10, alignItems:"flex-start", padding:"5px 0", fontSize:13.5, color:"var(--ink-2)"}}>
                    <span style={{color:"var(--success)", marginTop:2, flexShrink:0}}>{I.check}</span>{f}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{padding:"18px 24px", borderTop:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12}}>
              <div>
                {c.orig && <div style={{fontSize:12.5, color:"var(--ink-3)", textDecoration:"line-through"}}>₹{c.orig.toLocaleString("en-IN")}</div>}
                <div className="serif" style={{fontSize:26, fontWeight:600, letterSpacing:"-.02em"}}>₹{c.price.toLocaleString("en-IN")}</div>
              </div>
              {c.purchased
                ? <Btn variant="secondary" leading={I.check} onClick={()=>go('/course-viewer')}>Continue</Btn>
                : <Btn onClick={()=>go('/signup')} trailing={I.arrow}>Buy now</Btn>}
            </div>
          </Card>
        ))}
      </div>

      <div style={{marginTop:36}}>
        <SectionLabel style={{marginBottom:14}}>Included in every course</SectionLabel>
        <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"var(--gap)"}}>
          {[
            {t:"Mistake tracker", d:"Spaced repetition on every wrong answer.", i:I.target},
            {t:"Judgment reader", d:"Annotate PDFs with citation expander + TTS.", i:I.pdf},
            {t:"Full‑length mocks", d:"20 pattern‑true mocks with sectional timers.", i:I.clock},
            {t:"Mentor Q&A", d:"48‑hour replies from NLU‑grad faculty.", i:I.user},
          ].map(f=>(
            <Card key={f.t}>
              <div style={{width:32, height:32, borderRadius:"var(--radius-sm)", background:"var(--brand-soft)", color:"var(--brand)", display:"inline-flex", alignItems:"center", justifyContent:"center", border:"1px solid var(--brand-border)", marginBottom:12}}>{f.i}</div>
              <div style={{fontSize:14, fontWeight:600}}>{f.t}</div>
              <div style={{fontSize:12.5, color:"var(--ink-2)", marginTop:4, lineHeight:1.55}}>{f.d}</div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

Object.assign(window, { CoursesPage });
