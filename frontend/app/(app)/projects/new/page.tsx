"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight, Check, Sparkles, Brain, Settings, FileText, Layers, Zap, Shield, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = ["Basic Info", "Domain", "Processing", "Review"];

const DOMAINS = [
  { value: "Legal", desc: "Contracts, compliance, regulatory docs", icon: Shield },
  { value: "Research", desc: "Academic papers, clinical studies", icon: Search },
  { value: "Finance", desc: "Reports, filings, analysis", icon: Layers },
  { value: "General", desc: "Mixed document workflows", icon: Brain },
];

const FEATURES = [
  { key: "enableOCR", label: "OCR Processing", desc: "Extract text from images", icon: Search },
  { key: "enableMultimodal", label: "Multimodal", desc: "Process images + text", icon: Layers },
  { key: "enableCitations", label: "Citations", desc: "Include source references", icon: FileText },
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

  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/projects/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success("Project created successfully");

      router.push(`/projects/${data.project.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create project");
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-secondary/5 pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-6 py-12">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 space-y-2"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Create Project</h1>
              <p className="text-sm text-muted-foreground">Configure your document intelligence workspace</p>
            </div>
          </div>
        </motion.div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center flex-1"
              >
                <motion.div
                  className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300",
                    i < step
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg"
                      : i === step
                      ? "bg-foreground text-background shadow-lg scale-110"
                      : "bg-secondary/50 text-muted-foreground border border-border/50"
                  )}
                >
                  {i < step ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Check className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    i + 1
                  )}
                </motion.div>

                <span
                  className={cn(
                    "text-xs mt-2.5 font-medium transition-colors",
                    i === step
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </motion.div>

              {i !== STEPS.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                  className={cn(
                    "h-0.5 flex-1 mx-2 origin-left",
                    i < step ? "bg-primary" : "bg-border/50"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                {/* STEP 0 - Basic Info */}
                {step === 0 && (
                  <motion.div
                    key="step0"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Project Name</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="My Document Project"
                        className="h-12 rounded-xl bg-secondary/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                      />
                      {errors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-destructive flex items-center gap-1"
                        >
                          <span className="h-1 w-1 rounded-full bg-destructive" />
                          {errors.name}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Description</Label>
                      <Textarea
                        rows={4}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Describe what you'll be working on..."
                        className="resize-none rounded-xl bg-secondary/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                      />
                      {errors.description && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-destructive flex items-center gap-1"
                        >
                          <span className="h-1 w-1 rounded-full bg-destructive" />
                          {errors.description}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* STEP 1 - Domain */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Select Domain</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {DOMAINS.map((d, i) => {
                          const Icon = d.icon;
                          const isSelected = form.domain === d.value;
                          return (
                            <motion.button
                              key={d.value}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                              onClick={() => setForm({ ...form, domain: d.value })}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={cn(
                                "rounded-xl border p-4 text-left transition-all duration-300",
                                isSelected
                                  ? "border-primary/50 bg-primary/10 shadow-lg"
                                  : "border-border/50 hover:border-primary/30 hover:bg-secondary/30"
                              )}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <div className={cn(
                                  "h-8 w-8 rounded-lg flex items-center justify-center",
                                  isSelected ? "bg-primary/20" : "bg-secondary/50"
                                )}>
                                  <Icon className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                                </div>
                                <span className="text-sm font-semibold">{d.value}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{d.desc}</p>
                            </motion.button>
                          );
                        })}
                      </div>
                      {errors.domain && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-destructive flex items-center gap-1"
                        >
                          <span className="h-1 w-1 rounded-full bg-destructive" />
                          {errors.domain}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Custom Instructions (Optional)</Label>
                      <Textarea
                        rows={3}
                        value={form.instructions}
                        onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                        placeholder="Any specific processing instructions..."
                        className="resize-none rounded-xl bg-secondary/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 2 - Processing */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <Label className="text-sm font-medium mb-2 block">Processing Options</Label>
                    {FEATURES.map((opt, i) => {
                      const FeatureIcon = opt.icon;
                      return (
                        <motion.div
                          key={opt.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ x: 4 }}
                          className={cn(
                            "flex items-center justify-between border rounded-xl p-4 transition-all",
                            form[opt.key as keyof typeof form]
                              ? "border-primary/30 bg-primary/5"
                              : "border-border/50 hover:bg-secondary/30"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-9 w-9 rounded-lg flex items-center justify-center",
                              form[opt.key as keyof typeof form] ? "bg-primary/20" : "bg-secondary/50"
                            )}>
                              <FeatureIcon className={cn("h-4 w-4", form[opt.key as keyof typeof form] ? "text-primary" : "text-muted-foreground")} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{opt.label}</p>
                              <p className="text-xs text-muted-foreground">{opt.desc}</p>
                            </div>
                          </div>
                          <Switch
                            checked={form[opt.key as keyof typeof form] as boolean}
                            onCheckedChange={(v) => setForm({ ...form, [opt.key]: v })}
                          />
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {/* STEP 3 - Review */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-6 text-sm"
                  >
                    <div className="border border-border/50 rounded-xl overflow-hidden">
                      <div className="p-4 border-b border-border/50 bg-secondary/30">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary" />
                          <span className="font-semibold">Project Details</span>
                        </div>
                      </div>
                      <div className="divide-y divide-border/50">
                        <div className="p-4">
                          <span className="text-muted-foreground block mb-1.5 text-xs uppercase tracking-wide">Name</span>
                          <span className="font-medium">{form.name}</span>
                        </div>
                        <div className="p-4">
                          <span className="text-muted-foreground block mb-1.5 text-xs uppercase tracking-wide">Domain</span>
                          <span className="font-medium">{form.domain}</span>
                        </div>
                        <div className="p-4">
                          <span className="text-muted-foreground block mb-1.5 text-xs uppercase tracking-wide">Description</span>
                          <p className="text-muted-foreground leading-relaxed">{form.description}</p>
                        </div>
                        {form.instructions && (
                          <div className="p-4">
                            <span className="text-muted-foreground block mb-1.5 text-xs uppercase tracking-wide">Instructions</span>
                            <p className="text-muted-foreground leading-relaxed">{form.instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border border-border/50 rounded-xl overflow-hidden">
                      <div className="p-4 border-b border-border/50 bg-secondary/30">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-primary" />
                          <span className="font-semibold">Processing Options</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        {[
                          { key: "enableOCR", label: "OCR Processing" },
                          { key: "enableMultimodal", label: "Multimodal" },
                          { key: "enableCitations", label: "Citations" },
                        ].map((opt) => (
                          <div key={opt.key} className="flex items-center justify-between">
                            <span className="text-muted-foreground">{opt.label}</span>
                            <span className={cn(
                              "text-xs font-medium px-2 py-1 rounded-full",
                              form[opt.key as keyof typeof form]
                                ? "bg-green-500/10 text-green-400"
                                : "bg-secondary text-muted-foreground"
                            )}>
                              {form[opt.key as keyof typeof form] ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between pt-6 mt-6 border-t border-border/50">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    onClick={back}
                    disabled={step === 0}
                    className="rounded-xl px-6"
                  >
                    Back
                  </Button>
                </motion.div>

                {step < 3 ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={next}
                      className="gap-2 rounded-xl px-6 shadow-lg"
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleSubmit}
                      className="gap-2 rounded-xl px-6 shadow-lg bg-gradient-to-r from-primary to-primary/90"
                    >
                      <Sparkles className="h-4 w-4" />
                      Create Project
                    </Button>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
