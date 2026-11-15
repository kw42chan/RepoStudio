import { NextRequest } from "next/server";
import { requireIdentity } from "../../cursor/identity";

export async function requireViewer(req: NextRequest): Promise<Response | null> {
  const identity = await requireIdentity(req);
  if (identity instanceof Response) return identity;
  return null;
}
