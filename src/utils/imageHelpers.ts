// Convierte la cadena hexadecimal (con prefijo \x) a texto base64 normal
export function decodeBackendImage(hexString: string | null | undefined): string | undefined {
  if (!hexString) return undefined;
  // Elimina el prefijo \x si existe
  if (hexString.startsWith('\\x')) hexString = hexString.slice(2);
  // Convierte hexadecimal a string normal
  let result = '';
  for (let i = 0; i < hexString.length; i += 2) {
    result += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
  }
  return result;
}

// NUEVA FUNCIÓN: Convierte un archivo de imagen a una cadena Base64
export function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file); // esto incluye el prefijo 'data:image/...'
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}