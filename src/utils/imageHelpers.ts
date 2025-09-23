export function decodeBackendImage(photoData: string | any): string {
  const placeholder = 'https://placehold.co/200x150/4a5568/ffffff?text=Sin+Foto';

  if (!photoData) return placeholder;

  try {

       if (typeof photoData === 'string') {
    if (photoData.startsWith('data:image')) return photoData;
    if (/^[A-Za-z0-9+/=]+$/.test(photoData)) return `data:image/png;base64,${photoData}`;
  }
  
    // Caso 1: Hexadecimal (con prefijo \x en todo el string)
    if (typeof photoData === "string" && photoData.startsWith("\\x")) {
      const hex = photoData.replace(/\\x/g, '');
      let binary = "";
      for (let i = 0; i < hex.length; i += 2) {
        binary += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }

      if (binary.startsWith("data:image")) {
        return binary; 
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

export function encodeImageForBackend(dataUrl: string): string {
  try {
    if (!dataUrl.startsWith("data:image")) {
      console.warn("⚠️ El string no parece ser un dataURL válido.");
      return dataUrl;
    }

    const base64Data = dataUrl.split(',')[1]; 
    const hex = base64ToHex(base64Data);
    return `\\x${hex}`;
  } catch (err) {
    console.error("❌ Error al codificar imagen para el backend:", err);
    return '';
  }
}


function base64ToHex(base64: string): string {
  const binary = atob(base64);
  let hex = '';
  for (let i = 0; i < binary.length; i++) {
    const byte = binary.charCodeAt(i).toString(16).padStart(2, '0');
    hex += byte;
  }
  return hex;
}
