import { v2 as cloudinary } from 'cloudinary';

// Verifica se siamo in ambiente di produzione
const isProduction = process.env.NODE_ENV === 'production';

// In produzione, richiedi le variabili d'ambiente
if (isProduction && (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)) {
  throw new Error('Mancano le variabili di ambiente di Cloudinary in produzione');
}

// Configura Cloudinary solo se le variabili sono disponibili
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

/**
 * Carica un'immagine su Cloudinary
 * @param fileBuffer Buffer dell'immagine da caricare
 * @param fileName Nome del file (opzionale)
 * @returns Promessa con i dettagli del file caricato
 */
export async function uploadImageToCloudinary(fileBuffer: Buffer, fileName?: string): Promise<CloudinaryUploadResult> {
  // Verifica se Cloudinary è configurato
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary non configurato. Restituisco un URL di esempio.');
    return {
      publicId: `local-${Date.now()}`,
      url: 'https://placehold.co/800x600?text=Immagine+Esempio',
      format: 'jpg',
      resourceType: 'image',
      bytes: fileBuffer.length,
      created: new Date()
    };
  }

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'image' as 'image',
      folder: 'exit-wounds/comics',
      use_filename: !!fileName,
      unique_filename: true,
      overwrite: false,
      transformation: [
        { quality: 'auto:good' }, // Ottimizzazione automatica
        { fetch_format: 'auto' } // Formato ottimale per il browser
      ]
    };

    // Utilizziamo uploader.upload_stream che è più efficiente per i buffer
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Nessun risultato dall\'upload'));
        
        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          resourceType: result.resource_type,
          bytes: result.bytes,
          created: new Date(result.created_at)
        });
      }
    );
    
    // Prendiamo il buffer e lo inviamo allo stream di upload
    uploadStream.end(fileBuffer);
  });
}

/**
 * Elimina un file da Cloudinary
 * @param publicId ID pubblico del file da eliminare
 * @param resourceType Tipo di risorsa ('image', 'raw', ecc.)
 * @returns Promessa con il risultato dell'eliminazione
 */
export async function deleteFromCloudinary(publicId: string, resourceType: 'image' | 'raw' = 'image'): Promise<{ result: string }> {
  // Verifica se Cloudinary è configurato
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary non configurato. Simulo eliminazione locale.');
    return { result: 'ok' };
  }

  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Interfaccia per il risultato di un upload su Cloudinary
 */
export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  format: string | null;
  resourceType: string;
  bytes: number;
  created: Date;
} 