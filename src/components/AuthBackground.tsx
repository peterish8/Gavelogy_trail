"use client";

export function AuthBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#f0f4ff]">

      {/* ── Base gradient sky ── */}
      <div className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.18) 0%, transparent 55%), radial-gradient(ellipse at 60% 90%, rgba(59,130,246,0.22) 0%, transparent 50%), linear-gradient(160deg, #e0e7ff 0%, #f5f3ff 40%, #ede9fe 70%, #dbeafe 100%)"
        }}
      />

      {/* ── Cloud layer 1 — large, slow, leftward ── */}
      <div className="absolute cloud-drift-left" style={{ top: "8%", left: "-20%", animationDuration: "38s", animationDelay: "0s" }}>
        <Cloud width={520} height={180} color="rgba(139,92,246,0.22)" blur={48} />
      </div>

      {/* ── Cloud layer 2 — medium, rightward ── */}
      <div className="absolute cloud-drift-right" style={{ top: "22%", right: "-15%", animationDuration: "44s", animationDelay: "-12s" }}>
        <Cloud width={380} height={140} color="rgba(99,102,241,0.2)" blur={40} />
      </div>

      {/* ── Cloud layer 3 — large pink-purple, leftward ── */}
      <div className="absolute cloud-drift-left" style={{ top: "55%", left: "-25%", animationDuration: "52s", animationDelay: "-20s" }}>
        <Cloud width={600} height={200} color="rgba(168,85,247,0.18)" blur={56} />
      </div>

      {/* ── Cloud layer 4 — small blue, rightward ── */}
      <div className="absolute cloud-drift-right" style={{ top: "70%", right: "-10%", animationDuration: "36s", animationDelay: "-8s" }}>
        <Cloud width={300} height={120} color="rgba(59,130,246,0.22)" blur={36} />
      </div>

      {/* ── Cloud layer 5 — tiny indigo, leftward ── */}
      <div className="absolute cloud-drift-left" style={{ top: "38%", left: "-8%", animationDuration: "60s", animationDelay: "-30s" }}>
        <Cloud width={260} height={100} color="rgba(79,70,229,0.16)" blur={32} />
      </div>

      {/* ── Cloud layer 6 — wide violet, rightward, bottom ── */}
      <div className="absolute cloud-drift-right" style={{ top: "82%", right: "-30%", animationDuration: "48s", animationDelay: "-5s" }}>
        <Cloud width={500} height={160} color="rgba(124,58,237,0.15)" blur={50} />
      </div>

      {/* ── Cloud layer 7 — soft pink accent, leftward ── */}
      <div className="absolute cloud-drift-left" style={{ top: "14%", left: "20%", animationDuration: "70s", animationDelay: "-40s" }}>
        <Cloud width={220} height={90} color="rgba(236,72,153,0.12)" blur={30} />
      </div>

      {/* ── Cloud layer 8 — large center, very slow, rightward ── */}
      <div className="absolute cloud-drift-right" style={{ top: "42%", right: "10%", animationDuration: "80s", animationDelay: "-55s" }}>
        <Cloud width={440} height={160} color="rgba(99,102,241,0.12)" blur={44} />
      </div>

      {/* ── Subtle dot grid overlay ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.12) 1.2px, transparent 1.2px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* ── Bottom gradient fade ── */}
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(224,231,255,0.6), transparent)" }}
      />
    </div>
  );
}

function Cloud({ width, height, color, blur }: { width: number; height: number; color: string; blur: number }) {
  const rx = width / 2;
  const ry = height / 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ filter: `blur(${blur}px)` }}
    >
      {/* Main body */}
      <ellipse cx={rx} cy={ry} rx={rx * 0.85} ry={ry * 0.7} fill={color} />
      {/* Left bump */}
      <ellipse cx={rx * 0.42} cy={ry * 0.55} rx={rx * 0.42} ry={ry * 0.65} fill={color} />
      {/* Right bump */}
      <ellipse cx={rx * 1.58} cy={ry * 0.6} rx={rx * 0.38} ry={ry * 0.6} fill={color} />
      {/* Center top bump */}
      <ellipse cx={rx} cy={ry * 0.35} rx={rx * 0.48} ry={ry * 0.62} fill={color} />
    </svg>
  );
}
