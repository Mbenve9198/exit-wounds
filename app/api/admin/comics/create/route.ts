import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Comic, ImageInfo } from '@/lib/models/Comic';

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

// POST /api/admin/comics/create - Crea un nuovo fumetto con immagini già caricate
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Leggiamo i dati JSON
    const { title, description, images } = await request.json();
    
    if (!title || !images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ 
        error: 'Titolo e almeno un\'immagine sono richiesti' 
      }, { status: 400 });
    }

    console.log(`Creazione fumetto "${title}" con ${images.length} immagini`);
    
    // Verifichiamo che le immagini contengano le informazioni necessarie
    const validImages = images.every(img => 
      img.url && 
      img.cloudinaryId && 
      typeof img.order === 'number'
    );
    
    if (!validImages) {
      return NextResponse.json({ 
        error: 'Formato delle immagini non valido' 
      }, { status: 400 });
    }

    // Elaborazione delle censure
    const processedImages = images.map(img => {
      // Assicuriamo che le censure siano valide
      let validCensors = [];
      
      if (img.censors && Array.isArray(img.censors)) {
        validCensors = img.censors.filter((censor: any) => 
          censor.id && 
          censor.type === 'emoji' && 
          censor.emoji && 
          typeof censor.x === 'number' && 
          typeof censor.y === 'number' && 
          typeof censor.width === 'number' && 
          typeof censor.height === 'number'
        );
      }
      
      return {
        url: img.url,
        cloudinaryId: img.cloudinaryId,
        order: img.order,
        censors: validCensors
      };
    });

    // Creiamo l'oggetto fumetto
    const comic: Omit<Comic, '_id'> = {
      title,
      description: description || '',
      images: processedImages as ImageInfo[],
      createdAt: new Date(),
      updatedAt: new Date(),
      published: false,
      sentAt: null,
      recipients: 0
    };

    // Salviamo il fumetto nel database
    try {
      const db = await getDatabase();
      const result = await db.collection('comics').insertOne(comic);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Fumetto creato con successo',
        comicId: result.insertedId,
        comic: { ...comic, _id: result.insertedId }
      });
    } catch (err) {
      console.error('Errore nel salvataggio del fumetto:', err);
      return NextResponse.json({ 
        error: 'Errore nel salvataggio del fumetto',
        details: err instanceof Error ? err.message : 'Errore sconosciuto'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Errore generale:', error);
    return NextResponse.json({ 
      error: 'Errore nella creazione del fumetto',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
} 