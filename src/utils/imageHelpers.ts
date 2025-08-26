// Convierte lo que devuelve el backend (hex, base64, dataURL, Buffer) en un dataURL válido
export function decodeBackendImage(photoData: string | any): string | undefined {
  if (!photoData) return undefined;

  try {
    // 📌 Caso 1: Hexadecimal (con prefijo \x)
    if (typeof photoData === "string" && photoData.startsWith("\\x")) {
      const hex = photoData.slice(2);
      let result = "";
      for (let i = 0; i < hex.length; i += 2) {
        result += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      return result.startsWith("data:image")
        ? result
        : `data:image/jpeg;base64,${btoa(result)}`;
    }

    // 📌 Caso 2: Ya es un dataURL válido
    if (typeof photoData === "string" && photoData.startsWith("data:image")) {
      return photoData;
    }

    // 📌 Caso 3: Base64 puro sin prefijo
    if (typeof photoData === "string" && /^[A-Za-z0-9+/=]+$/.test(photoData)) {
      return `data:image/jpeg;base64,${photoData}`;
    }

    // 📌 Caso 4: Buffer (Node.js / Supabase en ciertos casos)
    if (typeof photoData === "object" && photoData?.type === "Buffer" && Array.isArray(photoData.data)) {
      const uint8Array = new Uint8Array(photoData.data);
      let binary = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      return `data:image/jpeg;base64,${btoa(binary)}`;
    }
  } catch (err) {
    console.error("❌ Error al decodificar imagen:", err);
  }

  return undefined;
}
