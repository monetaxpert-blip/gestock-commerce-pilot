import { cloneElement, useId, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormField({
  label,
  error,
  aside,
  children,
}: {
  label: string;
  error?: string | undefined;
  aside?: ReactNode;
  children: ReactElement<ComponentProps<typeof Input>>;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const control = cloneElement(children, {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
  });

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-[0.8rem] font-medium">
          {label}
        </Label>
        {aside}
      </div>
      {control}
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
