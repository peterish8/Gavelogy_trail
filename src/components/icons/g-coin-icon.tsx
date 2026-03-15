import { cn } from "@/lib/utils";

export function GCoinIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  // Intercept small tailwind sizes handed by parents and substitute them with much larger ones
  // so the coin is globally huge, but physically claims space (pushing text away safely).
  let expandedClass = className || "";
  
  if (expandedClass.includes("h-3") || expandedClass.includes("w-3")) {
    expandedClass = expandedClass.replace(/h-3(\.5)?/g, 'h-6').replace(/w-3(\.5)?/g, 'w-6');
  } else if (expandedClass.includes("h-4") || expandedClass.includes("w-4")) {
    expandedClass = expandedClass.replace(/h-4/g, 'h-7').replace(/w-4/g, 'w-7');
  } else if (expandedClass.includes("h-5") || expandedClass.includes("w-5")) {
    expandedClass = expandedClass.replace(/h-5/g, 'h-8').replace(/w-5/g, 'w-8');
  } else if (expandedClass.includes("h-6") || expandedClass.includes("w-6")) {
    expandedClass = expandedClass.replace(/h-6/g, 'h-10').replace(/w-6/g, 'w-10');
  }

  return (
    <img
      src="/gcoin.png"
      alt="G-Coin"
      className={cn(
        "object-contain shrink-0 drop-shadow-md mx-0.5", 
        expandedClass
      )}
      style={style}
    />
  );
}
