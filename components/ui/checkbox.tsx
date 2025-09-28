"use client";

import { Check } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type CheckboxProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
};

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => (
    <div className="relative">
      <input
        checked={checked}
        className="sr-only"
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        ref={ref}
        type="checkbox"
        {...props}
      />
      <button
        className={cn(
          "flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-neutral-300 bg-white transition-colors",
          "hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
          checked && "border-green-500 bg-green-500 text-white",
          className
        )}
        onClick={() => onCheckedChange?.(!checked)}
        type="button"
      >
        {checked && <Check className="h-3 w-3" />}
      </button>
    </div>
  )
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
