import { describe, expect, it } from "vitest";

import {
  decodeImageDataUrl,
  maxStoredImageBytes,
} from "@/lib/image-data-url";

describe("decodeImageDataUrl", () => {
  it("decodes an accepted image format", () => {
    const result = decodeImageDataUrl("data:image/png;base64,aGVsbG8=");

    expect(result.contentType).toBe("image/png");
    expect(result.extension).toBe("png");
    expect(result.body.toString()).toBe("hello");
  });

  it("rejects unsupported or malformed input", () => {
    expect(() =>
      decodeImageDataUrl("data:image/svg+xml;base64,PHN2Zz4="),
    ).toThrow("unsupported_image_data_url");
    expect(() =>
      decodeImageDataUrl("data:image/png;base64,not-valid"),
    ).toThrow("unsupported_image_data_url");
  });

  it("rejects payloads above the storage limit", () => {
    const payload = Buffer.alloc(maxStoredImageBytes + 1).toString("base64");

    expect(() =>
      decodeImageDataUrl(`data:image/webp;base64,${payload}`),
    ).toThrow("image_size_out_of_bounds");
  });
});
