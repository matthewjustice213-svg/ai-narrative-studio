import { describe, expect, it } from "vitest";
import path from "node:path";
import { parseSoulMarkdown } from "../personaParser";

const validSoul = `---
id: awkward-comedy-doctor
name: Ruth
role: Dialogue Punch-Up Writer
specialty: grounded awkward comedy
tone: blunt, practical, dry
avatar: ./avatars/ruth.png
allowed_tasks:
  - dialogue_notes
  - punch_up
  - scene_conflict
---

## Taste
Grounded comedy, uncomfortable silence, tiny status shifts.
`;

describe("parseSoulMarkdown", () => {
  it("parses valid structured soul markdown into a persona", () => {
    const persona = parseSoulMarkdown(validSoul, "C:/story/writers-room/ruth.soul.md");

    expect(persona.id).toBe("awkward-comedy-doctor");
    expect(persona.name).toBe("Ruth");
    expect(persona.sourceSoulPath).toBe("C:/story/writers-room/ruth.soul.md");
    expect(persona.avatarPath).toBe(path.normalize("C:/story/writers-room/avatars/ruth.png"));
    expect(persona.allowedTasks).toContain("punch_up");
    expect(persona.visible).toBe(true);
    expect(persona.bodyMarkdown).toBe(
      "## Taste\nGrounded comedy, uncomfortable silence, tiny status shifts."
    );
  });

  it("maps disabled frontmatter to hidden personas", () => {
    const persona = parseSoulMarkdown(
      validSoul.replace("allowed_tasks:", "disabled: true\nallowed_tasks:"),
      "C:/story/writers-room/ruth.soul.md"
    );

    expect(persona.visible).toBe(false);
  });

  it("returns clear validation details for missing required frontmatter", () => {
    expect(() =>
      parseSoulMarkdown(
        `---
id: no-name
role: Dialogue Doctor
specialty: subtext
tone: direct
allowed_tasks:
  - dialogue_notes
---

## Rules
Be useful.
`,
        "C:/story/writers-room/no-name.soul.md"
      )
    ).toThrow(/Invalid soul\.md frontmatter: name:/);
  });

  it("rejects unsupported allowed task values with field details", () => {
    expect(() =>
      parseSoulMarkdown(
        validSoul.replace("punch_up", "unauthorized_rewrite"),
        "C:/story/writers-room/ruth.soul.md"
      )
    ).toThrow(/allowed_tasks\.1:/);
  });
});
