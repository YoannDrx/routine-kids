import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 72% 18%, #4f2f8f 0%, #211845 38%, #0f0b24 76%)",
          color: "#fffaf2",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.5,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,.92) 0 2px, transparent 3px)",
            backgroundSize: "84px 84px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 110,
            right: 86,
            display: "flex",
            width: 330,
            height: 330,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            background:
              "linear-gradient(145deg, #f6c453 0%, #f97316 52%, #ce5e93 100%)",
            boxShadow: "0 34px 90px rgba(206,94,147,.42)",
            fontSize: 150,
          }}
        >
          🚀
        </div>
        <div
          style={{
            position: "absolute",
            right: 120,
            bottom: 104,
            display: "flex",
            gap: 18,
          }}
        >
          {["✓", "★", "☀"].map((symbol, index) => (
            <div
              key={symbol}
              style={{
                display: "flex",
                width: 96,
                height: 96,
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid rgba(255,255,255,.2)",
                borderRadius: 28,
                background:
                  index === 0
                    ? "#10b981"
                    : index === 1
                      ? "#ce5e93"
                      : "#f6c453",
                color: index === 2 ? "#2a1f52" : "white",
                fontSize: 48,
                fontWeight: 900,
                boxShadow: "0 18px 42px rgba(8,5,24,.26)",
              }}
            >
              {symbol}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            width: 580,
            height: "100%",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 0 0 82px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              padding: "12px 22px",
              border: "2px solid rgba(255,255,255,.18)",
              borderRadius: 999,
              background: "rgba(255,255,255,.09)",
              color: "#f6c453",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Family Premium
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 34,
              flexDirection: "column",
              fontSize: 82,
              fontWeight: 900,
              letterSpacing: -4,
              lineHeight: 0.96,
            }}
          >
            <span>Routine</span>
            <span style={{ color: "#f6c453" }}>Kids</span>
          </div>
          <div
            style={{
              display: "flex",
              width: 460,
              marginTop: 34,
              color: "#ddd5ef",
              fontSize: 30,
              lineHeight: 1.35,
            }}
          >
            Des routines positives, claires et motivantes pour toute la famille.
          </div>
        </div>
      </div>
    ),
    {
      width: 1024,
      height: 1024,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    },
  );
}
