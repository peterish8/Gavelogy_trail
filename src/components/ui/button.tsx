import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold",
    "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-40",
    "btn-press select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        // Solid brand fill — primary CTA
        default: [
          "bg-[var(--brand)] text-white",
          "border border-[rgba(255,255,255,0.18)]",
          "shadow-[0_1px_3px_rgba(75,42,214,0.35),inset_0_1px_0_rgba(255,255,255,0.22)]",
          "hover:bg-[var(--brand-hover)]",
          "hover:shadow-[0_4px_20px_rgba(75,42,214,0.45),inset_0_1px_0_rgba(255,255,255,0.28)]",
          "dark:bg-[#6d46fa] dark:hover:bg-[#5a34e8]",
          "dark:shadow-[0_1px_3px_rgba(109,70,250,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "dark:hover:shadow-[0_4px_24px_rgba(109,70,250,0.55),inset_0_1px_0_rgba(255,255,255,0.18)]",
        ].join(" "),

        // Liquid glass — secondary/outline actions
        outline: [
          "bg-white/45 dark:bg-white/[0.07]",
          "backdrop-blur-sm",
          "border border-white/65 dark:border-white/[0.13]",
          "text-[var(--ink)] dark:text-[var(--ink)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_2px_8px_rgba(75,42,214,0.07)]",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.25)]",
          "hover:bg-white/70 dark:hover:bg-white/[0.12]",
          "hover:border-[var(--brand-border)] dark:hover:border-[rgba(167,139,250,0.28)]",
          "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_4px_16px_rgba(75,42,214,0.11)]",
          "dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.11),0_4px_16px_rgba(100,60,220,0.18)]",
        ].join(" "),

        // Ghost — tertiary, nav actions
        ghost: [
          "text-[var(--ink-2)] dark:text-[var(--ink-2)]",
          "hover:bg-white/35 dark:hover:bg-white/[0.07]",
          "hover:text-[var(--ink)] dark:hover:text-[var(--ink)]",
          "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
        ].join(" "),

        // Brand-soft tint — confirmations, secondary CTAs
        secondary: [
          "bg-[var(--brand-soft)] dark:bg-[rgba(167,139,250,0.14)]",
          "text-[var(--brand)] dark:text-[#a78bfa]",
          "border border-[var(--brand-border)] dark:border-[rgba(167,139,250,0.24)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]",
          "hover:bg-[rgba(235,230,253,0.92)] dark:hover:bg-[rgba(167,139,250,0.22)]",
          "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_12px_rgba(75,42,214,0.12)]",
        ].join(" "),

        // Destructive — danger actions
        destructive: [
          "bg-[var(--gv-danger)] text-white",
          "border border-[rgba(255,255,255,0.15)]",
          "shadow-[0_1px_3px_rgba(161,29,46,0.4),inset_0_1px_0_rgba(255,255,255,0.18)]",
          "hover:bg-[#8a1826]",
          "hover:shadow-[0_4px_20px_rgba(161,29,46,0.45),inset_0_1px_0_rgba(255,255,255,0.22)]",
        ].join(" "),

        link: "text-[var(--brand)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
