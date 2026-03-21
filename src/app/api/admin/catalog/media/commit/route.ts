import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import {
  createAdminCatalogProductMedia,
  getAdminCatalogProductDetail,
} from "@/lib/db/repositories/catalog-admin-repository";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";

function normalizeMediaType(value: string | undefined) {
  if (value === "image" || value === "model_3d" || value === "video") {
    return value;
  }

  return null;
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Admin session required." }, { status: 403 });
  }

  const body = (await request.json()) as {
    productId?: string;
    variantId?: string | null;
    mediaType?: string;
    storageKey?: string;
    altText?: string | null;
    fileName?: string | null;
    contentType?: string | null;
    publicUrl?: string | null;
  };

  const productId = body.productId?.trim();
  const variantId = body.variantId?.trim() || null;
  const mediaType = normalizeMediaType(body.mediaType);
  const storageKey = body.storageKey?.trim();

  if (!productId || !mediaType || !storageKey) {
    return NextResponse.json({ ok: false, error: "Missing media reference." }, { status: 400 });
  }

  const product = await getAdminCatalogProductDetail(productId);

  if (!product) {
    return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
  }

  if (variantId && variantId !== product.variantId) {
    return NextResponse.json({ ok: false, error: "Variant is not valid." }, { status: 400 });
  }

  const actor = await ensureUserByEmail(session.email);

  await createAdminCatalogProductMedia({
    productId,
    variantId,
    mediaType,
    storageKey,
    altText: body.altText?.trim() || null,
    metadata: {
      fileName: body.fileName?.trim() || null,
      contentType: body.contentType?.trim() || null,
      publicUrl: body.publicUrl?.trim() || null,
    },
    actorUserId: actor?.userId ?? null,
    actorEmail: session.email,
  });

  return NextResponse.json({ ok: true });
}
