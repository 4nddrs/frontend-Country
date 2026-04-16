import { supabase } from '../supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_APP_SUPABASE_URL;

// Tipos de buckets disponibles
type BucketType = 'horse-photos' | 'employee-photos' | 'owner-photos';

/**
 * Genera la URL pública de una imagen en Supabase Storage
 * @param bucketName - Nombre del bucket (horse-photos, employee-photos, owner-photos)
 * @param filePath - Ruta del archivo dentro del bucket (ej: "98/uuid.png")
 * @returns URL pública completa
 */
export function getSupabaseImageUrl(bucketName: BucketType, filePath: string | null): string | null {
  if (!filePath) return null;

  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
    return filePath;
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`;
}

/**
 * Genera la URL pública de una imagen de caballo
 */
export function getHorseImageUrl(filePath: string | null): string | null {
  return getSupabaseImageUrl('horse-photos', filePath);
}

/**
 * Genera la URL pública de una imagen de empleado
 */
export function getEmployeeImageUrl(filePath: string | null): string | null {
  return getSupabaseImageUrl('employee-photos', filePath);
}

/**
 * Genera la URL pública de una imagen de propietario
 */
export function getOwnerImageUrl(filePath: string | null): string | null {
  return getSupabaseImageUrl('owner-photos', filePath);
}

/**
 * Sube una imagen a Supabase Storage
 * @param file - Archivo a subir
 * @param bucketName - Nombre del bucket
 * @param folderPath - Ruta dentro del bucket (opcional)
 * @returns Ruta relativa del archivo en el bucket (ej: "98/uuid.png")
 */
export async function uploadImageToSupabase(
  file: File,
  bucketName: BucketType,
  folderPath?: string
): Promise<string> {
  try {
    // Generar UUID único para el archivo
    const uuid = crypto.randomUUID();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuid}.${fileExtension}`;

    // Ruta completa: folderPath/fileName o directamente fileName
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    // Subir archivo a Supabase
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Error subiendo imagen: ${error.message}`);
    }

    if (!data) {
      throw new Error('No se pudo subir la imagen');
    }

    // Retornar la ruta relativa
    return data.path;
  } catch (error) {
    console.error('Error en uploadImageToSupabase:', error);
    throw error;
  }
}

/**
 * Elimina una imagen de Supabase Storage
 * @param filePath - Ruta relativa del archivo
 * @param bucketName - Nombre del bucket
 */
export async function deleteImageFromSupabase(
  filePath: string | null,
  bucketName: BucketType
): Promise<void> {
  if (!filePath) return;

  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.warn(`Error eliminando imagen: ${error.message}`);
    }
  } catch (error) {
    console.error('Error en deleteImageFromSupabase:', error);
  }
}

/**
 * Convierte un File a base64 para vista previa local
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Obtiene una URL de descarga temporal para una imagen de Supabase
 * @param filePath - Ruta relativa del archivo
 * @param bucketName - Nombre del bucket
 * @param expiresIn - Segundos hasta que expire el link (3600 = 1 hora por defecto)
 */
export async function getSupabaseDownloadUrl(
  filePath: string,
  bucketName: BucketType,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.warn(`Error obteniendo URL de descarga: ${error.message}`);
      return null;
    }

    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error en getSupabaseDownloadUrl:', error);
    return null;
  }
}
