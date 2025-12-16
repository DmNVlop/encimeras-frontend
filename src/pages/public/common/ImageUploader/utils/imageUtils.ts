export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();

    // SENIOR FIX: Evita el error "Tainted Canvas" al usar imágenes externas (Cloud/S3)
    // Nota: Tu bucket/servidor de imágenes debe tener configuradas las cabeceras CORS.
    image.crossOrigin = "anonymous";

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  outputMimeType: string = "image/jpeg", // Default seguro, pero sobreescribible
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);

  return new Promise((resolve, reject) => {
    // SENIOR FIX: Usamos el mimeType dinámico, no hardcoded.
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      // Inyectamos una propiedad custom al blob si queremos trackear el origen,
      // pero lo estándar es confiar en blob.type
      resolve(blob);
    }, outputMimeType);
  });
}
