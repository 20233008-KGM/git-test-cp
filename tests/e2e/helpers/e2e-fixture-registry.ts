import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

type FixturePayload = {
  runId: string;
  createdAt: string;
  courseId?: string;
  emails: string[];
};

const FIXTURE_DIR = path.resolve("tests/e2e/.e2e-fixtures");

export class E2EFixtureRegistry {
  readonly runId: string;
  readonly filePath: string;
  private payload: FixturePayload;

  constructor(runId?: string) {
    this.runId = runId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.filePath = path.join(FIXTURE_DIR, `${this.runId}.json`);
    this.payload = {
      runId: this.runId,
      createdAt: new Date().toISOString(),
      emails: [],
    };
  }

  setCourseId(courseId: string) {
    if (!courseId.trim()) return;
    this.payload.courseId = courseId.trim();
  }

  registerEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;
    if (!this.payload.emails.includes(normalized)) {
      this.payload.emails.push(normalized);
    }
  }

  get snapshot() {
    return this.payload;
  }

  async flush() {
    await mkdir(FIXTURE_DIR, { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.payload, null, 2), "utf8");
  }

  async cleanupFile() {
    await rm(this.filePath, { force: true });
  }
}

export async function readFixturePayload(filePath: string): Promise<FixturePayload | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as FixturePayload;
  } catch {
    return null;
  }
}
