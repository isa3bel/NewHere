import { ImageResponse } from "next/og";

// Dynamically generated Open Graph / link-preview image for the root.
// Rendered with Satori, which requires explicit `display: flex` on any
// div that has more than one child — that's why every wrapper here
// spells it out.

export const alt =
  "NewHere — Your personalized 7/30/90-day plan for a new city";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #f5f1e8 0%, #ede5d3 50%, #e0d4ba 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px 96px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: brand mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 36,
            color: "#3d3527",
          }}
        >
          <span style={{ fontSize: 64 }}>🌿</span>
          <span style={{ fontWeight: 700, letterSpacing: -0.5 }}>NewHere</span>
        </div>

        {/* Middle: main headline (two lines, each its own flex child) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 88,
              fontWeight: 700,
              color: "#1a1208",
              lineHeight: 1.05,
              letterSpacing: -2.5,
            }}
          >
            <span>Your first 90 days,</span>
            <span>in any new city.</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 36,
              color: "#5a4d3a",
              lineHeight: 1.3,
              letterSpacing: -0.5,
              maxWidth: 900,
            }}
          >
            A personalized plan to find your community, anchor your routine, and feel at home.
          </div>
        </div>

        {/* Bottom: phase row */}
        <div
          style={{
            display: "flex",
            gap: 32,
            fontSize: 28,
            color: "#5a4d3a",
          }}
        >
          <PhaseTag label="Week 1" sub="Land & settle" />
          <PhaseTag label="Month 1" sub="Try things" />
          <PhaseTag label="Quarter 1" sub="Your routine" />
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

function PhaseTag({ label, sub }: { label: string; sub: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "16px 28px",
        background: "rgba(255, 255, 255, 0.5)",
        borderRadius: 999,
        border: "2px solid rgba(58, 42, 26, 0.15)",
      }}
    >
      <span
        style={{
          fontSize: 18,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 2,
          color: "#3d3527",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 26, color: "#1a1208", fontWeight: 600 }}>
        {sub}
      </span>
    </div>
  );
}
