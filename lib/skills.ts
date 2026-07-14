import fs from "fs";
import path from "path";

export type SkillFile = {
  name: string;
  content: string;
};

export type Skill = {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  files: SkillFile[];
};

const SKILLS_DIR = "/home/user/cloudbotics/skills";

// Helper to read files inside a directory recursively (relative to starting dir)
function readFilesRecursively(dir: string, baseDir: string): SkillFile[] {
  const list = fs.readdirSync(dir, { withFileTypes: true });
  let files: SkillFile[] = [];

  for (const ent of list) {
    const fullPath = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name.startsWith(".") || ent.name === "node_modules") continue;
      files = files.concat(readFilesRecursively(fullPath, baseDir));
    } else {
      if (ent.name === "skill.json" || ent.name.startsWith(".") || ent.name === "LICENSE.txt") continue;
      
      const ext = path.extname(ent.name).toLowerCase();
      const textExtensions = [".md", ".txt", ".py", ".js", ".ts", ".json", ".csv", ".sh", ".yml", ".yaml", ".html", ".css", ".sql", ".xml"];
      if (ext && !textExtensions.includes(ext)) continue;

      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        const relPath = path.relative(baseDir, fullPath);
        files.push({ name: relPath, content });
      } catch (err) {
        console.error(`Error reading file ${fullPath}:`, err);
      }
    }
  }
  return files;
}

export async function loadSkills(): Promise<Skill[]> {
  try {
    if (!fs.existsSync(SKILLS_DIR)) {
      fs.mkdirSync(SKILLS_DIR, { recursive: true });
    }
    const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
    const loaded: Skill[] = [];
    for (const ent of dirs) {
      if (ent.isDirectory()) {
        const dirPath = path.join(SKILLS_DIR, ent.name);
        const configPath = path.join(dirPath, "skill.json");
        const manualPath = path.join(dirPath, "SKILL.md");

        let name = ent.name
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        let description = "";
        let isEnabled = true;

        if (fs.existsSync(configPath)) {
          try {
            const meta = JSON.parse(fs.readFileSync(configPath, "utf-8"));
            if (meta.name) name = meta.name;
            if (meta.description) description = meta.description;
            if (typeof meta.isEnabled === "boolean") isEnabled = meta.isEnabled;
          } catch (err) {
            console.error(`Failed to parse skill.json in ${ent.name}:`, err);
          }
        } else {
          // Fallback name parser from SKILL.md title
          if (fs.existsSync(manualPath)) {
            try {
              const manualContent = fs.readFileSync(manualPath, "utf-8");
              const firstLine = manualContent.split("\n")[0] || "";
              if (firstLine.startsWith("#")) {
                name = firstLine.replace(/^#+\s*/, "").trim();
              }
            } catch (err) {
              console.error(`Failed to parse SKILL.md in ${ent.name}:`, err);
            }
          }
        }

        const files = readFilesRecursively(dirPath, dirPath);
        loaded.push({
          id: ent.name,
          name,
          description: description || `Custom capability for ${name}.`,
          isEnabled,
          files,
        });
      }
    }
    return loaded;
  } catch (err) {
    console.error("Failed to load skills:", err);
    return [];
  }
}

export async function getSkills(): Promise<Skill[]> {
  return loadSkills();
}

export async function getSkillDetails(id: string): Promise<{ name: string; files: SkillFile[] } | { error: string }> {
  const list = await getSkills();
  const skill = list.find((s) => s.id === id);
  if (!skill) {
    return { error: `Skill "${id}" not found.` };
  }
  if (!skill.isEnabled) {
    return { error: `Skill "${id}" is currently disabled.` };
  }
  return { name: skill.name, files: skill.files };
}

export async function createOrUpdateSkill(
  id: string,
  name: string,
  description: string,
  files: SkillFile[],
  isEnabled = true
): Promise<Skill> {
  const dir = path.join(SKILLS_DIR, id);

  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });

  const meta = { id, name, description, isEnabled };
  fs.writeFileSync(path.join(dir, "skill.json"), JSON.stringify(meta, null, 2));

  for (const file of files) {
    const filePath = path.join(dir, file.name);
    const parentDir = path.dirname(filePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(filePath, file.content);
  }

  const list = await getSkills();
  return list.find((s) => s.id === id)!;
}

export async function toggleSkillState(id: string, isEnabled: boolean): Promise<Skill | null> {
  const dir = path.join(SKILLS_DIR, id);
  const configPath = path.join(dir, "skill.json");
  let meta: any = { id, isEnabled };

  if (fs.existsSync(configPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      meta.isEnabled = isEnabled;
    } catch {}
  } else {
    const list = await getSkills();
    const existing = list.find((s) => s.id === id);
    if (existing) {
      meta.name = existing.name;
      meta.description = existing.description;
    }
  }

  try {
    fs.writeFileSync(configPath, JSON.stringify(meta, null, 2));
    const list = await getSkills();
    return list.find((s) => s.id === id) || null;
  } catch {
    return null;
  }
}

export async function deleteSkill(id: string): Promise<boolean> {
  const dir = path.join(SKILLS_DIR, id);
  if (!fs.existsSync(dir)) return false;

  try {
    fs.rmSync(dir, { recursive: true, force: true });
    return true;
  } catch (err) {
    console.error("deleteSkill error:", err);
    return false;
  }
}
