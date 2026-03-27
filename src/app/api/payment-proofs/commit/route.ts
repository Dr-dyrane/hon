import { NextResponse } from "next/server";
import {
  createPaymentProof,
  submitPaymentForReview,
} from "@/lib/db/repositories/orders-repository";
import { sendPaymentProofSubmittedNotifications } from "@/lib/email/orders";
import { buildCustomerOrderLink } from "@/lib/orders/customer-links";
import { resolveOrderProofAccess } from "@/lib/orders/proof-access";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
      paymentId?: string;
      accessToken?: string;
      storageKey?: string;
      publicUrl?: string | null;
      mimeType?: string;
      note?: string | null;
    };

    const orderId = body.orderId?.trim();
    const paymentId = body.paymentId?.trim();
    const storageKey = body.storageKey?.trim();
    const mimeType = body.mimeType?.trim() || "application/octet-stream";
    const note = body.note?.trim() ? body.note.trim().slice(0, 500) : null;

    if (!orderId || !paymentId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing payment reference.",
        },
        { status: 400 }
      );
    }

    const access = await resolveOrderProofAccess({
      orderId,
      accessToken: body.accessToken,
    });

    if (!access || access.order.paymentId !== paymentId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Order access is not valid.",
        },
        { status: 403 }
      );
    }

    if (storageKey) {
      await createPaymentProof(
        paymentId,
        storageKey,
        body.publicUrl?.trim() || null,
        mimeType,
        access.mode === "session" ? access.sessionEmail : access.order.customerEmail,
        note,
        access.mode === "guest" ? { guestOrderId: orderId } : undefined
      );
    } else {
      await submitPaymentForReview(
        paymentId,
        access.mode === "session" ? access.sessionEmail : access.order.customerEmail,
        note,
        access.mode === "guest" ? { guestOrderId: orderId } : undefined
      );
    }

    await sendPaymentProofSubmittedNotifications({
      orderId,
      proofIncluded: Boolean(storageKey),
      customerLink:
        access.mode === "guest" && body.accessToken?.trim()
          ? buildCustomerOrderLink({
              orderId,
              scope: "guest",
              accessToken: body.accessToken.trim(),
            })
          : access.mode === "session"
            ? buildCustomerOrderLink({
                orderId,
                scope: "account",
              })
            : null,
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          paymentId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Try again.",
      },
      { status: 500 }
    );
  }
}
