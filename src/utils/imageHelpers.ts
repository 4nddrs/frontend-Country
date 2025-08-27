export function decodeBackendImage(photoData: string | any): string {
  const placeholder = 'https://placehold.co/200x150/4a5568/ffffff?text=Sin+Foto';

  if (!photoData) return placeholder;

  try {
    // Caso 1: Hexadecimal (con prefijo \x en todo el string)
    if (typeof photoData === "string" && photoData.startsWith("\\x")) {
      const hex = photoData.replace(/\\x/g, '');
      let binary = "";
      for (let i = 0; i < hex.length; i += 2) {
        binary += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      // 📌 Aquí chequeamos si ya es un dataURL
      if (binary.startsWith("data:image")) {
        return binary; // ya es un dataURL válido
      }
      const base64 = btoa(binary);
      return `data:image/png;base64,${base64}`;
    }

    // Caso 2: Ya es un dataURL válido
    if (typeof photoData === "string" && photoData.startsWith("data:image")) {
      return photoData;
    }

    // Caso 3: Base64 puro sin prefijo
    if (typeof photoData === "string" && /^[A-Za-z0-9+/=]+$/.test(photoData)) {
      return `data:image/png;base64,${photoData}`;
    }

    // Caso 4: Buffer
    if (typeof photoData === "object" && photoData?.type === "Buffer" && Array.isArray(photoData.data)) {
      const uint8Array = new Uint8Array(photoData.data);
      let binary = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      return `data:image/png;base64,${btoa(binary)}`;
    }
  } catch (err) {
    console.error("❌ Error al decodificar imagen:", err);
  }

  return placeholder;
}
