import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

// Configurazione per permettere file di grandi dimensioni
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Limite per chunk
    },
  },
};

// Funzione di autorizzazione admin
async function isAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    
    const token = authHeader.substring(7);
    if (token !== process.env.ADMIN_API_KEY) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Errore nella verifica admin:', error);
    return false;
  }
}

// POST /api/admin/upload-chunk - Carica un'immagine su Cloudinary
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Leggiamo il FormData
    const data = await request.formData();
    const file = data.get('file') as File;
    const originalFilename = data.get('originalFilename') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'File mancante' }, { status: 400 });
    }

    // Verifichiamo che sia un'immagine
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Il file deve essere un\'immagine' }, { status: 400 });
    }

    console.log(`Caricamento immagine: ${originalFilename || file.name}, size: ${file.size} bytes`);

    // Converti il file in buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Carica su Cloudinary
    try {
      const uploadResult = await uploadImageToCloudinary(buffer, originalFilename || file.name);

      return NextResponse.json({ 
        success: true, 
        url: uploadResult.url,
        publicId: uploadResult.publicId
      });
    } catch (err) {
      console.error('Errore nel caricamento su Cloudinary:', err);
      return NextResponse.json({ 
        error: 'Errore nel caricamento dell\'immagine',
        details: err instanceof Error ? err.message : 'Errore sconosciuto'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Errore generale:', error);
    return NextResponse.json({ 
      error: 'Errore nel caricamento dell\'immagine',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
} 