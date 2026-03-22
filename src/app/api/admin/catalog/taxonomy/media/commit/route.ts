import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getAdminCatalogIngredientDetail } from "@/lib/db/repositories/catalog-admin-repository";

function isLikelyStorageUrl(value: string) {
  return /^https?:\/\//i.test(value);
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
    storageKey?: string;
    publicUrl?: string;
    fileName?: string | null;
    contentType?: string | null;
  };

  const ingredientId = body.ingredientId?.trim() || null;
  const storageKey = body.storageKey?.trim() || "";
  const publicUrl = body.publicUrl?.trim() || "";

  if (!storageKey || !publicUrl) {
    return NextResponse.json(
      { ok: false, error: "Missing media reference." },
      { status: 400 }
    );
  }

  if (!isLikelyStorageUrl(publicUrl)) {
    return NextResponse.json(
      { ok: false, error: "Invalid public URL." },
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

  return NextResponse.json({
    ok: true,
    data: {
      storageKey,
      publicUrl,
      fileName: body.fileName?.trim() || null,
      contentType: body.contentType?.trim() || null,
    },
  });
}
