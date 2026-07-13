"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { CpuIcon, LayersIcon, Loader2Icon, CheckIcon, SearchIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ModelIcon } from "@/components/chat/icons";

type ConfiguredModel = {
  id: string;
  name: string;
  provider: string;
  baseUrl: string | null;
  apiKey: string;
  modelId: string;
};

type FetchedModelItem = {
  id: string;
  object?: string;
};

const PROVIDER_PRESETS: Array<{ name: string; baseUrl: string }> = [
  { name: "Custom", baseUrl: "" },
  { name: "OpenAI", baseUrl: "https://api.openai.com/v1" },
  { name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1" },
  { name: "Groq", baseUrl: "https://api.groq.com/openai/v1" },
  { name: "Together AI", baseUrl: "https://api.together.xyz/v1" },
  { name: "Fireworks AI", baseUrl: "https://api.fireworks.ai/inference/v1" },
  { name: "DeepSeek", baseUrl: "https://api.deepseek.com/v1" },
  { name: "DeepInfra", baseUrl: "https://api.deepinfra.com/v1/openai" },
  { name: "Cerebras", baseUrl: "https://api.cerebras.ai/v1" },
  { name: "Mistral AI", baseUrl: "https://api.mistral.ai/v1" },
  { name: "Nebius AI Studio", baseUrl: "https://api.studio.nebius.ai/v1" },
  { name: "xAI (Grok)", baseUrl: "https://api.x.ai/v1" },
  { name: "Perplexity", baseUrl: "https://api.perplexity.ai" },
  { name: "Baseten", baseUrl: "https://inference.baseten.co/v1" },
  { name: "Hugging Face Router", baseUrl: "https://router.huggingface.co/v1" },
  { name: "NVIDIA NIM", baseUrl: "https://integrate.api.nvidia.com/v1" },
  { name: "DashScope (Intl)", baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1" },
  { name: "DashScope (China)", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
  { name: "SiliconFlow", baseUrl: "https://api.siliconflow.cn/v1" },
  { name: "Moonshot AI (Kimi)", baseUrl: "https://api.moonshot.ai/v1" },
  { name: "Z.AI (GLM)", baseUrl: "https://api.z.ai/api/paas/v4" },
  { name: "Requesty", baseUrl: "https://router.requesty.ai/v1" },
  { name: "GitHub Models", baseUrl: "https://models.inference.ai.azure.com" },
];

function Field({
  id,
  label,
  note,
  children,
}: {
  id?: string;
  label: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
          {label}
        </label>
        {note && <span className="text-[10px] text-muted-foreground/50">{note}</span>}
      </div>
      {children}
    </div>
  );
}

const inputCls =
  "w-full h-10 border-b border-border/50 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/35 py-2 outline-none transition-colors focus:border-foreground";

export default function ModelsSettingsPage() {
  const [models, setModels] = useState<ConfiguredModel[]>([]);
  const [secret, setSecret] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelId, setModelId] = useState("");
  const [providerName, setProviderName] = useState("");
  const [loading, setLoading] = useState(false);

  const [fetchedModels, setFetchedModels] = useState<FetchedModelItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [manualModelId, setManualModelId] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const providerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const adminSecret = localStorage.getItem("admin_secret");
    if (adminSecret) {
      setSecret(adminSecret);
      fetchModels(adminSecret);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setIsComboboxOpen(false);
      }
      if (providerDropdownRef.current && !providerDropdownRef.current.contains(e.target as Node)) {
        setIsProviderOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchModels = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/models", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setModels(data.models || []);
      else toast.error(data.error || "Failed to load models");
    } catch {
      toast.error("Failed to load models");
    }
  }, []);

  const handleFetchProviderModels = useCallback(async (targetUrl = baseUrl, targetKey = apiKey) => {
    if (!targetUrl) return;
    setIsFetching(true);
    try {
      const cleanUrl = targetUrl.endsWith("/models") ? targetUrl : `${targetUrl.replace(/\/$/, "")}/models`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (targetKey) headers["Authorization"] = `Bearer ${targetKey}`;
      const res = await fetch(cleanUrl, { method: "GET", headers });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list: FetchedModelItem[] = data.data || [];
      if (list.length > 0) {
        setFetchedModels(list);
        setManualModelId(false);
        setSearchQuery("");
        toast.success(`Retrieved ${list.length} models from endpoint.`);
      } else {
        setFetchedModels([]);
        setManualModelId(true);
      }
    } catch {
      setFetchedModels([]);
      setManualModelId(true);
    } finally {
      setIsFetching(false);
    }
  }, [baseUrl, apiKey]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
        body: JSON.stringify({ name, provider: providerName || "custom", baseUrl: baseUrl || null, apiKey: apiKey || "", modelId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add model");
      toast.success("Model added.");
      setName(""); setBaseUrl(""); setApiKey(""); setModelId("");
      setProviderName("");
      setFetchedModels([]); setManualModelId(true);
      fetchModels(secret);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!secret || !confirm("Delete this model?")) return;
    try {
      const res = await fetch(`/api/models?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete model");
      toast.success("Model deleted.");
      fetchModels(secret);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const filteredModels = fetchedModels.filter((item) =>
    item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-10"
    >
      {/* Page heading */}
      <div className="border-b border-border/30 pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Configuration</p>
        <h2 className="text-2xl font-semibold -tracking-[0.7px] text-foreground">Models</h2>
        <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed max-w-md">
          Register custom LLM endpoints. Supports any OpenAI-compatible provider or local instance.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">

        {/* Add form */}
        <section className="border border-border/40 rounded-md overflow-hidden">
          <div className="px-5 py-4 border-b border-border/30">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-0.5">Register</p>
            <h3 className="text-[15px] font-semibold -tracking-[0.4px]">Add Model</h3>
          </div>
          <form onSubmit={handleAdd} className="px-5 py-6 space-y-6">
            {/* Provider Preset Selector */}
            <Field id="provider" label="Provider">
              <div className="relative" ref={providerDropdownRef}>
                <div
                  onClick={() => setIsProviderOpen(!isProviderOpen)}
                  className="flex h-10 w-full items-center justify-between border-b border-border/50 bg-transparent py-2 cursor-pointer select-none"
                >
                  <span className={cn("text-[13px]", providerName ? "text-foreground" : "text-muted-foreground/35")}>
                    {providerName || "Select a provider…"}
                  </span>
                  <ChevronDownIcon size={13} className={cn("text-muted-foreground/50 transition-transform duration-150 shrink-0", isProviderOpen && "rotate-180")} />
                </div>
                <AnimatePresence>
                  {isProviderOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute left-0 right-0 z-50 mt-1 max-h-64 rounded-md border border-border/40 bg-card shadow-md overflow-y-auto"
                    >
                      {PROVIDER_PRESETS.map((preset) => {
                    const isCustom = preset.name === "Custom";
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setProviderName(preset.name);
                          setBaseUrl(preset.baseUrl);
                          setIsProviderOpen(false);
                          if (isCustom) {
                            // Reset fetched models and switch to manual input
                            setFetchedModels([]);
                            setManualModelId(true);
                          } else if (preset.baseUrl) {
                            // Auto-fetch models when a preset provider is selected
                            handleFetchProviderModels(preset.baseUrl, apiKey);
                          }
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[12px] border-b border-border/10 last:border-0 transition-colors",
                          providerName === preset.name ? "bg-muted/20 text-foreground font-semibold" : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isCustom && (
                            <span className="text-[10px] font-mono text-muted-foreground/30 border border-border/30 rounded px-1.5 py-0.5 leading-none">
                              Manual
                            </span>
                          )}
                          <span className="truncate">{preset.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {preset.baseUrl && (
                            <span className="text-[10px] font-mono text-muted-foreground/40 truncate max-w-[180px] text-right">
                              {preset.baseUrl}
                            </span>
                          )}
                          {!isCustom && providerName === preset.name && (
                            <CheckIcon size={11} className="shrink-0 text-foreground" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Field>

            <Field id="baseUrl" label="Base Endpoint URL" note={providerName ? `Pre-filled from ${providerName}` : "Paste the full endpoint URL"}>
              <div className="relative">
                <input
                  id="baseUrl"
                  type="url"
                  placeholder="https://api.example.com/v1"
                  value={baseUrl}
                  onChange={(e) => {
                    const nextUrl = e.target.value;
                    setBaseUrl(nextUrl);
                    // If user edits the URL away from the preset, clear provider selection
                    const matchedPreset = PROVIDER_PRESETS.find((p) => p.baseUrl === nextUrl);
                    if (!matchedPreset) {
                      setProviderName((prev) => {
                        const presetUrl = PROVIDER_PRESETS.find((p) => p.name === prev)?.baseUrl;
                        return prev && nextUrl !== presetUrl ? "" : prev;
                      });
                    }
                  }}
                  onBlur={() => baseUrl && handleFetchProviderModels(baseUrl, apiKey)}
                  required
                  className={cn(inputCls, "pr-8")}
                />
                {providerName && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center">
                    <CheckIcon size={11} className="text-foreground/50" />
                  </span>
                )}
              </div>
            </Field>

            <Field id="apiKey" label="API Key" note="Optional for local / open-weight providers">
              <input
                id="apiKey"
                type="password"
                placeholder="sk-••••••••••••••••"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onBlur={() => baseUrl && handleFetchProviderModels(baseUrl, apiKey)}
                className={inputCls}
              />
            </Field>

            {/* Model ID — combobox or manual */}
            <Field
              label="Model ID"
              note={isFetching ? "Fetching…" : fetchedModels.length > 0 ? `${fetchedModels.length} models available` : undefined}
            >
              {!manualModelId && fetchedModels.length > 0 ? (
                <div className="relative" ref={comboboxRef}>
                  <div
                    onClick={() => setIsComboboxOpen(!isComboboxOpen)}
                    className="flex h-10 w-full items-center justify-between border-b border-border/50 bg-transparent py-2 cursor-pointer select-none"
                  >
                    <span className={cn("text-[13px]", modelId ? "text-foreground" : "text-muted-foreground/35")}>
                      {modelId || "Select a model…"}
                    </span>
                    <div className="flex items-center gap-2">
                      {isFetching && <Loader2Icon size={11} className="animate-spin text-muted-foreground/50" />}
                      <ChevronDownIcon size={13} className={cn("text-muted-foreground/50 transition-transform duration-150", isComboboxOpen && "rotate-180")} />
                    </div>
                  </div>
                  <AnimatePresence>
                    {isComboboxOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 right-0 z-50 mt-1 max-h-60 rounded-md border border-border/40 bg-card shadow-md flex flex-col overflow-hidden"
                      >
                        <div className="flex items-center border-b border-border/20 px-3">
                          <SearchIcon size={11} className="text-muted-foreground/50 shrink-0" />
                          <input
                            type="text"
                            placeholder="Search…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 py-2.5 px-2 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/35 outline-none"
                          />
                        </div>
                        <div className="overflow-y-auto">
                          {filteredModels.length === 0 ? (
                            <div className="text-center text-[11px] text-muted-foreground/40 py-4 italic">No results.</div>
                          ) : filteredModels.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setModelId(item.id);
                                const cleanName = item.id.split("/").pop()?.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || item.id;
                                setName(cleanName);
                                setIsComboboxOpen(false);
                              }}
                              className={cn(
                                "flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[12px] border-b border-border/10 last:border-0 transition-colors",
                                item.id === modelId ? "bg-muted/20 text-foreground font-semibold" : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                              )}
                            >
                              <span className="truncate">{item.id}</span>
                              {item.id === modelId && <CheckIcon size={11} className="shrink-0 ml-2" />}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                    type="button"
                    onClick={() => { setManualModelId(true); setIsComboboxOpen(false); }}
                    className="mt-1.5 text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    Enter ID manually instead
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="e.g. deepseek-chat"
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    required
                    className={inputCls}
                  />
                  {fetchedModels.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setManualModelId(false)}
                      className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors"
                    >
                      Select from retrieved list instead
                    </button>
                  )}
                </div>
              )}
            </Field>

            <Field id="name" label="Display Name">
              <input
                id="name"
                type="text"
                placeholder="e.g. DeepSeek Coder"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputCls}
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-full bg-foreground text-background text-[13px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? "Saving…" : "Save Model"}
            </button>
          </form>
        </section>

        {/* Active models list */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-0.5">Registered</p>
              <h3 className="text-[15px] font-semibold -tracking-[0.4px]">Active Models</h3>
            </div>
            <span className="text-[11px] text-muted-foreground/60">{models.length} model{models.length !== 1 ? "s" : ""}</span>
          </div>

          {models.length === 0 ? (
            <div className="border border-dashed border-border/50 rounded-md px-5 py-10 text-center">
              <LayersIcon size={20} className="mx-auto text-muted-foreground/30 mb-3" strokeWidth={1} />
              <p className="text-[12px] text-muted-foreground/50 italic">No models configured yet.</p>
              <p className="text-[11px] text-muted-foreground/35 mt-1">Add one using the form to start chatting.</p>
            </div>
          ) : (
            <div className="border border-border/40 rounded-md overflow-hidden divide-y divide-border/30">
              {models.map((model) => (
                <div key={model.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/5 transition-colors">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground ring-1 ring-border/50 overflow-hidden">
                        <ModelIcon name={model.modelId} size={11} />
                      </div>
                      <span className="text-[13px] font-semibold text-foreground -tracking-[0.2px] truncate">{model.name}</span>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground/60 truncate pl-[28px]">{model.modelId}</p>
                    {model.baseUrl && (
                      <p className="text-[10px] font-mono text-muted-foreground/40 truncate pl-[28px]">{model.baseUrl}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(model.id)}
                    className="shrink-0 p-1.5 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/20 transition-colors"
                    title="Delete model"
                  >
                    <XIcon size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}
