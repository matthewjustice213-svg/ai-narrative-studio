import matter from "gray-matter";
import path from "node:path";
import { soulFrontmatterSchema, type Persona } from "../src/lib/schema.js";

function resolveAvatar(sourceSoulPath: string, avatar?: string) {
  if (!avatar) return null;
  if (path.isAbsolute(avatar)) return avatar;
  return path.resolve(path.dirname(sourceSoulPath), avatar);
}

export function parseSoulMarkdown(markdown: string, sourceSoulPath: string): Persona {
  const parsed = matter(markdown);
  const frontmatter = soulFrontmatterSchema.safeParse(parsed.data);

  if (!frontmatter.success) {
    const issues = frontmatter.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid soul.md frontmatter: ${issues}`);
  }

  // model and temperature are accepted in soul.md for future persona-level generation settings.
  return {
    id: frontmatter.data.id,
    name: frontmatter.data.name,
    role: frontmatter.data.role,
    specialty: frontmatter.data.specialty,
    tone: frontmatter.data.tone,
    avatarPath: resolveAvatar(sourceSoulPath, frontmatter.data.avatar),
    visible: !frontmatter.data.disabled,
    sourceSoulPath,
    allowedTasks: frontmatter.data.allowed_tasks,
    bodyMarkdown: parsed.content.trim()
  };
}
