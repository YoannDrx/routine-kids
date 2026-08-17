import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top, #ff6fb5 0%, #3f1f77 42%, #120d2b 100%)",
          color: "white",
          fontSize: 72,
          fontWeight: 700,
          borderRadius: 36,
        }}
      >
        RK
      </div>
    ),
    size,
  );
}
