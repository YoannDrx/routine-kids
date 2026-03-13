import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
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
            "radial-gradient(circle at top, #281657 0%, #120d2b 62%, #090513 100%)",
          color: "white",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        RK
      </div>
    ),
    size,
  );
}
