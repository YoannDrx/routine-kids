import { ImageResponse } from "next/og";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 112,
          background:
            "radial-gradient(circle at 35% 25%, #ff8fc9 0%, #5b2c91 38%, #120d2b 76%)",
          color: "white",
          fontSize: 190,
          fontWeight: 800,
          letterSpacing: -18,
        }}
      >
        RK
      </div>
    ),
    {
      width: 512,
      height: 512,
      headers: {
        "Cache-Control": "public, max-age=86400, immutable",
      },
    },
  );
}
