import { getDatabase } from '@/lib/mongodb';
import { Comic } from '@/lib/models/Comic';
import { ObjectId } from 'mongodb';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import './reader.css';
import { ClientNavigationBanner } from './client-components';

// Server component for retrieving a specific comic
async function getComic(id: string): Promise<Comic | null> {
  try {
    const db = await getDatabase();
    const comic = await db.collection('comics').findOne(
      { _id: new ObjectId(id), published: true }
    ) as unknown as Comic;
    
    return comic;
  } catch (error) {
    console.error('Error retrieving comic:', error);
    return null;
  }
}

export default async function ComicReaderPage({ params }: { params: { id: string } }) {
  const comic = await getComic(params.id);
  
  if (!comic) {
    // Redirect to 404 page if comic doesn't exist or isn't published
    notFound();
  }
  
  // Sort images by order
  const orderedImages = [...(comic.images || [])].sort((a, b) => a.order - b.order);
  
  return (
    <div className="fullscreen-reader">
      <ClientNavigationBanner />
      
      {/* Comic reader */}
      <div className="reader-content">
        {orderedImages.map((image, index) => (
          <div 
            key={index}
            className="comic-page"
          >
            <img 
              src={image.url} 
              alt={`${comic.title} - Page ${index + 1}`}
              className="fullscreen-image"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
} 