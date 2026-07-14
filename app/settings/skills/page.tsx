"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { WrenchIcon, CheckIcon, Trash2Icon, EyeIcon, EyeOffIcon, PlusIcon, SearchIcon, RefreshCwIcon, FileTextIcon, FileCodeIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type SkillFile = {
  name: string;
  content: string;
};

type Skill = {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  files: SkillFile[];
};

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

const textareaCls =
  "w-full h-[280px] border border-border/30 bg-muted/5 text-[13px] text-foreground placeholder:text-muted-foreground/35 p-3 outline-none transition-colors focus:border-foreground font-mono resize-y leading-relaxed rounded-md";

export default function SkillsSettingsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Toggle creator form visibility (full page)
  const [showAddForm, setShowAddForm] = useState(false);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState<"all" | "enabled" | "disabled">("all");

  // New Skill form states
  const [skillId, setSkillId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Multi-file creator states
  const [formFiles, setFormFiles] = useState<SkillFile[]>([
    { name: "SKILL.md", content: "" }
  ]);
  const [selectedFormFileIndex, setSelectedFormFileIndex] = useState(0);
  const [newFileName, setNewFileName] = useState("");

  // UI state: currently expanded manual preview skill ID
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
  // UI state: currently selected preview file name per skill ID
  const [selectedPreviewFileNames, setSelectedPreviewFileNames] = useState<Record<string, string>>({});

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch("/api/skills");
      const data = await res.json();
      if (res.ok) {
        setSkills(data.skills || []);
      } else {
        toast.error(data.error || "Failed to load skills registry");
      }
    } catch {
      toast.error("Failed to load skills registry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_secret");
    if (!token) return;

    const skillMd = formFiles.find((f) => f.name === "SKILL.md");
    if (!skillMd || !skillMd.content.trim()) {
      toast.error("SKILL.md file is required and cannot be empty.");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: skillId,
          name,
          description,
          files: formFiles,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Skill "${data.skill.name}" installed.`);
        setSkillId("");
        setName("");
        setDescription("");
        setFormFiles([{ name: "SKILL.md", content: "" }]);
        setSelectedFormFileIndex(0);
        setShowAddForm(false);
        fetchSkills();
      } else {
        toast.error(data.error || "Failed to install skill");
      }
    } catch {
      toast.error("Failed to install skill");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleState = async (id: string, currentEnabled: boolean) => {
    const token = localStorage.getItem("admin_secret");
    if (!token) return;

    setActionLoadingId(id);
    try {
      const res = await fetch("/api/skills", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id,
          isEnabled: !currentEnabled,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Skill state updated.`);
        fetchSkills();
      } else {
        toast.error(data.error || "Failed to toggle skill state");
      }
    } catch {
      toast.error("Failed to toggle skill state");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUninstall = async (id: string, displayName: string) => {
    const token = localStorage.getItem("admin_secret");
    if (!token) return;

    if (!confirm(`Are you sure you want to uninstall "${displayName}"? All associated script files will be deleted.`)) {
      return;
    }

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/skills?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success(`Skill uninstalled.`);
        if (expandedSkillId === id) setExpandedSkillId(null);
        fetchSkills();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to uninstall skill");
      }
    } catch {
      toast.error("Failed to uninstall skill");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddFormFile = () => {
    const cleanName = newFileName.trim();
    if (!cleanName) return;

    if (/[^a-zA-Z0-9_\.\-\/]/g.test(cleanName)) {
      toast.error("Filename contains invalid characters.");
      return;
    }

    if (formFiles.some((f) => f.name.toLowerCase() === cleanName.toLowerCase())) {
      toast.error("File already exists.");
      return;
    }

    setFormFiles((prev) => [...prev, { name: cleanName, content: "" }]);
    setSelectedFormFileIndex(formFiles.length);
    setNewFileName("");
    toast.success(`Added file "${cleanName}"`);
  };

  const handleDeleteFormFile = (index: number) => {
    const file = formFiles[index];
    if (file.name === "SKILL.md") {
      toast.error("SKILL.md is required and cannot be removed.");
      return;
    }
    setFormFiles((prev) => prev.filter((_, idx) => idx !== index));
    setSelectedFormFileIndex(0);
  };

  const handleFormFileContentChange = (content: string) => {
    setFormFiles((prev) =>
      prev.map((file, idx) => (idx === selectedFormFileIndex ? { ...file, content } : file))
    );
  };

  const handleInsertTemplate = () => {
    setFormFiles((prev) =>
      prev.map((file) => {
        if (file.name === "SKILL.md") {
          return {
            name: "SKILL.md",
            content: `# Custom Scripted Skill Manual\n\nUse this skill when the user requests help on [describe target task].\n\n## Guidelines\n1. State the objective clearly.\n2. Execute calculations or tasks by referring to [helper scripts/templates].\n3. Show output code or results structured nicely.\n\n## Script integrations\n- Refer to \`solver.py\` or \`utils.js\` included in this skill's folder for exact algorithmic steps.`,
          };
        }
        return file;
      })
    );
    toast.success("Standard manual template inserted.");
  };

  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      const matchesSearch =
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (filterState === "enabled") return matchesSearch && skill.isEnabled;
      if (filterState === "disabled") return matchesSearch && !skill.isEnabled;
      return matchesSearch;
    });
  }, [skills, searchQuery, filterState]);

  const getSelectedPreviewFile = (skill: Skill) => {
    const selectedName = selectedPreviewFileNames[skill.id];
    if (selectedName) {
      return skill.files.find((f) => f.name === selectedName) || skill.files[0];
    }
    return skill.files[0];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-10"
    >
      {/* Page Heading */}
      <div className="border-b border-border/30 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Configuration</p>
          <h2 className="text-2xl font-semibold -tracking-[0.7px] text-foreground">Skills Console</h2>
          <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed max-w-md">
            Manage custom capabilities. Skills support markdown manuals and helper scripts (`.py`, `.js`, etc.) loaded recursively.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          {/* Add Skill Button */}
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className={cn(
              "flex items-center gap-1.5 px-3 h-8 rounded-md border text-[11px] font-semibold transition-colors duration-150",
              showAddForm
                ? "border-foreground bg-foreground text-background"
                : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/10"
            )}
            title={showAddForm ? "Hide installation form" : "Install custom skill"}
          >
            <PlusIcon size={13} className={cn("transition-transform duration-200", showAddForm && "rotate-45")} />
            <span>{showAddForm ? "Cancel" : "Add Skill"}</span>
          </button>

          <button
            type="button"
            onClick={fetchSkills}
            disabled={loading}
            className="p-2 rounded-md border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors disabled:opacity-40"
            title="Refresh skills"
          >
            <RefreshCwIcon size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Conditionally Render Form or List Full-Page */}
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {showAddForm ? (
            /* Full-page Install Form */
            <motion.section
              key="add-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="border border-border/40 rounded-md overflow-hidden bg-card"
            >
              <div className="px-5 py-4 border-b border-border/30 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-0.5">Register</p>
                  <h3 className="text-[14px] font-semibold -tracking-[0.3px]">Install Scripted Skill Package</h3>
                </div>
                <button
                  type="button"
                  onClick={handleInsertTemplate}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  <FileCodeIcon size={12} />
                  <span>Insert Template</span>
                </button>
              </div>

              <form onSubmit={handleInstall} className="px-5 py-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field id="skillId" label="Skill ID" note="System Folder ID">
                    <input
                      id="skillId"
                      type="text"
                      placeholder="e.g. math_solver"
                      value={skillId}
                      onChange={(e) => setSkillId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                      required
                      className={inputCls}
                    />
                  </Field>
                  <Field id="name" label="Display Name">
                    <input
                      id="name"
                      type="text"
                      placeholder="e.g. Math Proof Solver"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className={inputCls}
                    />
                  </Field>
                </div>

                <Field id="description" label="Description" note="AI matches this to trigger the skill">
                  <input
                    id="description"
                    type="text"
                    placeholder="e.g. Generates step-by-step mathematical proofs and equation steps."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className={inputCls}
                  />
                </Field>

                <div className="space-y-4 pt-2 border-t border-border/20">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 block">Skill File Explorer</span>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add file (e.g. helper.py)"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="flex-1 h-8 px-2.5 rounded bg-muted/20 border border-border/20 text-[11px] outline-none placeholder:text-muted-foreground/45 transition-colors focus:border-border"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddFormFile();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddFormFile}
                      className="px-3 h-8 rounded border border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 border-b border-border/20 pb-2">
                    {formFiles.map((file, idx) => {
                      const isSelected = idx === selectedFormFileIndex;
                      return (
                        <div
                          key={file.name}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors select-none",
                            isSelected 
                              ? "bg-foreground text-background" 
                              : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer"
                          )}
                          onClick={() => setSelectedFormFileIndex(idx)}
                        >
                          <span>{file.name}</span>
                          {file.name !== "SKILL.md" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFormFile(idx);
                              }}
                              className={cn(
                                "p-0.5 rounded transition-colors shrink-0",
                                isSelected ? "hover:bg-background/25 text-background" : "hover:bg-muted text-muted-foreground"
                              )}
                            >
                              <XIcon size={10} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Field
                    label={`Editing file: ${formFiles[selectedFormFileIndex]?.name || ""}`}
                    note="Content will be written directly to the file on disk"
                  >
                    <textarea
                      placeholder={`Write the contents for ${formFiles[selectedFormFileIndex]?.name || ""}`}
                      value={formFiles[selectedFormFileIndex]?.content || ""}
                      onChange={(e) => handleFormFileContentChange(e.target.value)}
                      required={formFiles[selectedFormFileIndex]?.name === "SKILL.md"}
                      className={textareaCls}
                    />
                  </Field>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-5 h-10 rounded-full border border-border/40 text-[13px] font-semibold transition-colors hover:bg-muted/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-6 h-10 rounded-full bg-foreground text-background text-[13px] font-semibold transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {formLoading ? "Installing..." : (
                      <>
                        <PlusIcon size={14} />
                        <span>Install Skill</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.section>
          ) : (
            /* Full-page Registered Skills List */
            <motion.section
              key="skills-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-0.5">Active</p>
                    <h3 className="text-[15px] font-semibold -tracking-[0.4px]">Installed Registry</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground/60">
                    {filteredSkills.length} matches ({skills.length} total)
                  </span>
                </div>

                {/* Search and Filters Slab */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <SearchIcon size={12} className="text-muted-foreground/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter skills..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 rounded bg-muted/20 border border-border/20 text-[11px] outline-none placeholder:text-muted-foreground/45 transition-colors focus:border-border"
                    />
                  </div>

                  <div className="flex border border-border/30 rounded overflow-hidden divide-x divide-border/30 shrink-0">
                    {(["all", "enabled", "disabled"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFilterState(s)}
                        className={cn(
                          "px-3 h-8 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                          filterState === s ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="border border-border/40 rounded-md px-5 py-10 text-center text-xs text-muted-foreground/45 animate-pulse bg-card">
                  Loading skills list...
                </div>
              ) : filteredSkills.length === 0 ? (
                <div className="border border-dashed border-border/50 rounded-md px-5 py-10 text-center bg-card/20">
                  <WrenchIcon size={18} className="mx-auto text-muted-foreground/25 mb-2.5" strokeWidth={1.5} />
                  <p className="text-[12px] text-muted-foreground/50 italic">No skills match the current search filters.</p>
                </div>
              ) : (
                <div className="border border-border/40 rounded-md overflow-hidden divide-y divide-border/30 bg-card shadow-sm">
                  {filteredSkills.map((skill) => {
                    const isExpanded = expandedSkillId === skill.id;
                    const isActionLoading = actionLoadingId === skill.id;
                    const activePreviewFile = getSelectedPreviewFile(skill);
                    
                    return (
                      <div key={skill.id} className="transition-colors hover:bg-muted/5">
                        {/* Primary Info Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 px-5 py-4">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn("text-[13px] font-semibold -tracking-[0.2px] truncate", !skill.isEnabled && "text-muted-foreground/50 line-through")}>
                                {skill.name}
                              </span>
                              <span className="text-[9px] font-mono bg-muted/40 px-1.5 py-0.5 rounded text-muted-foreground/60">
                                {skill.id}
                              </span>
                              <span className="text-[9px] font-mono bg-muted/20 px-1.5 py-0.5 rounded text-muted-foreground/45">
                                {skill.files.length} file{skill.files.length !== 1 ? "s" : ""}
                              </span>
                              {!skill.isEnabled && (
                                <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/40 border border-border/30 px-1.5 py-px rounded-full">
                                  Disabled
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground/60 leading-normal">{skill.description}</p>
                          </div>

                          {/* Action buttons panel */}
                          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                            {/* Toggle enabled state */}
                            <button
                              type="button"
                              onClick={() => handleToggleState(skill.id, skill.isEnabled)}
                              disabled={isActionLoading}
                              className={cn(
                                "px-2.5 h-7 rounded border text-[10px] font-semibold transition-colors duration-150 disabled:opacity-40",
                                skill.isEnabled
                                  ? "border-border text-foreground hover:bg-muted/20"
                                  : "border-border/30 text-muted-foreground hover:text-foreground hover:border-border"
                              )}
                            >
                              {skill.isEnabled ? "Disable" : "Enable"}
                            </button>

                            {/* View manual expander */}
                            <button
                              type="button"
                              onClick={() => setExpandedSkillId(isExpanded ? null : skill.id)}
                              className={cn(
                                "p-1.5 rounded border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/15 transition-colors",
                                isExpanded && "bg-muted/10 text-foreground"
                              )}
                              title="View skill contents"
                            >
                              {isExpanded ? <EyeOffIcon size={12} /> : <EyeIcon size={12} />}
                            </button>

                            {/* Uninstall */}
                            <button
                              type="button"
                              onClick={() => handleUninstall(skill.id, skill.name)}
                              disabled={isActionLoading}
                              className="p-1.5 rounded border border-border/40 text-muted-foreground/45 hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-colors disabled:opacity-40"
                              title="Uninstall skill"
                            >
                              <Trash2Icon size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Expandable Multi-file Previewer Section */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              className="overflow-hidden bg-muted/10 border-t border-border/20"
                            >
                              <div className="px-5 py-4 space-y-3">
                                <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/40 block">Skill Files Explorer</span>
                                
                                {/* File tabs for preview */}
                                <div className="flex flex-wrap gap-1 border-b border-border/10 pb-1.5">
                                  {skill.files.map((file) => {
                                    const isSelected = activePreviewFile?.name === file.name;
                                    return (
                                      <button
                                        key={file.name}
                                        type="button"
                                        onClick={() => setSelectedPreviewFileNames((prev) => ({ ...prev, [skill.id]: file.name }))}
                                        className={cn(
                                          "px-2 py-0.5 rounded text-[10px] font-mono transition-colors",
                                          isSelected
                                            ? "bg-foreground/10 text-foreground font-semibold"
                                            : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/20"
                                        )}
                                      >
                                        {file.name}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Active preview file viewer */}
                                {activePreviewFile ? (
                                  <pre className="text-[11px] font-mono p-4 bg-muted/30 border border-border/25 rounded text-muted-foreground overflow-x-auto max-h-80 leading-relaxed whitespace-pre-wrap select-text">
                                    {activePreviewFile.content || <span className="italic text-muted-foreground/35">Empty file.</span>}
                                  </pre>
                                ) : (
                                  <div className="text-[11px] text-muted-foreground/40 italic py-2">No files found.</div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
