import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Comic, ImageInfo } from '@/lib/models/Comic';
import { uploadImageToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

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

// GET /api/admin/comics - Ottieni tutti i fumetti o un fumetto specifico per ID
export async function GET(request: NextRequest) {
  try {
    console.log('Richiesta GET /api/admin/comics ricevuta');
    
    if (!(await isAdmin(request))) {
      console.error('Accesso non autorizzato all\'API GET comics');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    // Se è specificato un ID, restituisci quel fumetto specifico
    if (id) {
      console.log(`Richiesto fumetto specifico con ID: ${id}`);
      try {
        const objectId = new ObjectId(id);
        const comic = await db.collection('comics').findOne({ _id: objectId });
        
        if (!comic) {
          console.error(`Fumetto con ID ${id} non trovato nel database`);
          return NextResponse.json({ error: 'Fumetto non trovato' }, { status: 404 });
        }
        
        console.log(`Fumetto trovato: ${comic.title}`);
        return NextResponse.json({ comic });
      } catch (error) {
        console.error(`Errore nella conversione dell'ID o nel recupero del fumetto: ${error}`);
        return NextResponse.json({ 
          error: 'ID fumetto non valido o fumetto non trovato',
          details: error instanceof Error ? error.message : 'Errore sconosciuto'
        }, { status: 400 });
      }
    }
    
    // Altrimenti restituisci tutti i fumetti
    console.log('Connessione al database riuscita, recupero di tutti i fumetti');
    
    const comics = await db.collection('comics').find({}).sort({ createdAt: -1 }).toArray();
    console.log(`Trovati ${comics.length} fumetti in totale`);
    
    // Log di base di ogni fumetto per debug
    comics.forEach((comic, index) => {
      console.log(`Fumetto ${index + 1}: ID=${comic._id}, Titolo="${comic.title}", Pubblicato=${comic.published || false}`);
    });
    
    return NextResponse.json({ comics });
  } catch (error) {
    console.error('Errore nel recupero dei fumetti:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
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
    const title = data.get('title') as string;
    const description = data.get('description') as string;
    
    // Verifichiamo che titolo sia presente
    if (!title) {
      return NextResponse.json({ error: 'Il titolo è richiesto' }, { status: 400 });
    }
    
    // Prendiamo tutti i file dalla richiesta
    const images: File[] = [];
    for (const [key, value] of data.entries()) {
      if (key.startsWith('image') && value instanceof File) {
        images.push(value);
      }
    }
    
    if (images.length === 0) {
      return NextResponse.json({ error: 'Almeno un\'immagine è richiesta' }, { status: 400 });
    }
    
    console.log(`Ricevute ${images.length} immagini da caricare`);
    
    try {
      // Array per memorizzare i dettagli delle immagini caricate
      const uploadedImages: ImageInfo[] = [];
      
      // Carichiamo ogni immagine su Cloudinary
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        // Verifichiamo che sia un'immagine
        if (!image.type.startsWith('image/')) {
          return NextResponse.json({ 
            error: `Il file ${image.name} non è un'immagine valida` 
          }, { status: 400 });
        }
        
        console.log(`Elaborazione immagine ${i + 1}/${images.length}: ${image.name} (${image.size} bytes)`);
        
        // Convertiamo l'immagine in buffer
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Carichiamo su Cloudinary
        const cloudinaryResult = await uploadImageToCloudinary(buffer, image.name);
        console.log(`Immagine ${i + 1} caricata su Cloudinary:`, cloudinaryResult.url);
        
        // Aggiungiamo alla lista delle immagini caricate
        uploadedImages.push({
          url: cloudinaryResult.url,
          cloudinaryId: cloudinaryResult.publicId,
          order: i // Manteniamo l'ordine originale
        });
      }
      
      // Creo la struttura del fumetto con le immagini
      const comic: Omit<Comic, '_id'> = {
        title,
        description,
        images: uploadedImages,
        createdAt: new Date(),
        updatedAt: new Date(),
        published: false,
        sentAt: null,
        recipients: 0
      };

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
      console.error('Accesso non autorizzato all\'API PUT comics');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      console.error('ID fumetto mancante nella richiesta PUT');
      return NextResponse.json({ error: 'ID fumetto richiesto' }, { status: 400 });
    }

    const data = await request.json();
    const { title, description, published } = data;
    
    console.log(`Aggiornamento fumetto ${id}:`);
    console.log('- title:', title);
    console.log('- description:', description);
    console.log('- published:', published);
    
    const db = await getDatabase();
    
    // Prima verifica che il fumetto esista
    const comic = await db.collection('comics').findOne({ _id: new ObjectId(id) });
    if (!comic) {
      console.error(`Fumetto non trovato con ID: ${id}`);
      return NextResponse.json({ error: 'Fumetto non trovato' }, { status: 404 });
    }
    
    const updateFields: Record<string, any> = { 
      updatedAt: new Date() 
    };
    
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (published !== undefined) updateFields.published = published;
    
    const result = await db.collection('comics').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );
    
    if (result.matchedCount === 0) {
      console.error(`Nessun fumetto corrisponde all'ID: ${id}`);
      return NextResponse.json({ error: 'Fumetto non trovato' }, { status: 404 });
    }
    
    console.log(`Fumetto ${id} aggiornato con successo. Modificati: ${result.modifiedCount} documenti`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Fumetto aggiornato con successo',
      updateInfo: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento del fumetto:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
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
    
    // Prima recupero il fumetto per ottenere gli ID Cloudinary
    const comic = await db.collection('comics').findOne({ _id: new ObjectId(id) });
    
    if (!comic) {
      return NextResponse.json({ error: 'Fumetto non trovato' }, { status: 404 });
    }
    
    // Elimino il documento dal database
    const result = await db.collection('comics').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Fumetto non trovato' }, { status: 404 });
    }
    
    // Elimino tutte le immagini da Cloudinary
    if (comic.images && comic.images.length > 0) {
      for (const image of comic.images) {
        try {
          await deleteFromCloudinary(image.cloudinaryId);
          console.log(`Immagine eliminata da Cloudinary: ${image.cloudinaryId}`);
        } catch (error) {
          console.error(`Errore nell'eliminazione dell'immagine da Cloudinary: ${error}`);
          // Continuiamo l'esecuzione anche se c'è un errore con Cloudinary
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Fumetto eliminato con successo'
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione del fumetto:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 