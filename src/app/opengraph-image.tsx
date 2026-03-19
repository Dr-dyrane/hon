/* eslint-disable @next/next/no-img-element */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "House of Prax - Clean plant fuel for real training";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

async function loadImageData(relativePath: string) {
  const absolutePath = join(process.cwd(), "public", relativePath);
  const file = await readFile(absolutePath);
  return `data:image/png;base64,${file.toString("base64")}`;
}

export default async function OpenGraphImage() {
  const [
    proteinImage,
    glowImage,
    immunityImage,
    metabolismImage,
  ] = await Promise.all([
    loadImageData(join("images", "products", "protein_chocolate.png")),
    loadImageData(join("images", "products", "shot_glow.png")),
    loadImageData(join("images", "products", "shot_immunity.png")),
    loadImageData(join("images", "products", "shot_metabolism.png")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #f7f2e6 0%, #f4f2ea 48%, #efe7d7 100%)",
          color: "#112317",
          fontFamily:
            'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "radial-gradient(circle at 12% 18%, rgba(215, 197, 163, 0.48), transparent 28%), radial-gradient(circle at 82% 22%, rgba(15, 61, 46, 0.10), transparent 24%), radial-gradient(circle at 86% 86%, rgba(215, 197, 163, 0.38), transparent 28%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 56,
            right: 56,
            top: 84,
            bottom: 84,
            display: "flex",
            borderTop: "1px solid rgba(17, 35, 23, 0.14)",
            borderBottom: "1px solid rgba(17, 35, 23, 0.10)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 640,
            top: 84,
            bottom: 84,
            width: 1,
            display: "flex",
            background: "rgba(17, 35, 23, 0.08)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "100%",
            display: "flex",
            padding: "56px",
            gap: "44px",
          }}
        >
          <div
            style={{
              width: "52%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: 20,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  color: "#224332",
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    display: "flex",
                    borderRadius: 999,
                    background: "#2b5b43",
                  }}
                />
                House of Prax
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  maxWidth: 520,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 74,
                    lineHeight: 1.02,
                    letterSpacing: "-0.05em",
                    fontWeight: 700,
                    color: "#132619",
                  }}
                >
                  Choose Your Fuel.
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 28,
                    lineHeight: 1.25,
                    letterSpacing: "-0.03em",
                    fontWeight: 500,
                    color: "rgba(17, 35, 23, 0.76)",
                  }}
                >
                  Plant-based protein and wellness shots designed for real training,
                  clean digestion, and daily consistency.
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  flexWrap: "wrap",
                }}
              >
                {["Clean ingredients", "Plant based", "Easy digestion"].map(
                  (item) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "14px 18px",
                        borderRadius: 999,
                        background: "rgba(17, 35, 23, 0.06)",
                        border: "1px solid rgba(17, 35, 23, 0.06)",
                        fontSize: 22,
                        fontWeight: 500,
                        letterSpacing: "-0.02em",
                        color: "#1f3b2c",
                      }}
                    >
                      {item}
                    </div>
                  )
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  lineHeight: 1.3,
                  letterSpacing: "-0.02em",
                  color: "rgba(17, 35, 23, 0.68)",
                }}
              >
                Premium plant protein and health shots for the uncompromising
                athlete.
              </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "28px",
                borderRadius: 42,
                background:
                  "linear-gradient(180deg, rgba(12, 16, 13, 0.98) 0%, rgba(15, 21, 17, 0.96) 100%)",
                boxShadow:
                  "0 34px 90px rgba(12, 16, 13, 0.24), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    padding: "10px 16px",
                    borderRadius: 999,
                    background: "rgba(244, 242, 234, 0.08)",
                    color: "#d7c5a3",
                    fontSize: 18,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Products
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 18,
                    fontWeight: 500,
                    color: "rgba(244, 242, 234, 0.56)",
                  }}
                >
                  houseofprax.shop
                </div>
              </div>

              <div
                style={{
                  position: "relative",
                  width: "100%",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: 320,
                    height: 320,
                    display: "flex",
                    borderRadius: 999,
                    background:
                      "radial-gradient(circle, rgba(186, 223, 134, 0.48) 0%, rgba(186, 223, 134, 0.12) 42%, rgba(186, 223, 134, 0) 74%)",
                    filter: "blur(14px)",
                  }}
                />
                <img
                  src={proteinImage}
                  alt=""
                  width={360}
                  height={360}
                  style={{
                    objectFit: "contain",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "stretch",
                }}
              >
                {[
                  { label: "Glow", image: glowImage },
                  { label: "Immunity", image: immunityImage },
                  { label: "Metabolism", image: metabolismImage },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 14px",
                      borderRadius: 22,
                      background: "rgba(244, 242, 234, 0.06)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                    }}
                  >
                    <img
                      src={item.image}
                      alt=""
                      width={50}
                      height={50}
                      style={{
                        objectFit: "contain",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#f4f2ea",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          fontSize: 14,
                          fontWeight: 500,
                          color: "rgba(244, 242, 234, 0.56)",
                        }}
                      >
                        Health shot
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
