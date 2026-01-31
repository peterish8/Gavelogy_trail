import React from 'react';

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties['animationDuration'];
  thickness?: number;
};

const StarBorder = <T extends React.ElementType = 'button'>({
  as,
  className = '',
  color = '#C9A2FF',
  speed = '6s',
  thickness = 1,
  children,
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || 'button';

  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-[20px] group ${className}`}
      {...(rest as React.ComponentPropsWithoutRef<T>)}
      style={{
        padding: `${thickness}px 0`,
        ...(rest as React.HTMLAttributes<HTMLElement>).style
      }}
    >
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      ></div>
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      ></div>
      <div className="relative z-10 px-[26px] py-[16px] rounded-[20px] text-white text-center text-[16px] font-semibold tracking-wide shadow-[0_12px_30px_rgba(10,10,30,0.35)] transition-all duration-700 group-hover:shadow-[0_18px_45px_rgba(86,60,150,0.55)] overflow-hidden">
        {/* Base dark gradient (default state) */}
        <div className="absolute inset-0 rounded-[20px] bg-linear-to-r from-[#0c0c14] via-[#11111c] to-[#161627] opacity-100 transition-opacity duration-700 group-hover:opacity-0"></div>
        {/* Dreamy gradient overlay that fades in smoothly */}
        <div className="absolute inset-0 rounded-[20px] bg-linear-to-r from-[#2c1b47] via-[#4c2c72] to-[#f4c484] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <div className="absolute inset-[2px] rounded-[18px] opacity-80 transition-all duration-700 bg-linear-to-r from-[#09060f] via-[#120c1d] to-[#1b1430] group-hover:from-[#1b1230] group-hover:via-[#2e1b4c] group-hover:to-[#49286c] blur-[0px]"></div>
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </div>
    </Component>
  );
};

export default StarBorder;