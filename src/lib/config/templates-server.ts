import fs from "fs";
import path from "path";
import { DEFAULT_TEMPLATES, TemplateRecord } from "./templates";

const STORAGE_FILE = path.join(process.cwd(), "storage", "templates_registry.json");

function ensureStorageDir() {
  const dir = path.dirname(STORAGE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getAllTemplates(): TemplateRecord[] {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to read templates registry file, using defaults", e);
  }
  return DEFAULT_TEMPLATES;
}

export function getActiveTemplates(): TemplateRecord[] {
  return getAllTemplates().filter((t) => t.isActive);
}

export function saveTemplates(templates: TemplateRecord[]): void {
  try {
    ensureStorageDir();
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(templates, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to write templates registry file", e);
  }
}

export function addTemplate(template: Omit<TemplateRecord, "id"> & { id?: string }): TemplateRecord {
  const templates = getAllTemplates();
  const slug = template.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const newTemplate: TemplateRecord = {
    ...template,
    id: slug,
    slug,
    directory: template.directory || slug,
    isActive: template.isActive !== undefined ? template.isActive : false,
    version: template.version || "v1",
    availablePlans: template.availablePlans || ["free", "starter", "pro", "agency"],
    sortOrder: template.sortOrder !== undefined ? template.sortOrder : templates.length + 1,
  };

  const existingIndex = templates.findIndex((t) => t.id === newTemplate.id);
  if (existingIndex >= 0) {
    templates[existingIndex] = newTemplate;
  } else {
    templates.push(newTemplate);
  }

  saveTemplates(templates);
  return newTemplate;
}

export function updateTemplate(id: string, updates: Partial<TemplateRecord>): TemplateRecord | null {
  const templates = getAllTemplates();
  const index = templates.findIndex((t) => t.id === id);
  if (index === -1) return null;

  templates[index] = { ...templates[index], ...updates };
  saveTemplates(templates);
  return templates[index];
}

export function deleteTemplate(id: string): boolean {
  const templates = getAllTemplates();
  const filtered = templates.filter((t) => t.id !== id);
  if (filtered.length === templates.length) return false;
  saveTemplates(filtered);
  return true;
}
