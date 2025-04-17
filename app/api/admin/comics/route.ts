import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Comic } from '@/lib/models/Comic';

// Configurazione per permettere file di grandi dimensioni
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
};

// Funzione di autorizzazione admin
async function isAdmin(request: NextRequest) {
  try {
    // Qui implementare una verifica più sicura basata su JWT/cookie di sessione
    // Per ora è una verifica semplice sul ruolo admin
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

// GET /api/admin/comics - Ottieni tutti i fumetti
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const comics = await db.collection('comics').find({}).sort({ chapter: 1 }).toArray();
    
    return NextResponse.json({ comics });
  } catch (error) {
    console.error('Errore nel recupero dei fumetti:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/admin/comics - Carica un nuovo fumetto
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Elaborazione richiesta di caricamento fumetto...');
    
    // Leggiamo il FormData, gestendo file di grandi dimensioni
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const title = data.get('title') as string;
    const chapter = parseInt(data.get('chapter') as string);
    const description = data.get('description') as string;
    
    console.log(`File ricevuto: ${file?.name}, dimensione: ${file?.size} bytes`);
    
    if (!file || !title || isNaN(chapter)) {
      return NextResponse.json({ error: 'File, titolo e capitolo sono richiesti' }, { status: 400 });
    }

    // Verifico che sia un PDF
    if (!file.type.includes('pdf')) {
      return NextResponse.json({ error: 'Il file deve essere in formato PDF' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`Buffer creato, dimensione: ${buffer.length} bytes`);

    // Assicuriamoci che la directory esista
    const comicsDir = join(process.cwd(), 'public', 'comics');
    try {
      await mkdir(comicsDir, { recursive: true });
      console.log(`Directory ${comicsDir} creata o già esistente`);
    } catch (err) {
      console.error(`Errore nella creazione della directory: ${err}`);
    }

    // Creo un nome file unico basato sul capitolo e sul timestamp
    const fileName = `chapter_${chapter}_${Date.now()}.pdf`;
    const filePath = join(comicsDir, fileName);
    
    console.log(`Salvataggio file in: ${filePath}`);
    
    // Creo la struttura del fumetto
    const comic: Omit<Comic, '_id'> = {
      title,
      chapter,
      description,
      pdfUrl: `/comics/${fileName}`,
      fileId: fileName,
      createdAt: new Date(),
      updatedAt: new Date(),
      published: false,
      sentAt: null,
      recipients: 0
    };

    try {
      // Salvo il file sul server
      await writeFile(filePath, buffer);
      console.log('File salvato con successo');
      
      // Salvo i metadati nel database
      const db = await getDatabase();
      const result = await db.collection('comics').insertOne(comic);
      console.log(`Documento creato in MongoDB con ID: ${result.insertedId}`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Fumetto caricato con successo',
        comicId: result.insertedId,
        comic: { ...comic, _id: result.insertedId }
      });
    } catch (err) {
      console.error(`Errore nel salvataggio: ${err}`);
      return NextResponse.json({ error: `Errore nel salvataggio: ${err}` }, { status: 500 });
    }
  } catch (error) {
    console.error('Errore nel caricamento del fumetto:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
}

// PUT /api/admin/comics/:id - Aggiorna un fumetto
export async function PUT(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID fumetto richiesto' }, { status: 400 });
    }

    const data = await request.json();
    const { title, description, published } = data;
    
    const db = await getDatabase();
    const result = await db.collection('comics').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...(title && { title }),
          ...(description && { description }),
          ...(published !== undefined && { published }),
          updatedAt: new Date() 
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Fumetto non trovato' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Fumetto aggiornato con successo'
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento del fumetto:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/admin/comics/:id - Elimina un fumetto
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID fumetto richiesto' }, { status: 400 });
    }
    
    const db = await getDatabase();
    
    // Prima recupero il fumetto per ottenere il fileId
    const comic = await db.collection('comics').findOne({ _id: new ObjectId(id) });
    
    if (!comic) {
      return NextResponse.json({ error: 'Fumetto non trovato' }, { status: 404 });
    }
    
    // Elimino il documento dal database
    const result = await db.collection('comics').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Fumetto non trovato' }, { status: 404 });
    }
    
    // Nota: se necessario, qui potremmo anche eliminare il file fisico
    // ma per ora lo manteniamo per sicurezza
    
    return NextResponse.json({ 
      success: true, 
      message: 'Fumetto eliminato con successo'
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione del fumetto:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 