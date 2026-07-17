const supportedDataUrl = /^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+/]+={0,2})$/;

export const maxStoredImageBytes = 1_200_000;

const extensionByType = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export function decodeImageDataUrl(dataUrl: string) {
  const match = supportedDataUrl.exec(dataUrl);
  if (!match) throw new Error("unsupported_image_data_url");

  const contentType = match[1] as keyof typeof extensionByType;
  const encoded = match[2];
  if (!encoded || encoded.length % 4 !== 0) {
    throw new Error("unsupported_image_data_url");
  }

  const body = Buffer.from(encoded, "base64");
  if (
    body.byteLength === 0 ||
    body.byteLength > maxStoredImageBytes ||
    body.toString("base64") !== encoded
  ) {
    throw new Error("image_size_out_of_bounds");
  }

  return {
    body,
    contentType,
    extension: extensionByType[contentType],
  };
}
