import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";

function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return <select data-slot="native-select" className={cn("px-3 py-2.5 text-sm", className)} {...props} />;
}

export { NativeSelect };
