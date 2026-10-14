"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { PROJECT_TYPES, TIMELINES, getRoom } from "@/domain/catalog";
import { quoteTotals } from "@/domain/pricing";
import { summarize } from "@/domain/summary";
import { formatDate, inr, plural } from "@/domain/format";
import { customerSchema, fieldErrors, quoteAsText, type CustomerDetails, type SubmissionReceipt } from "@/domain/quote";
import { priceDoor } from "@/domain/pricing";
import { BUSINESS, whatsappLink } from "@/config/business";
import { submitQuote, type SubmitResult } from "@/lib/quote-client";
import { newId, useQuoteStore } from "@/state/quote-store";
import { useHydrated } from "@/state/hydration";
import { ArrowIcon, Button, LinkButton } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { Field, Select, TextArea, TextInput, describedBy } from "@/components/ui/field";
import { Toggle } from "@/components/configurator/options";
import { QuoteItems } from "./quote-items";
import { TotalsPanel } from "./totals-panel";

type Status = { state: "idle" } | { state: "sending" } | { state: "error"; result: Exclude<SubmitResult, { ok: true }> };

const FIELD_ORDER = ["name", "phone", "email", "locality", "projectType", "timeline", "notes", "consent"] as const;

export function QuotePage() {
  const hydrated = useHydrated();
  const items = useQuoteStore((s) => s.items);
  const customer = useQuoteStore((s) => s.customer);
  const submissions = useQuoteStore((s) => s.submissions);
  const updateCustomer = useQuoteStore((s) => s.updateCustomer);
  const recordSubmission = useQuoteStore((s) => s.recordSubmission);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [receipt, setReceipt] = useState<(SubmissionReceipt & { text: string }) | null>(null);
  const [website, setWebsite] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  // One key per payload: retries of the same request are de-duplicated by the server.
  const keyRef = useRef<{ key: string; payload: string } | null>(null);

  const configs = useMemo(() => items.map((i) => i.config), [items]);
  const totals = useMemo(() => quoteTotals(configs), [configs]);
  const sending = status.state === "sending";

  if (!hydrated) {
    return (
      <Container className="py-16 lg:py-24">
        <div className="h-[60svh] animate-pulse bg-stone/60" aria-busy="true" aria-label="Loading your quote" />
      </Container>
    );
  }

  if (receipt) return <Confirmation receipt={receipt} onNew={() => setReceipt(null)} />;

  const values: Omit<CustomerDetails, "consent"> & { consent: boolean } = { ...customer, consent };

  const validateField = (name: string) => {
    const r = customerSchema.safeParse(values);
    const fe = r.success ? {} : fieldErrors(r.error);
    setErrors((prev) => ({ ...prev, [name]: fe[name] }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const parsed = customerSchema.safeParse(values);
    if (!parsed.success) {
      const fe = fieldErrors(parsed.error);
      setErrors(fe);
      const first = FIELD_ORDER.find((f) => fe[f]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    const payloadSig = JSON.stringify({ c: parsed.data, i: configs });
    if (!keyRef.current || keyRef.current.payload !== payloadSig) keyRef.current = { key: newId(), payload: payloadSig };
    setStatus({ state: "sending" });
    const result = await submitQuote({ idempotencyKey: keyRef.current.key, customer: parsed.data, items: configs, website });
    if (result.ok) {
      const text = quoteAsText({
        brand: "Threshold",
        reference: result.receipt.reference,
        customerName: parsed.data.name,
        lines: items.map((it) => ({ summary: summarize(it.config), roomLabel: getRoom(it.config.room).label, qty: it.config.qty, unit: priceDoor(it.config).unit })),
        totals: result.receipt.totals,
        inr,
      });
      recordSubmission({
        reference: result.receipt.reference,
        createdAt: result.receipt.createdAt,
        doors: result.receipt.doors,
        total: result.receipt.totals.total,
        siteVisit: result.receipt.siteVisit,
      });
      keyRef.current = null;
      setStatus({ state: "idle" });
      setReceipt({ ...result.receipt, text });
      window.scrollTo({ top: 0 });
      return;
    }
    if (result.kind === "validation") setErrors(result.fields);
    setStatus({ state: "error", result });
    requestAnimationFrame(() => errorRef.current?.focus());
  };

  const fallbackText = quoteAsText({
    brand: "Threshold",
    customerName: customer.name || undefined,
    lines: items.map((it) => ({ summary: summarize(it.config), roomLabel: getRoom(it.config.room).label, qty: it.config.qty, unit: priceDoor(it.config).unit })),
    totals,
    inr,
  });
  const wa = whatsappLink(fallbackText);

  return (
    <Container className="py-14 lg:py-20">
      <header className="mb-12 flex flex-col gap-4 lg:mb-16">
        <p className="eyebrow">Your quote</p>
        <h1 className="font-display text-display-l">Review your project.</h1>
        <p className="max-w-[56ch] text-lg text-ink-soft">
          Add every door you need, then send one request. The showroom will call you to arrange a site measurement and confirm the final price.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="tile flex flex-col items-start gap-5 px-6 py-14 sm:px-12">
          <h2 className="font-display text-display-s">Your quote is empty.</h2>
          <p className="max-w-[52ch] text-ink-soft">Design a door and choose &ldquo;Add to quote&rdquo;. Add one line per door type, with the quantity you need.</p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/design">
              Design a door <ArrowIcon />
            </LinkButton>
            <LinkButton href="/doors" variant="secondary">
              Browse designs
            </LinkButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-14 lg:grid-cols-12 lg:gap-16">
          <section aria-labelledby="items-title" className="lg:col-span-7">
            <h2 id="items-title" className="sr-only">
              Doors
            </h2>
            <QuoteItems items={items} disabled={sending} />
            <Link href="/doors" className="link-underline mt-6 inline-block text-sm">
              + Add another door
            </Link>
          </section>

          <section aria-labelledby="summary-title" className="flex flex-col gap-10 lg:col-span-5">
            <div className="rounded-[24px] bg-stone p-6 sm:p-8">
              <h2 id="summary-title" className="eyebrow mb-5">
                Estimate summary
              </h2>
              <TotalsPanel totals={totals} />
            </div>

            <form ref={formRef} noValidate onSubmit={onSubmit} aria-labelledby="form-title" className="flex flex-col gap-5">
              <div>
                <h2 id="form-title" className="font-display text-display-s">
                  Your details
                </h2>
                <p className="mt-2 text-sm text-ink-soft">We use these only to contact you about this request.</p>
              </div>

              <Field id="q-name" label="Full name" error={errors.name}>
                <TextInput
                  id="q-name"
                  name="name"
                  autoComplete="name"
                  value={customer.name}
                  invalid={!!errors.name}
                  aria-describedby={describedBy("q-name", errors.name)}
                  onChange={(e) => updateCustomer({ name: e.target.value })}
                  onBlur={() => customer.name && validateField("name")}
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="q-phone" label="Mobile number" error={errors.phone} hint="10-digit Indian mobile">
                  <TextInput
                    id="q-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="98765 43210"
                    value={customer.phone}
                    invalid={!!errors.phone}
                    aria-describedby={describedBy("q-phone", errors.phone, true)}
                    onChange={(e) => updateCustomer({ phone: e.target.value })}
                    onBlur={() => customer.phone && validateField("phone")}
                  />
                </Field>
                <Field id="q-email" label="Email" optional error={errors.email}>
                  <TextInput
                    id="q-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={customer.email}
                    invalid={!!errors.email}
                    aria-describedby={describedBy("q-email", errors.email)}
                    onChange={(e) => updateCustomer({ email: e.target.value })}
                    onBlur={() => customer.email && validateField("email")}
                  />
                </Field>
              </div>
              <Field id="q-locality" label="Site locality" error={errors.locality} hint="e.g. Kokapet, Gachibowli, Banjara Hills">
                <TextInput
                  id="q-locality"
                  name="locality"
                  autoComplete="address-level3"
                  value={customer.locality}
                  invalid={!!errors.locality}
                  aria-describedby={describedBy("q-locality", errors.locality, true)}
                  onChange={(e) => updateCustomer({ locality: e.target.value })}
                  onBlur={() => customer.locality && validateField("locality")}
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="q-type" label="Project type" error={errors.projectType}>
                  <Select id="q-type" name="projectType" value={customer.projectType} onChange={(e) => updateCustomer({ projectType: e.target.value as typeof customer.projectType })}>
                    {PROJECT_TYPES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </Select>
                </Field>
                <Field id="q-when" label="Needed by" error={errors.timeline}>
                  <Select id="q-when" name="timeline" value={customer.timeline} onChange={(e) => updateCustomer({ timeline: e.target.value as typeof customer.timeline })}>
                    {TIMELINES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Toggle checked={customer.siteVisit} onChange={(v) => updateCustomer({ siteVisit: v })} label="Book a free site measurement" detail="We'll call to fix a convenient time" />
              <Field id="q-notes" label="Notes for the showroom" optional error={errors.notes}>
                <TextArea
                  id="q-notes"
                  name="notes"
                  rows={3}
                  placeholder="Wall type, existing frames to remove, delivery floor…"
                  value={customer.notes}
                  invalid={!!errors.notes}
                  onChange={(e) => updateCustomer({ notes: e.target.value })}
                />
              </Field>
              {/* Honeypot: hidden from people and assistive technology. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>
                  Website
                  <input tabIndex={-1} autoComplete="off" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </label>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
                  <input
                    type="checkbox"
                    name="consent"
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-olive)]"
                    checked={consent}
                    aria-invalid={!!errors.consent || undefined}
                    aria-describedby={errors.consent ? "q-consent-error" : undefined}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (e.target.checked) setErrors((p) => ({ ...p, consent: undefined }));
                    }}
                  />
                  <span>Threshold may call, message or email me about this quote request.</span>
                </label>
                {errors.consent && (
                  <span id="q-consent-error" className="text-sm text-error">
                    {errors.consent}
                  </span>
                )}
              </div>

              {status.state === "error" && (
                <div ref={errorRef} tabIndex={-1} role="alert" className="flex flex-col gap-3 rounded-[14px] bg-error-soft p-4 text-sm outline-none">
                  <p className="font-semibold">Your request was not sent.</p>
                  <p>{status.result.message}</p>
                  {status.result.kind !== "validation" && wa && (
                    <p>
                      You can also{" "}
                      <a className="underline underline-offset-4" href={wa} target="_blank" rel="noopener noreferrer">
                        send this estimate to the showroom on WhatsApp
                      </a>
                      .
                    </p>
                  )}
                  {status.result.kind !== "validation" && !wa && BUSINESS.phone && (
                    <p>
                      Or call the showroom on <a className="underline underline-offset-4" href={`tel:${BUSINESS.phone.replace(/[^\d+]/g, "")}`}>{BUSINESS.phone}</a>.
                    </p>
                  )}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={sending} aria-busy={sending}>
                {sending ? (
                  <>
                    <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-paper/30 border-t-paper" />
                    Sending…
                  </>
                ) : status.state === "error" && status.result.kind !== "validation" ? (
                  "Try again"
                ) : (
                  <>
                    Send quote request <ArrowIcon />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted">
                {plural(totals.doors, "door")} · estimated {inr(totals.total)} including GST. No payment is taken online.
              </p>
            </form>
          </section>
        </div>
      )}

      {submissions.length > 0 && (
        <section aria-labelledby="history-title" className="mt-20 border-t border-line pt-10">
          <h2 id="history-title" className="eyebrow mb-4">
            Requests sent from this device
          </h2>
          <ul className="flex flex-col text-[0.95rem]">
            {submissions.map((s) => (
              <li key={s.reference} className="flex flex-wrap justify-between gap-3 border-b border-line py-3">
                <span>
                  <span className="tabular font-medium">{s.reference}</span>
                  <span className="text-ink-soft"> · {formatDate(s.createdAt)} · {plural(s.doors, "door")}</span>
                </span>
                <span className="tabular text-ink-soft">{inr(s.total)} est.</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Quote your reference when you speak to the showroom.</p>
        </section>
      )}
    </Container>
  );
}

function Confirmation({ receipt, onNew }: { receipt: SubmissionReceipt & { text: string }; onNew: () => void }) {
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const preRef = useRef<HTMLPreElement>(null);
  const wa = whatsappLink(receipt.text);
  return (
    <Container className="py-16 lg:py-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <p className="eyebrow text-olive">Request received</p>
        <h1 className="font-display text-display-l" tabIndex={-1} ref={(el) => el?.focus()}>
          Thank you, {receipt.firstName}.
        </h1>
        <div className="flex flex-col gap-1 border-y border-line py-6">
          <span className="text-sm text-muted">Your reference</span>
          <span className="tabular font-display text-[2.6rem] leading-none tracking-wide">{receipt.reference}</span>
        </div>
        <p className="text-lg leading-relaxed text-ink-soft">
          The showroom has your request for {plural(receipt.doors, "door")}, estimated at {inr(receipt.totals.total)} including GST. We&rsquo;ll call you on{" "}
          <span className="tabular text-ink">{receipt.phone}</span>
          {receipt.siteVisit ? " to arrange your site measurement." : " to talk through your project."}
        </p>
        <ol className="grid gap-4 sm:grid-cols-3">
          {["We call you back", receipt.siteVisit ? "We measure your openings" : "We confirm the details", "You approve the final quote"].map((t, i) => (
            <li key={t} className="border-t border-ink pt-3 text-sm">
              <span className="tabular mr-2 text-brass">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
        <details className="rounded-[20px] bg-stone p-5">
          <summary className="cursor-pointer text-sm font-medium">Request summary</summary>
          <pre ref={preRef} className="mt-4 whitespace-pre-wrap font-sans text-[0.82rem] leading-relaxed text-ink-soft">
            {receipt.text}
          </pre>
        </details>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(receipt.text);
                setCopied("done");
              } catch {
                setCopied("failed");
                const pre = preRef.current;
                if (pre) {
                  pre.closest("details")?.setAttribute("open", "");
                  const range = document.createRange();
                  range.selectNodeContents(pre);
                  getSelection()?.removeAllRanges();
                  getSelection()?.addRange(range);
                }
              }
            }}
          >
            {copied === "done" ? "Summary copied" : "Copy summary"}
          </Button>
          {wa && (
            <a className="inline-flex h-11 items-center rounded-full border border-ink/80 px-6 text-[0.95rem] hover:bg-ink hover:text-paper" href={wa} target="_blank" rel="noopener noreferrer">
              Share on WhatsApp
            </a>
          )}
          <Button onClick={onNew}>Start a new quote</Button>
        </div>
        <p aria-live="polite" className="text-sm text-muted">
          {copied === "failed" ? "Copying isn't available here — the summary is selected, press Ctrl/Cmd + C." : ""}
        </p>
      </div>
    </Container>
  );
}
