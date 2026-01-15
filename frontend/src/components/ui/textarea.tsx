import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-xl border-2 border-primary/30 bg-background px-4 py-3 text-sm shadow-sm transition-all duration-200",
          "ring-offset-background placeholder:text-muted-foreground/60",
          "hover:border-primary/50 hover:shadow-md hover:bg-primary/5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:shadow-md",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30",
          "resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
