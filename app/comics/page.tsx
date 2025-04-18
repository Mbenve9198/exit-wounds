import { getDatabase } from '@/lib/mongodb';
import Link from 'next/link';
import { Comic } from '@/lib/models/Comic';
import { cache } from 'react';

// Funzione cached per evitare chiamate DB duplicate
const getPublishedComics = cache(async (): Promise<Comic[]> => {
  console.log('Recupero fumetti pubblicati...');
  try {
    const db = await getDatabase();
    console.log('Connessione al database riuscita');
    
    const comics = await db.collection('comics')
      .find({ published: true })
      .sort({ createdAt: -1 })
      .toArray() as Comic[];
    
    console.log(`Trovati ${comics.length} fumetti pubblicati`);
    
    // Log di debug per ogni fumetto
    comics.forEach((comic, index) => {
      console.log(`Fumetto ${index + 1}: ${comic.title}, Pubblicato: ${comic.published}, Immagini: ${comic.images?.length || 0}`);
    });
    
    return comics;
  } catch (error) {
    console.error('Errore nel recupero dei fumetti:', error);
    return [];
  }
});

export default async function ComicsPage() {
  const comics = await getPublishedComics();
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-black text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">
              EXIT WOUNDS
            </Link>
            
            <nav>
              <Link href="/" className="text-gray-300 hover:text-white">
                Home
              </Link>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 text-center">Fumetti</h1>
        <p className="text-gray-600 mb-8 text-center">
          Esplora la collezione di traumatiche avventure imprenditoriali
        </p>
        
        {comics.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h2 className="text-xl font-semibold mt-4">Nessun fumetto disponibile</h2>
            <p className="text-gray-500 mt-2">Torna più tardi per nuovi contenuti</p>
            <p className="text-xs text-gray-400 mt-4">
              Nota: se hai caricato fumetti nell'area admin, assicurati di averli impostati come "Pubblicati".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {comics.map((comic) => (
              <Link 
                href={`/comics/${comic._id}`} 
                key={comic._id?.toString()}
                className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="aspect-w-3 aspect-h-4 relative">
                  {comic.images && comic.images.length > 0 ? (
                    <img 
                      src={comic.images[0].url} 
                      alt={comic.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Overlay con sfumatura per il testo */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
                  
                  {/* Informazioni fumetto */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h2 className="text-xl font-bold truncate">{comic.title}</h2>
                    <p className="text-sm opacity-90">{comic.images?.length || 0} pagine</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-black text-gray-400 py-8">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 Exit Wounds. Tutti i diritti riservati.</p>
          <p className="mt-2 text-sm">
            Un progetto di Marco Benvenuti, un ex-fondatore traumatizzato.
          </p>
        </div>
      </footer>
    </div>
  );
} 