import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "@/components/app/FormField";
import { Input } from "@/components/ui/input";

describe("FormField accessibility", () => {
  it("associates the label and validation message with its input", () => {
    render(
      <FormField label="Adresse e-mail" error="Adresse e-mail invalide">
        <Input type="email" />
      </FormField>,
    );

    const input = screen.getByLabelText("Adresse e-mail");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Adresse e-mail invalide");
  });
});
