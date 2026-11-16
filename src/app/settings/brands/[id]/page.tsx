import { Suspense } from "react";
import { BrandEditor } from "./brand-editor";

function BrandEditorFallback() {
  return (
    <p className="mx-auto max-w-4xl px-4 py-6 text-sm text-muted-foreground">
      Loading brand…
    </p>
  );
}

async function BrandEditorGate({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BrandEditor brandId={id} />;
}

export default function BrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<BrandEditorFallback />}>
      <BrandEditorGate params={params} />
    </Suspense>
  );
}
