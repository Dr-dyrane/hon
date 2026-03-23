import { NextResponse } from "next/server";
import { getCurrentCartContext } from "@/lib/cart/server-context";
import {
  getPortalProfile,
  listPortalAddresses,
} from "@/lib/db/repositories/account-repository";
import {
  getPortalOrderDetail,
  listOrdersForPortal,
} from "@/lib/db/repositories/orders-repository";
import { getTrackingCoords } from "@/lib/orders/detail-view";

type CheckoutDefaultsPayload = {
  fullName: string;
  email: string;
  phoneNumber: string;
  deliveryLocation: string;
  notes: string;
  latitude: string;
  longitude: string;
  hasSavedDetails: boolean;
  sourceLabel: string | null;
};

function compactAddress(parts: Array<string | null | undefined>) {
  return parts
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join(", ");
}

function buildAddressLabel(input: {
  line1?: string | null;
  line2?: string | null;
  landmark?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  formatted?: string | null;
}) {
  if (input.formatted?.trim()) {
    return input.formatted.trim();
  }

  return compactAddress([
    input.line1,
    input.line2,
    input.landmark,
    compactAddress([input.city, input.state, input.postalCode]),
  ]);
}

function fromSnapshot(
  snapshot: Record<string, unknown> | null | undefined
): Pick<CheckoutDefaultsPayload, "deliveryLocation" | "latitude" | "longitude"> {
  if (!snapshot) {
    return {
      deliveryLocation: "",
      latitude: "",
      longitude: "",
    };
  }

  const deliveryLocation = buildAddressLabel({
    formatted: typeof snapshot.formatted === "string" ? snapshot.formatted : null,
    line1: typeof snapshot.line1 === "string" ? snapshot.line1 : null,
    line2: typeof snapshot.line2 === "string" ? snapshot.line2 : null,
    landmark: typeof snapshot.landmark === "string" ? snapshot.landmark : null,
    city: typeof snapshot.city === "string" ? snapshot.city : null,
    state: typeof snapshot.state === "string" ? snapshot.state : null,
    postalCode: typeof snapshot.postalCode === "string" ? snapshot.postalCode : null,
  });
  const coords = getTrackingCoords(snapshot);

  return {
    deliveryLocation,
    latitude: coords ? String(coords.lat) : "",
    longitude: coords ? String(coords.lng) : "",
  };
}

export async function GET() {
  const context = await getCurrentCartContext();
  const email = context?.session?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ ok: true, data: null }, { status: 200 });
  }

  try {
    const [profile, addresses, orders] = await Promise.all([
      getPortalProfile(email),
      listPortalAddresses(email),
      listOrdersForPortal(email),
    ]);

    const primaryAddress = addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;

    let deliveryLocation = "";
    let latitude = "";
    let longitude = "";
    let notes = "";
    let sourceLabel: string | null = null;
    let fullName = profile.fullName?.trim() ?? "";
    let phoneNumber = profile.preferredPhoneE164?.trim() ?? "";

    if (primaryAddress) {
      deliveryLocation = buildAddressLabel({
        line1: primaryAddress.line1,
        line2: primaryAddress.line2,
        landmark: primaryAddress.landmark,
        city: primaryAddress.city,
        state: primaryAddress.state,
        postalCode: primaryAddress.postalCode,
      });
      latitude =
        typeof primaryAddress.latitude === "number" ? String(primaryAddress.latitude) : "";
      longitude =
        typeof primaryAddress.longitude === "number" ? String(primaryAddress.longitude) : "";
      notes = primaryAddress.deliveryNotes?.trim() ?? "";
      sourceLabel = primaryAddress.label || "Saved address";

      if (!fullName) {
        fullName = primaryAddress.recipientName?.trim() ?? "";
      }

      if (!phoneNumber) {
        phoneNumber = primaryAddress.phoneE164?.trim() ?? "";
      }
    } else if (orders[0]) {
      const latestOrder = await getPortalOrderDetail(email, orders[0].orderId);
      if (latestOrder) {
        const fromLatest = fromSnapshot(latestOrder.deliveryAddressSnapshot);
        deliveryLocation = fromLatest.deliveryLocation;
        latitude = fromLatest.latitude;
        longitude = fromLatest.longitude;
        notes = latestOrder.notes?.trim() ?? "";
        sourceLabel = "Last delivery";

        if (!fullName) {
          fullName = latestOrder.customerName?.trim() ?? "";
        }

        if (!phoneNumber) {
          phoneNumber = latestOrder.customerPhone?.trim() ?? "";
        }
      }
    }

    const payload: CheckoutDefaultsPayload = {
      fullName,
      email,
      phoneNumber,
      deliveryLocation,
      notes,
      latitude,
      longitude,
      hasSavedDetails: Boolean(fullName || phoneNumber || deliveryLocation),
      sourceLabel,
    };

    return NextResponse.json({ ok: true, data: payload }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load defaults.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
