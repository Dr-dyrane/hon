import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getAdminCatalogIngredientDetail } from "@/lib/db/repositories/catalog-admin-repository";
import { createPresignedUploadUrl, getStorageBucket } from "@/lib/storage/s3";

function buildSafeFileName(name: string) {
  const trimmed = name.trim() || "asset";
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session || session.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Admin session required." },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    ingredientId?: string | null;
    fileName?: string;
    contentType?: string;
  };

  const ingredientId = body.ingredientId?.trim() || null;
  const fileName = body.fileName?.trim();
  const contentType = body.contentType?.trim() || "application/octet-stream";

  if (!fileName) {
    return NextResponse.json(
      { ok: false, error: "Missing upload reference." },
      { status: 400 }
    );
  }

  if (ingredientId) {
    const ingredient = await getAdminCatalogIngredientDetail(ingredientId);

    if (!ingredient) {
      return NextResponse.json(
        { ok: false, error: "Ingredient not found." },
        { status: 404 }
      );
    }
  }

  const storageBucket = getStorageBucket();

  if (!storageBucket) {
    return NextResponse.json(
      { ok: false, error: "Storage bucket is not configured." },
      { status: 503 }
    );
  }

  const safeName = buildSafeFileName(fileName);
  const ingredientScope = ingredientId
    ? `ingredients/${ingredientId}`
    : "ingredients/pending";
  const key = `${storageBucket.prefix}/catalog/${ingredientScope}/image/${Date.now()}-${randomBytes(3).toString("hex")}-${safeName}`;
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
