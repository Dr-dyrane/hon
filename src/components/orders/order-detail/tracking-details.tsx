import { MapPinned, RotateCcw } from "lucide-react";
import { formatNgn } from "@/lib/commerce";
import type {
  OrderReturnCaseItemRow,
  OrderStatusEventRow,
} from "@/lib/db/types";
import { formatOrderTimestamp } from "@/lib/orders/detail-view";
import { cn } from "@/lib/utils";
import { AnimatedReveal, FocusPanel } from "./primitives";
import { buildTrackingJourney, TrackingStepRow } from "./tracking";
import styles from "./order-detail.module.css";

export function OrderSecondaryDetails({
  timeline,
  mapSrc,
  returnItems,
  isFocused,
  dimmed,
  onToggle,
  renderMode = "inline",
}: {
  timeline: OrderStatusEventRow[];
  mapSrc: string | null;
  returnItems: OrderReturnCaseItemRow[];
  isFocused: boolean;
  dimmed: boolean;
  onToggle: () => void;
  renderMode?: "inline" | "sheet";
}) {
  const tracking = buildTrackingJourney(timeline);
  const hasMapPanel = Boolean(mapSrc);
  const hasReturnPanel = returnItems.length > 0;
  const hasSidePanel = hasMapPanel || hasReturnPanel;
  const inSheet = renderMode === "sheet";

  const trackingLayout = (
    <div
      className={cn(
        styles.trackingLayout,
        hasSidePanel && styles.trackingLayoutWithSide
      )}
    >
      {inSheet ? (
        <div className={cn(styles.sheetDetailsCard, styles.timelinePanel)}>
          <div className={styles.trackingPanelEyebrow}>Order journey</div>
          <div
            className={cn(
              styles.trackingStepList,
              !hasSidePanel && styles.trackingStepListZigZag
            )}
          >
            {tracking.steps.map((step, index) => (
              <TrackingStepRow
                key={step.key}
                step={step}
                isLast={index === tracking.steps.length - 1}
              />
            ))}
          </div>
        </div>
      ) : (
        <FocusPanel title="Order journey" variant="muted" className={styles.timelinePanel}>
          <div
            className={cn(
              styles.trackingStepList,
              !hasSidePanel && styles.trackingStepListZigZag
            )}
          >
            {tracking.steps.map((step, index) => (
              <TrackingStepRow
                key={step.key}
                step={step}
                isLast={index === tracking.steps.length - 1}
              />
            ))}
          </div>
        </FocusPanel>
      )}

      {mapSrc ? (
        inSheet ? (
          <div className={cn(styles.sheetDetailsCard, styles.trackingMapPanel)}>
            <div className={styles.trackingPanelEyebrow}>
              <MapPinned size={14} strokeWidth={1.8} />
              <span>Location snapshot</span>
            </div>
            <div className={styles.mapFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mapSrc}
                alt="Delivery location"
                className={styles.mapImage}
                loading="lazy"
              />
            </div>
          </div>
        ) : (
          <FocusPanel title="Map" variant="muted" className={styles.trackingMapPanel}>
            <div className={styles.trackingPanelEyebrow}>
              <MapPinned size={14} strokeWidth={1.8} />
              <span>Location snapshot</span>
            </div>
            <div className={styles.mapFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mapSrc}
                alt="Delivery location"
                className={styles.mapImage}
                loading="lazy"
              />
            </div>
          </FocusPanel>
        )
      ) : null}

      {hasReturnPanel ? (
        inSheet ? (
          <div className={cn(styles.sheetDetailsCard, styles.trackingSecondaryPanel)}>
            <div className={styles.trackingPanelEyebrow}>Return activity</div>
            <div className={styles.timelineList}>
              {returnItems.map((item) => (
                <div key={item.returnItemId} className={styles.returnActivityItem}>
                  <div className={styles.returnActivityIcon}>
                    <RotateCcw size={14} strokeWidth={1.8} />
                  </div>
                  <div className={styles.timelineStatusGroup}>
                    <div className={styles.timelineStatus}>{item.title}</div>
                    <div className={styles.timelineSubtext}>
                      {item.quantity} x {formatNgn(item.unitPriceNgn)}
                    </div>
                  </div>
                  <span className={styles.timelineAmount}>{formatNgn(item.lineTotalNgn)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <FocusPanel
            title="Return activity"
            variant="muted"
            className={styles.trackingSecondaryPanel}
          >
            <div className={styles.timelineList}>
              {returnItems.map((item) => (
                <div key={item.returnItemId} className={styles.returnActivityItem}>
                  <div className={styles.returnActivityIcon}>
                    <RotateCcw size={14} strokeWidth={1.8} />
                  </div>
                  <div className={styles.timelineStatusGroup}>
                    <div className={styles.timelineStatus}>{item.title}</div>
                    <div className={styles.timelineSubtext}>
                      {item.quantity} x {formatNgn(item.unitPriceNgn)}
                    </div>
                  </div>
                  <span className={styles.timelineAmount}>{formatNgn(item.lineTotalNgn)}</span>
                </div>
              ))}
            </div>
          </FocusPanel>
        )
      ) : null}
    </div>
  );

  if (inSheet) {
    return (
      <section className={styles.sheetDetailsShell}>
        <div className={styles.sheetDetailsSummary}>
          <p className={styles.detailsTitle}>{tracking.currentTitle}</p>
          <p className={styles.detailsDescription}>
            {tracking.currentTime ? formatOrderTimestamp(tracking.currentTime) : "No updates yet."}
          </p>
        </div>
        {trackingLayout}
      </section>
    );
  }

  return (
    <section
      className={cn(
        styles.detailsShell,
        isFocused && styles.detailsShellOpen,
        dimmed && styles.dimmed
      )}
      >
        <div className={styles.detailsHeader}>
          <div>
            <div className={styles.sectionEyebrow}>Tracking</div>
            <h2 className={styles.detailsTitle}>{tracking.currentTitle}</h2>
          <p className={styles.detailsDescription}>
            {tracking.currentTime
              ? formatOrderTimestamp(tracking.currentTime)
              : "No updates yet."}
          </p>
        </div>

        <button
          type="button"
          className={styles.inlineButton}
          onClick={onToggle}
          aria-expanded={isFocused}
        >
          {isFocused ? "Close" : "Open"}
        </button>
      </div>

      <AnimatedReveal show={isFocused} panelKey="details-panel">
        {trackingLayout}
      </AnimatedReveal>
    </section>
  );
}
