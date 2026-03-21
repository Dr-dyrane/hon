import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getAdminCatalogProductDetail } from "@/lib/db/repositories/catalog-admin-repository";
import { createPresignedUploadUrl, getStorageBucket } from "@/lib/storage/s3";

function buildSafeFileName(name: string) {
  const trimmed = name.trim() || "asset";
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
}

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
    mediaType?: string;
    fileName?: string;
    contentType?: string;
  };

  const productId = body.productId?.trim();
  const mediaType = normalizeMediaType(body.mediaType);
  const fileName = body.fileName?.trim();
  const contentType = body.contentType?.trim() || "application/octet-stream";

  if (!productId || !mediaType || !fileName) {
    return NextResponse.json({ ok: false, error: "Missing upload reference." }, { status: 400 });
  }

  const product = await getAdminCatalogProductDetail(productId);

  if (!product) {
    return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
  }

  const storageBucket = getStorageBucket();

  if (!storageBucket) {
    return NextResponse.json(
      { ok: false, error: "Storage bucket is not configured." },
      { status: 503 }
    );
  }

  const safeName = buildSafeFileName(fileName);
  const key = `${storageBucket.prefix}/catalog/products/${productId}/${mediaType}/${Date.now()}-${randomBytes(3).toString("hex")}-${safeName}`;
  const signed = await createPresignedUploadUrl({
    key,
    contentType,
  });

  return NextResponse.json({
    ok: true,
    data: {
      uploadUrl: signed.uploadUrl,
      storageKey: key,
      publicUrl: signed.publicUrl,
      contentType,
    },
  });
}
