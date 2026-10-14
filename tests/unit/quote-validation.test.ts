import { describe, expect, it } from "vitest";
import { customerSchema, fieldErrors, normalizeIndianMobile, submissionSchema } from "@/domain/quote";

const valid = {
  name: "Asha Rao",
  phone: "98765 43210",
  email: "",
  locality: "Kokapet",
  projectType: "New home",
  timeline: "1–2 months",
  siteVisit: true,
  notes: "",
  consent: true,
};

describe("Indian mobile numbers", () => {
  it.each([
    ["98765 43210", "9876543210"],
    ["+91 98765-43210", "9876543210"],
    ["09876543210", "9876543210"],
    ["919876543210", "9876543210"],
  ])("accepts %s", (input, out) => expect(normalizeIndianMobile(input)).toBe(out));

  it.each(["12345 67890", "98765", "040 2345 6789", "", "98765432101"])("rejects %s", (input) => expect(normalizeIndianMobile(input)).toBeNull());
});

describe("customer details", () => {
  it("accepts a complete, valid form", () => {
    expect(customerSchema.safeParse(valid).success).toBe(true);
  });

  it("reports a helpful message per field", () => {
    const r = customerSchema.safeParse({ ...valid, name: " ", phone: "123", email: "nope", locality: "", consent: false });
    expect(r.success).toBe(false);
    const fe = fieldErrors(r.error!);
    expect(Object.keys(fe).sort()).toEqual(["consent", "email", "locality", "name", "phone"]);
    expect(fe.phone).toMatch(/10-digit Indian mobile/);
  });

  it("rejects unknown project types and timelines", () => {
    expect(customerSchema.safeParse({ ...valid, projectType: "Spaceship" }).success).toBe(false);
    expect(customerSchema.safeParse({ ...valid, timeline: "Yesterday" }).success).toBe(false);
  });

  it("limits field lengths", () => {
    expect(customerSchema.safeParse({ ...valid, notes: "x".repeat(1001) }).success).toBe(false);
  });
});

describe("submission envelope", () => {
  it("requires at least one door and a UUID idempotency key", () => {
    expect(submissionSchema.safeParse({ idempotencyKey: "abc", customer: valid, items: [{}] }).success).toBe(false);
    expect(submissionSchema.safeParse({ idempotencyKey: crypto.randomUUID(), customer: valid, items: [] }).success).toBe(false);
    expect(submissionSchema.safeParse({ idempotencyKey: crypto.randomUUID(), customer: valid, items: [{ style: "flush" }] }).success).toBe(true);
  });
});
