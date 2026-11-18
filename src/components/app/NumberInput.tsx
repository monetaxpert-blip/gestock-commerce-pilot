import { forwardRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { parseNumber } from "@/lib/format";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: number | null;
  onValueChange: (v: number | null) => void;
  decimals?: number;
  suffix?: string;
};

/** Champ numérique tolérant (espaces, virgule). Les montants FCFA utilisent decimals = 0. */
export const NumberInput = forwardRef<HTMLInputElement, Props>(function NumberInput(
  { value, onValueChange, decimals = 0, suffix, className, ...rest },
  ref,
) {
  const [text, setText] = useState(value === null || value === undefined ? "" : String(value).replace(".", ","));
  useEffect(() => {
    const parsed = parseNumber(text);
    if (parsed !== value) setText(value === null || value === undefined ? "" : String(value).replace(".", ","));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <div className="relative">
      <Input
        ref={ref}
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        value={text}
        onChange={(e) => {
          const raw = e.target.value;
          const allowed = decimals > 0 ? /^[0-9\s.,]*$/ : /^[0-9\s]*$/;
          if (!allowed.test(raw)) return;
          setText(raw);
          const n = parseNumber(raw);
          onValueChange(n === null ? null : decimals > 0 ? Math.round(n * 10 ** decimals) / 10 ** decimals : Math.round(n));
        }}
        className={cn("tnum", suffix && "pr-14", className)}
        {...rest}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">{suffix}</span>
      )}
    </div>
  );
});
