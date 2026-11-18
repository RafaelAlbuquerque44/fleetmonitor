import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#84ad45] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#17221c] text-white hover:bg-[#2b3b30] dark:bg-[#c4f36b] dark:text-[#17221c] dark:hover:bg-[#d2fb8d]",
        outline: "border border-[#dfe5dd] bg-white hover:bg-[#f3f3f3] dark:border-fleet-input-border dark:bg-fleet-raised dark:hover:bg-fleet-highlight",
        ghost: "hover:bg-[#f3f3f3] dark:hover:bg-fleet-highlight",
        unstyled: "",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3",
        icon: "size-10",
        auto: "",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({ className, variant, size, asChild = false, ...props }: ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return <Component data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
