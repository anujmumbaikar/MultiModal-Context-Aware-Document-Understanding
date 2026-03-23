"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = ["Basic Info", "Domain", "Processing", "Review"];

const DOMAINS = [
  { value: "Legal", desc: "Contracts, compliance, regulatory docs" },
  { value: "Research", desc: "Academic papers, clinical studies" },
  { value: "Finance", desc: "Reports, filings, analysis" },
  { value: "General", desc: "Mixed document workflows" },
];

export default function CreateProject() {
  const router = useRouter();

  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    name: "",
    description: "",
    domain: "",
    instructions: "",
    enableOCR: true,
    enableMultimodal: true,
    enableCitations: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ---------------- VALIDATION ---------------- */

  const validateStep = () => {
    const e: Record<string, string> = {};

    if (step === 0) {
      if (!form.name.trim()) e.name = "Project name is required";
      if (!form.description.trim()) e.description = "Description is required";
    }

    if (step === 1 && !form.domain) {
      e.domain = "Select a domain";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const back = () => setStep((s) => s - 1);

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async () => {
    // 🔥 replace with real API later
    console.log(form);

    toast.success("Project created successfully");

    // simulate backend id
    const id = `proj_${Date.now()}`;

    router.push(`/projects/${id}`);
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-8 text-muted-foreground"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-10 space-y-1">
          <h1 className="text-2xl font-semibold">Create Project</h1>
          <p className="text-sm text-muted-foreground">
            Configure your document intelligence workspace
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-full text-xs font-medium",
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>

                <span
                  className={cn(
                    "text-xs mt-2",
                    i === step
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>

              {i !== STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1",
                    i < step ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <Card>
          <CardContent className="p-6 space-y-6">

            {/* STEP 1 */}
            {step === 0 && (
              <>
                <div>
                  <Label>Project Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive">
                      {errors.description}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* STEP 2 */}
            {step === 1 && (
              <div className="space-y-4">
                <Label>Select Domain</Label>

                <div className="grid grid-cols-2 gap-3">
                  {DOMAINS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() =>
                        setForm({ ...form, domain: d.value })
                      }
                      className={cn(
                        "rounded-lg border p-4 text-left",
                        form.domain === d.value
                          ? "border-foreground bg-muted"
                          : "border-border"
                      )}
                    >
                      <div className="text-sm font-medium">{d.value}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.desc}
                      </div>
                    </button>
                  ))}
                </div>

                {errors.domain && (
                  <p className="text-xs text-destructive">{errors.domain}</p>
                )}

                <div>
                  <Label>Instructions</Label>
                  <Textarea
                    rows={2}
                    value={form.instructions}
                    onChange={(e) =>
                      setForm({ ...form, instructions: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 2 && (
              <div className="space-y-4">
                {[
                  { key: "enableOCR", label: "OCR" },
                  { key: "enableMultimodal", label: "Multimodal" },
                  { key: "enableCitations", label: "Citations" },
                ].map((opt) => (
                  <div
                    key={opt.key}
                    className="flex items-center justify-between border rounded-lg p-4"
                  >
                    <span>{opt.label}</span>

                    <Switch
                      checked={form[opt.key as keyof typeof form] as boolean}
                      onCheckedChange={(v) =>
                        setForm({ ...form, [opt.key]: v })
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {/* STEP 4 - FIXED REVIEW */}
            {step === 3 && (
              <div className="space-y-6 text-sm">

                <div className="border rounded-lg">
                  <div className="p-3 border-b font-medium">
                    Project Details
                  </div>

                  <div className="divide-y">

                    <div className="p-3">
                      <span className="text-muted-foreground block mb-1">
                        Name
                      </span>
                      <span className="font-medium">{form.name}</span>
                    </div>

                    <div className="p-3">
                      <span className="text-muted-foreground block mb-1">
                        Domain
                      </span>
                      {form.domain}
                    </div>

                    <div className="p-3">
                      <span className="text-muted-foreground block mb-1">
                        Description
                      </span>
                      {form.description}
                    </div>

                    {form.instructions && (
                      <div className="p-3">
                        <span className="text-muted-foreground block mb-1">
                          Instructions
                        </span>
                        {form.instructions}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="font-medium mb-2">
                    Processing Options
                  </div>

                  <div className="space-y-1">
                    <div>OCR: {form.enableOCR ? "Enabled" : "Disabled"}</div>
                    <div>Multimodal: {form.enableMultimodal ? "Enabled" : "Disabled"}</div>
                    <div>Citations: {form.enableCitations ? "Enabled" : "Disabled"}</div>
                  </div>
                </div>

              </div>
            )}

            {/* NAV */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={back} disabled={step === 0}>
                Back
              </Button>

              {step < 3 ? (
                <Button onClick={next}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit}>
                  Create Project
                </Button>
              )}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}