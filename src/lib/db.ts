import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
let pool: pg.Pool | undefined;
let local: Promise<PGlite> | undefined;

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  if (databaseUrl !== "") {
    pool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    return (await pool.query(text, params)).rows as T[];
  }
  local ??= startLocal().catch((error: unknown) => {
    local = undefined;
    throw error;
  });
  return (await (await local).query<T>(text, params)).rows;
}

function localFileDir(): string {
  const custom = process.env.REPOSTUDIO_DATA_DIR?.trim();
  return custom
    ? path.join(custom, "pglite")
    : path.join(process.cwd(), ".data", "pglite");
}

async function canWriteDirectory(dir: string): Promise<boolean> {
  const probe = path.join(dir, ".write-probe");
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(probe, "ok");
    await rm(probe, { force: true });
    return true;
  } catch {
    return false;
  }
}

async function startLocal(): Promise<PGlite> {
  const fileDir = localFileDir();
  if (await canWriteDirectory(fileDir)) {
    try {
      return await openLocal(fileDir);
    } catch (error) {
      console.error("Local database file could not be opened:", error);
    }
  }
  return openLocal();
}

async function openLocal(dataDir?: string): Promise<PGlite> {
  const db = dataDir ? new PGlite(dataDir) : new PGlite();
  const files = (await readdir("migrations").catch(() => []))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    await db.exec(await readFile(`migrations/${file}`, "utf8"));
  }
  await db.query("select 1");
  return db;
}
