import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white hover:from-[#8b6f47] hover:to-[#b48a78] shadow-md hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0",
        destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-xl transform hover:-translate-y-1",
        outline: "border-2 border-[#b48a78] bg-transparent text-[#b48a78] hover:bg-[#b48a78] hover:text-white shadow-sm hover:shadow-md",
        secondary: "bg-white/90 text-[#b48a78] border border-[#b48a78]/20 hover:bg-[#b48a78]/10 shadow-sm hover:shadow-md backdrop-blur-sm",
        ghost: "text-[#b48a78] hover:bg-[#b48a78]/10 hover:text-[#8b6f47]",
        link: "text-[#b48a78] underline-offset-4 hover:underline hover:text-[#8b6f47]",
        premium: "bg-gradient-to-r from-[#b48a78] via-[#d4a574] to-[#f5e6d3] text-white font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 animate-pulse-glow",
        glass: "bg-white/20 backdrop-blur-lg border border-white/30 text-[#b48a78] hover:bg-white/30 shadow-lg hover:shadow-xl",
        floating: "bg-gradient-to-r from-[#b48a78] to-[#d4a574] text-white shadow-2xl hover:shadow-3xl rounded-full animate-float",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-2xl px-8 text-base font-semibold",
        xl: "h-16 rounded-2xl px-10 text-lg font-bold",
        icon: "h-12 w-12 rounded-full",
        fab: "h-14 w-14 rounded-full shadow-xl hover:shadow-2xl",
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
  loading?: boolean
  ripple?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, ripple = true, children, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Add ripple effect
      if (ripple && !loading) {
        try {
          const button = e.currentTarget;
          const rect = button.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          const x = e.clientX - rect.left - size / 2;
          const y = e.clientY - rect.top - size / 2;
          
          const rippleEl = document.createElement('span');
          rippleEl.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
          `;
          
          button.appendChild(rippleEl);
          
          setTimeout(() => {
            try {
              rippleEl.remove();
            } catch (e) {
              // Fail silently if ripple element is already removed
            }
          }, 600);
        } catch (e) {
          // Fail silently if ripple creation fails
        }
      }
      
      if (onClick && !loading) {
        onClick(e);
      }
    };

    return (
      <>
        <style jsx>{`
          @keyframes ripple {
            to {
              transform: scale(4);
              opacity: 0;
            }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          onClick={handleClick}
          disabled={loading || props.disabled}
          {...props}
        >
          {/* Shimmer effect for premium variant */}
          {variant === "premium" && (
            <div className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:animate-[shimmer_1.5s_ease-in-out_infinite]" />
          )}
          
          {/* Loading spinner */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
            </div>
          )}
          
          {/* Content with conditional opacity */}
          <span className={cn("relative z-10 flex items-center gap-2", loading && "opacity-0")}>
            {children}
          </span>
        </Comp>
      </>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 