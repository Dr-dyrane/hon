export function buildReorderSuccessMessage({
  unavailableCount,
  changedPriceCount,
}: {
  unavailableCount: number;
  changedPriceCount: number;
}) {
  const parts = ["Cart updated."];

  if (unavailableCount > 0) {
    parts.push(`${unavailableCount} skipped.`);
  }

  if (changedPriceCount > 0) {
    parts.push(`${changedPriceCount} repriced.`);
  }

  return parts.join(" ");
}

export const REORDER_EMPTY_MESSAGE = "No items available now.";
export const REORDER_ERROR_MESSAGE = "Unable to reorder.";
