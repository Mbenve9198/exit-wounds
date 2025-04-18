import { getDatabase } from '@/lib/mongodb';
import { Comic } from '@/lib/models/Comic';
import { ObjectId } from 'mongodb';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Server component per il recupero di un fumetto specifico
async function getComic(id: string): Promise<Comic | null> {
  try {
    const db = await getDatabase();
    const comic = await db.collection('comics').findOne(
      { _id: new ObjectId(id), published: true }
    ) as unknown as Comic;
    
    return comic;
  } catch (error) {
    console.error('Errore nel recupero del fumetto:', error);
    return null;
  }
}

export default async function ComicReaderPage({ params }: { params: { id: string } }) {
  const comic = await getComic(params.id);
  
  if (!comic) {
    // Reindirizza alla pagina 404 se il fumetto non esiste o non è pubblicato
    notFound();
  }
  
  // Ordina le immagini in base all'ordine specificato
  const orderedImages = [...(comic.images || [])].sort((a, b) => a.order - b.order);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* Header Minimale */}
      <header className="bg-black text-white py-4 px-4 z-10 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/comics" className="text-white hover:text-gray-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Indietro
          </Link>
          
          <h1 className="text-lg font-semibold truncate max-w-[200px]">{comic.title}</h1>
          
          <div className="w-6"></div> {/* Elemento vuoto per bilanciare il flex */}
        </div>
      </header>
      
      {/* Titolo e descrizione */}
      <div className="bg-black text-white px-4 py-6 border-b border-gray-800">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">{comic.title}</h1>
          <p className="text-gray-400 mt-2">{comic.description}</p>
        </div>
      </div>
      
      {/* Reader del fumetto */}
      <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        <div className="reader-container mx-auto max-w-2xl pb-20">
          {orderedImages.map((image, index) => (
            <div 
              key={index}
              className="comic-page mb-1"
            >
              <img 
                src={image.url} 
                alt={`${comic.title} - Pagina ${index + 1}`}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer minimale */}
      <footer className="bg-black text-white py-3 px-4 border-t border-gray-800 text-center text-sm">
        <div className="container mx-auto">
          <p>© 2025 Exit Wounds</p>
        </div>
      </footer>
      
      {/* Stili personalizzati per supportare il pinch-to-zoom su mobile */}
      <style jsx global>{`
        /* Dimensione base per il container del reader */
        .reader-container {
          width: 100%;
          position: relative;
        }
        
        /* Stili per supportare il pinch-to-zoom */
        .comic-page {
          touch-action: manipulation;
          position: relative;
        }
        
        /* Stile per la scrollbar verticale */
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
        }
        
        .scrollbar-thumb-gray-700::-webkit-scrollbar-thumb {
          background-color: #4B5563;
          border-radius: 5px;
        }
        
        .scrollbar-track-gray-900::-webkit-scrollbar-track {
          background-color: #111827;
        }
        
        /* Nascondi scrollbar su mobile */
        @media (max-width: 768px) {
          .scrollbar-thin::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
} 