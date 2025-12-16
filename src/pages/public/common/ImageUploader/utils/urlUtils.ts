export const resolveImageUrl = (path: string, prefix?: string): string => {
  if (!path) return "";

  // 1. Detección de URL absoluta (HTTP/HTTPS)
  // Si el backend devuelve "https://s3.amazonaws.com/...", retornamos directo.
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // 2. Si no hay prefijo configurado, devolvemos el path relativo (fallback)
  if (!prefix) {
    return path;
  }

  // 3. Normalización: Quitamos slash final del prefix y slash inicial del path
  // Evita "http://domain.com//uploads"
  const cleanPrefix = prefix.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");

  return `${cleanPrefix}/${cleanPath}`;
};
