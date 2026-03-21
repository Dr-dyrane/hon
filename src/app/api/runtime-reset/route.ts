import { NextResponse } from "next/server";
import { AUTH_CHALLENGE_COOKIE_NAME } from "@/lib/auth/constants";
import { CART_COOKIE_NAME } from "@/lib/cart/session";
import { getRuntimeVersion } from "@/lib/runtime/version";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json(
    {
      ok: true,
      version: getRuntimeVersion(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      },
    }
  );

  response.cookies.set(CART_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(AUTH_CHALLENGE_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}
