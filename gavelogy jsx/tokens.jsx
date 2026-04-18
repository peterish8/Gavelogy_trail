// Design tokens — single source of truth. Exposed via CSS variables so Tweaks can live-swap them.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "brand": "violet",
  "surface": "lilac",
  "serifDisplay": true,
  "density": "balanced",
  "radius": 10,
  "shadowStrength": "soft"
}/*EDITMODE-END*/;

// Violet & Plum — vivid SaaS direction.
// `brand` is the violet primary; `brand2` is the plum secondary used for 'Best Value',
// achievements, accents, and complementary highlights.
const BRANDS = {
  "violet":    { brand:"#4B2AD6", brandHover:"#3A1EB0", brandSoft:"#EBE6FD", brandBorder:"#D7CEFA", ring:"#4B2AD6",
                 brand2:"#A23268", brand2Hover:"#812552", brand2Soft:"#F8E1EA", brand2Border:"#EECBDA" },
  // Alternate vivid anchors kept so the Tweaks brand switcher still functions.
  "cobalt":    { brand:"#1F4BE0", brandHover:"#1838B8", brandSoft:"#E0E8FE", brandBorder:"#CDD9FA", ring:"#1F4BE0",
                 brand2:"#D89018", brand2Hover:"#A96E0A", brand2Soft:"#FBEBC6", brand2Border:"#F1D898" },
  "emerald":   { brand:"#0E8A4A", brandHover:"#096B38", brandSoft:"#D9F1E2", brandBorder:"#BCE2CB", ring:"#0E8A4A",
                 brand2:"#E2553A", brand2Hover:"#B93C23", brand2Soft:"#FADDD4", brand2Border:"#F3C3B5" },
  "tangerine": { brand:"#E2551B", brandHover:"#B93C0E", brandSoft:"#FDE1D3", brandBorder:"#F6C6B0", ring:"#E2551B",
                 brand2:"#1A1510", brand2Hover:"#000000", brand2Soft:"#E9E4DD", brand2Border:"#D8D2C7" },
  "crimson":   { brand:"#B11D2C", brandHover:"#8A121E", brandSoft:"#FAE1E4", brandBorder:"#F1C6CC", ring:"#B11D2C",
                 brand2:"#2B2A8F", brand2Hover:"#1E1D6B", brand2Soft:"#E0DFF5", brand2Border:"#C8C6EA" },
};

const SURFACES = {
  // Lilac-tinted cool whites — matches the Violet & Plum system.
  "lilac": { bg:"#F7F6FB", surface:"#FFFFFF", panel:"#EFECF5", border:"#E2DEEC", borderStrong:"#CDC6DC", ink:"#130F2A", ink2:"#434056", ink3:"#857FA0" },
  "warm":  { bg:"#FAF9F6", surface:"#FFFFFF", panel:"#F5F4EE", border:"#E8E6DE", borderStrong:"#D8D5CB", ink:"#14141A", ink2:"#4B4B54", ink3:"#8A8A93" },
  "cool":  { bg:"#F7F8FA", surface:"#FFFFFF", panel:"#F1F3F7", border:"#E5E7EB", borderStrong:"#D1D5DB", ink:"#111827", ink2:"#4B5563", ink3:"#9CA3AF" },
  "pure":  { bg:"#FFFFFF", surface:"#FFFFFF", panel:"#F7F7F7", border:"#E7E7E7", borderStrong:"#D4D4D4", ink:"#0B0B0C", ink2:"#4E4E54", ink3:"#8E8E96" },
};

const SHADOWS = {
  "soft":   { s1:"0 1px 2px rgba(16,22,40,.04), 0 1px 3px rgba(16,22,40,.05)", s2:"0 4px 12px rgba(16,22,40,.06), 0 1px 3px rgba(16,22,40,.04)", s3:"0 12px 32px rgba(16,22,40,.08), 0 2px 6px rgba(16,22,40,.04)"},
  "crisp":  { s1:"0 1px 0 rgba(16,22,40,.04)", s2:"0 2px 4px rgba(16,22,40,.06), 0 1px 0 rgba(16,22,40,.04)", s3:"0 8px 20px rgba(16,22,40,.08)"},
  "flat":   { s1:"none", s2:"none", s3:"0 1px 2px rgba(16,22,40,.03)"},
};

const DENSITIES = {
  "airy":     { gap:"28px", cardPad:"28px", sectionGap:"96px" },
  "balanced": { gap:"20px", cardPad:"24px", sectionGap:"72px" },
  "dense":    { gap:"14px", cardPad:"18px", sectionGap:"56px" },
};

function applyTheme(t){
  const b = BRANDS[t.brand] || BRANDS["violet"];
  const s = SURFACES[t.surface] || SURFACES.lilac;
  const sh = SHADOWS[t.shadowStrength] || SHADOWS.soft;
  const d = DENSITIES[t.density] || DENSITIES.balanced;
  const css = `:root{
    --brand:${b.brand}; --brand-hover:${b.brandHover}; --brand-soft:${b.brandSoft}; --brand-border:${b.brandBorder}; --ring:${b.ring};
    --brand-2:${b.brand2}; --brand-2-hover:${b.brand2Hover}; --brand-2-soft:${b.brand2Soft}; --brand-2-border:${b.brand2Border};
    --bg:${s.bg}; --surface:${s.surface}; --panel:${s.panel}; --border:${s.border}; --border-strong:${s.borderStrong};
    --ink:${s.ink}; --ink-2:${s.ink2}; --ink-3:${s.ink3};
    --success:#1F7A52; --success-soft:#E6F2EC;
    --warn:#A36009; --warn-soft:#FBEEDA;
    --danger:#A11D2E; --danger-soft:#F7E4E6;
    --gold-ink:#8A5A0A; --gold-soft:#F6E2C2; --gold-border:#EAD2A3;
    --radius:${t.radius||10}px; --radius-sm:${Math.max(4,(t.radius||10)-4)}px; --radius-lg:${(t.radius||10)+4}px;
    --s1:${sh.s1}; --s2:${sh.s2}; --s3:${sh.s3};
    --gap:${d.gap}; --card-pad:${d.cardPad}; --section-gap:${d.sectionGap};
    --display-family:${t.serifDisplay?`'Source Serif 4', Georgia, serif`:`'Inter', system-ui, sans-serif`};
  }`;
  const el = document.getElementById("theme-css");
  if (el) el.textContent = css;
}

window.__tokens = { BRANDS, SURFACES, SHADOWS, DENSITIES, applyTheme, TWEAK_DEFAULTS };
applyTheme(TWEAK_DEFAULTS);
