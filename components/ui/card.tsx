import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const cardVariants = cva(
  "relative overflow-hidden transition-all duration-300 group",
  {
    variants: {
      variant: {
        default: "bg-white/90 backdrop-blur-sm border border-white/20 shadow-md hover:shadow-xl rounded-2xl",
        glass: "bg-white/10 backdrop-blur-lg border border-white/30 shadow-lg hover:shadow-2xl rounded-2xl",
        premium: "bg-gradient-to-br from-white/95 to-white/80 backdrop-blur-md border border-white/40 shadow-xl hover:shadow-2xl rounded-3xl transform hover:-translate-y-2 hover:scale-[1.02]",
        floating: "bg-white/90 backdrop-blur-sm border border-white/20 shadow-2xl hover:shadow-3xl rounded-2xl animate-float",
        gradient: "bg-gradient-to-br from-[#ffe9ea] to-[#fef3f3] border border-[#b48a78]/20 shadow-lg hover:shadow-xl rounded-2xl",
      },
      padding: {
        none: "",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  shimmer?: boolean
  glow?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, shimmer = false, glow = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding }),
          glow && "animate-pulse-glow",
          className
        )}
        {...props}
      >
        {/* Shimmer effect */}
        {shimmer && (
          <div className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 group-hover:animate-[shimmer_2s_ease-in-out_infinite]" />
        )}
        
        {/* Highlight border for premium cards */}
        {variant === "premium" && (
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#b48a78] via-[#d4a574] to-[#b48a78] p-[1px]">
            <div className="h-full w-full rounded-3xl bg-white/95 backdrop-blur-md" />
          </div>
        )}
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 mb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold leading-none tracking-tight text-[#b48a78] font-poppins",
      className
    )}
    {...props}
  >
    {children}
  </h3>
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-neutral-600 leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between mt-6", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } 