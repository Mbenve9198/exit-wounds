import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';

// Configurazione per permettere file di grandi dimensioni
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
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

// POST /api/admin/upload - Carica un file PDF di grandi dimensioni
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Assicuriamoci che la directory esista
    const comicsDir = join(process.cwd(), 'public', 'comics');
    await mkdir(comicsDir, { recursive: true });

    // Genera un nome file unico
    const timestamp = Date.now();
    const fileName = `comic_${timestamp}.pdf`;
    const filePath = join(comicsDir, fileName);

    // Crea uno stream per salvare il file
    const fileStream = createWriteStream(filePath);

    try {
      // Converti la richiesta in un Readable stream
      const stream = Readable.fromWeb(request.body as any);
      
      // Usa pipeline per gestire il trasferimento dello stream
      await pipeline(stream, fileStream);
      
      return NextResponse.json({ 
        success: true, 
        filePath: `/comics/${fileName}`,
        fileName: fileName
      });
    } catch (error) {
      console.error('Errore durante il salvataggio del file:', error);
      return NextResponse.json({ error: 'Errore durante il salvataggio del file' }, { status: 500 });
    }
  } catch (error) {
    console.error('Errore nell\'upload del file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 