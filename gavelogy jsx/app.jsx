/* Router + app root */

function useHashRoute(){
  const [route, setRoute] = useState(()=>parse(location.hash));
  useEffect(()=>{
    const onHash = ()=>setRoute(parse(location.hash));
    window.addEventListener("hashchange", onHash);
    return ()=>window.removeEventListener("hashchange", onHash);
  }, []);
  function parse(h){
    const path = (h||"").replace(/^#/,"") || "/";
    return {path};
  }
  function go(path){
    if (path.startsWith("http")) { location.href = path; return; }
    location.hash = path;
    // also scroll top for app pages
    requestAnimationFrame(()=>window.scrollTo({top:0, left:0}));
  }
  return [route, go];
}

function App(){
  const [route, go] = useHashRoute();
  const p = route.path;

  let page;
  if (p === "/" || p === "") page = <LandingPage route={route} go={go}/>;
  else if (p === "/login")           page = <AuthPage mode="login" route={route} go={go}/>;
  else if (p === "/signup")          page = <AuthPage mode="signup" route={route} go={go}/>;
  else if (p.startsWith("/dashboard"))    page = <DashboardPage route={route} go={go}/>;
  else if (p.startsWith("/courses"))      page = <CoursesPage route={route} go={go}/>;
  else if (p.startsWith("/course-viewer"))page = <CourseViewerPage route={route} go={go}/>;
  else if (p.startsWith("/mistakes"))     page = <MistakesPage route={route} go={go}/>;
  else if (p.startsWith("/leaderboard"))  page = <LeaderboardPage route={route} go={go}/>;
  else if (p.startsWith("/profile"))      page = <ProfilePage route={route} go={go}/>;
  else if (p.startsWith("/quiz"))         page = <QuizPage route={route} go={go}/>;
  else page = <LandingPage route={route} go={go}/>;

  return <>
    {page}
    <TweaksPanel/>
    <ProtoNav route={route} go={go}/>
  </>;
}

/* Small bottom-center nav so reviewers can jump between pages */
function ProtoNav({route, go}){
  const items = [
    {p:"/",                 l:"Landing"},
    {p:"/login",            l:"Login"},
    {p:"/signup",           l:"Signup"},
    {p:"/dashboard",        l:"Dashboard"},
    {p:"/courses",          l:"Courses"},
    {p:"/course-viewer",    l:"Viewer"},
    {p:"/quiz",             l:"Quiz"},
    {p:"/mistakes",         l:"Mistakes"},
    {p:"/leaderboard",      l:"Leaderboard"},
    {p:"/profile",          l:"Profile"},
  ];
  return (
    <div style={{
      position:"fixed", bottom:14, left:"50%", transform:"translateX(-50%)",
      zIndex:9998, display:"flex", gap:4, padding:4,
      background:"rgba(20,20,26,.92)", backdropFilter:"blur(10px)",
      borderRadius:999, border:"1px solid rgba(255,255,255,.08)",
      boxShadow:"0 12px 32px rgba(0,0,0,.22)",
      maxWidth:"calc(100vw - 40px)", overflowX:"auto",
    }}>
      {items.map(it=>{
        const active = it.p==="/" ? (route.path==="/"||route.path==="") : route.path.startsWith(it.p);
        return (
          <button key={it.p} onClick={()=>go(it.p)} style={{
            padding:"6px 12px", fontSize:12, fontFamily:"'Inter', sans-serif", fontWeight:600,
            background: active?"#F5F3ED":"transparent", color: active?"#14141A":"#CFC9B9",
            border:0, borderRadius:999, cursor:"pointer", whiteSpace:"nowrap",
          }}>{it.l}</button>
        );
      })}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
