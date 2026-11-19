import { NextRequest, NextResponse } from "next/server";
import { carouselTemplateManifest } from "@/lib/carousel-templates";
import { rejectNonJson } from "@/lib/json-body";
import { deleteLayoutPack, readStore, upsertLayoutPack } from "@/lib/store";
import { requireViewer } from "@/lib/viewer";
import type { CarouselSlide, UserLayoutPack } from "@/lib/types";

const ROLES = new Set<CarouselSlide["role"]>(["cover", "body", "cta"]);

function parsePack(input: unknown): UserLayoutPack | string {
  if (!input || typeof input !== "object") return "Missing layout pack";
  const body = input as Partial<UserLayoutPack>;
  const name = body.name?.trim();
  if (!name) return "Name the layout pack";
  if (body.platform !== "instagram" && body.platform !== "linkedin") {
    return "Choose Instagram or LinkedIn";
  }
  if (!Array.isArray(body.slideTemplateIds) || body.slideTemplateIds.length === 0) {
    return "A pack needs at least one slide style";
  }
  if (body.slideTemplateIds.length > 12) return "A pack can hold at most 12 slides";
  if (body.slideTemplateIds.some((id) => typeof id !== "string" || !id.trim())) {
    return "Each slide needs a graphics style id";
  }
  const slideRoles = Array.isArray(body.slideRoles)
    ? body.slideRoles.filter((role): role is CarouselSlide["role"] =>
        ROLES.has(role as CarouselSlide["role"])
      )
    : undefined;
  const id =
    typeof body.id === "string" && body.id.trim()
      ? body.id.trim()
      : crypto.randomUUID();
  return {
    id,
    name,
    platform: body.platform,
    slideTemplateIds: body.slideTemplateIds.map((id) => id.trim()),
    slideRoles: slideRoles?.length ? slideRoles : undefined,
    createdAt:
      typeof body.createdAt === "string" && body.createdAt
        ? body.createdAt
        : new Date().toISOString(),
    catalogVersion:
      typeof body.catalogVersion === "string" && body.catalogVersion.trim()
        ? body.catalogVersion.trim()
        : carouselTemplateManifest.version,
    basedOnPackId:
      typeof body.basedOnPackId === "string" && body.basedOnPackId.trim()
        ? body.basedOnPackId.trim()
        : undefined,
  };
}

export async function GET(req: NextRequest) {
  const viewer = await requireViewer(req);
  if (viewer) return viewer;
  const store = await readStore();
  return NextResponse.json({ packs: store.layoutPacks });
}

export async function POST(req: NextRequest) {
  const viewer = await requireViewer(req);
  if (viewer) return viewer;
  const rejected = rejectNonJson(req);
  if (rejected) return rejected;
  try {
    const body = (await req.json()) as { pack?: unknown };
    const parsed = parsePack(body.pack);
    if (typeof parsed === "string") {
      return NextResponse.json({ error: parsed }, { status: 400 });
    }
    const saved = await upsertLayoutPack(parsed);
    return NextResponse.json({ pack: saved });
  } catch (err) {
    console.error("Save layout pack error:", err);
    return NextResponse.json(
      { error: "Failed to save layout pack." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const viewer = await requireViewer(req);
  if (viewer) return viewer;
  const rejected = rejectNonJson(req);
  if (rejected) return rejected;
  try {
    const body = (await req.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "Missing pack id" }, { status: 400 });
    }
    await deleteLayoutPack(body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete layout pack error:", err);
    return NextResponse.json(
      { error: "Failed to delete layout pack." },
      { status: 500 }
    );
  }
}
