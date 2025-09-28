"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

type CheckboxProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => (
    <div className="relative">
      <input
        className="sr-only"
        type="checkbox"
        ref={ref}
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      <button
        type="button"
        className={cn(
          "flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-neutral-300 bg-white transition-colors",
          "hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500",
          checked && "border-rose-500 bg-rose-500 text-white",
          className
        )}
        onClick={() => onCheckedChange?.(!checked)}
      >
        {checked && <Check className="h-3 w-3" />}
      </button>
    </div>
  )
)
Checkbox.displayName = "Checkbox"

export { Checkbox }