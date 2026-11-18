import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "rounded-xl border border-[#dfe5dd] bg-[#fcfdfb] px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#84ad45] disabled:cursor-not-allowed disabled:opacity-50 dark:border-fleet-input-border dark:bg-fleet-input",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
