'use client';

import { useState, useEffect, FormEvent, useRef, DragEvent } from 'react';
import { Comic, CensorInfo } from '@/lib/models/Comic';
import { useRouter } from 'next/navigation';
import ImageCensorEditor from './components/ImageCensorEditor';

// Dimensione massima per immagine in MB
const MAX_IMAGE_SIZE_MB = 2;
// Qualità di compressione (0-1)
const IMAGE_COMPRESSION_QUALITY = 0.7;
// Dimensione massima in pixel (larghezza o altezza)
const MAX_IMAGE_DIMENSION = 1200;

export default function AdminPage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [imageCensors, setImageCensors] = useState<{[key: number]: CensorInfo[]}>({});
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [selectedComicId, setSelectedComicId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendingResult, setSendingResult] = useState<{success?: number, error?: number} | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingComic, setEditingComic] = useState<Comic | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const authenticate = async () => {
    try {
      const response = await fetch('/api/admin/comics', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('adminApiKey', apiKey);
        fetchComics();
      } else {
        setError('Autenticazione fallita. Chiave API non valida.');
      }
    } catch (err) {
      setError('Errore durante l\'autenticazione.');
    }
  };

  useEffect(() => {
    console.log('Inizializzazione della pagina admin...');
    
    const loadComics = async () => {
      const savedApiKey = localStorage.getItem('adminApiKey');
      console.log('API Key da localStorage:', savedApiKey ? 'Presente' : 'Assente');
      
      if (savedApiKey) {
        console.log('Impostazione apiKey e autenticazione...');
        setApiKey(savedApiKey);
        setIsAuthenticated(true);
        
        try {
          console.log('Recupero fumetti...');
          
          // Assicuriamoci che la chiamata di fetch non fallisca silenziosamente
          setLoading(true);
          const response = await fetch('/api/admin/comics', {
            headers: {
              'Authorization': `Bearer ${savedApiKey}`
            }
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Errore nel recupero dei fumetti');
          }
          
          const data = await response.json();
          console.log(`Trovati ${data.comics?.length || 0} fumetti`);
          
          if (data.comics && Array.isArray(data.comics)) {
            setComics(data.comics);
          } else {
            console.error('Risposta API non valida:', data);
            setError('Risposta API non valida');
          }
        } catch (error) {
          console.error('Errore durante il recupero iniziale dei fumetti:', error);
          setError('Errore nel caricamento dei fumetti. Ricarica la pagina.');
        } finally {
          setLoading(false);
        }
      } else {
        console.log('Nessuna apiKey trovata, mostra pagina di login');
        setLoading(false);
      }
    };
    
    loadComics();
  }, []);

  const fetchComics = async () => {
    console.log('Richiesta fetchComics...');
    try {
      setLoading(true);
      const response = await fetch('/api/admin/comics', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nel recupero dei fumetti');
      }
      
      const data = await response.json();
      console.log(`Recuperati ${data.comics?.length || 0} fumetti`);
      
      if (data.comics && Array.isArray(data.comics)) {
        setComics(data.comics);
      } else {
        console.error('Risposta API non valida:', data);
        throw new Error('Risposta API non valida');
      }
    } catch (err) {
      console.error('Errore in fetchComics:', err);
      setError('Errore nel caricamento dei fumetti.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(Array.from(e.target.files));
    }
  };

  const processUploadedFiles = async (files: File[]) => {
    // Filtra solo le immagini
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setFormError('Per favore seleziona almeno un file immagine.');
      return;
    }
    
    try {
      // Impostiamo un messaggio di caricamento durante la compressione
      setFormError('Compressione delle immagini in corso...');
      
      // Array per memorizzare le immagini compresse
      const compressedImages: File[] = [];
      const newPreviewUrls: string[] = [];
      
      // Comprimiamo ogni immagine
      for (const file of imageFiles) {
        // Controlliamo se l'immagine è già abbastanza piccola
        if (file.size <= MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          compressedImages.push(file);
          newPreviewUrls.push(URL.createObjectURL(file));
          continue;
        }
        
        // Comprimiamo l'immagine
        const compressedFile = await compressImage(file);
        compressedImages.push(compressedFile);
        newPreviewUrls.push(URL.createObjectURL(compressedFile));
      }
      
      // Aggiorna lo stato con i file compressi
      setImages(prevImages => [...prevImages, ...compressedImages]);
      setPreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
      
      // Inizializza le censure per le nuove immagini
      const startIndex = images.length;
      const newCensors = { ...imageCensors };
      
      compressedImages.forEach((_, index) => {
        newCensors[startIndex + index] = [];
      });
      
      setImageCensors(newCensors);
      setFormError('');
    } catch (error) {
      console.error('Errore durante la compressione delle immagini:', error);
      setFormError('Errore durante la preparazione delle immagini. Riprova.');
    }
  };
  
  // Funzione per comprimere un'immagine
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        
        img.onload = () => {
          // Calcola le nuove dimensioni mantenendo le proporzioni
          let width = img.width;
          let height = img.height;
          
          // Ridimensiona se necessario
          if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
            if (width > height) {
              height = Math.round(height * MAX_IMAGE_DIMENSION / width);
              width = MAX_IMAGE_DIMENSION;
            } else {
              width = Math.round(width * MAX_IMAGE_DIMENSION / height);
              height = MAX_IMAGE_DIMENSION;
            }
          }
          
          // Crea un canvas per la compressione
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // Disegna l'immagine ridimensionata sul canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Impossibile ottenere il contesto del canvas'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Converti a blob con la compressione
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Errore nella compressione dell\'immagine'));
                return;
              }
              
              // Crea un nuovo File dall'immagine compressa
              const compressedFile = new File(
                [blob],
                `compressed_${file.name}`,
                {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                }
              );
              
              resolve(compressedFile);
            },
            'image/jpeg',
            IMAGE_COMPRESSION_QUALITY
          );
        };
        
        img.onerror = () => {
          reject(new Error('Errore nel caricamento dell\'immagine'));
        };
        
        img.src = event.target?.result as string;
      };
      
      reader.onerror = () => {
        reject(new Error('Errore nella lettura del file'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    // Rimuovi l'immagine dall'array
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    // Rimuovi l'URL di anteprima e revoca la URL per evitare memory leak
    URL.revokeObjectURL(previewUrls[index]);
    const newPreviewUrls = [...previewUrls];
    newPreviewUrls.splice(index, 1);
    setPreviewUrls(newPreviewUrls);
    
    // Aggiorna le censure
    const newCensors = { ...imageCensors };
    delete newCensors[index];
    
    // Aggiorna gli indici delle censure per le immagini successive
    for (let i = index + 1; i < images.length; i++) {
      newCensors[i - 1] = newCensors[i];
      delete newCensors[i];
    }
    
    setImageCensors(newCensors);
    
    // Se stavi modificando l'immagine rimossa, chiudi l'editor
    if (editingImageIndex === index) {
      setEditingImageIndex(null);
    }
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    // Sposta immagine nell'array
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImages(newImages);
    
    // Sposta anche l'anteprima
    const newPreviewUrls = [...previewUrls];
    const [movedPreview] = newPreviewUrls.splice(fromIndex, 1);
    newPreviewUrls.splice(toIndex, 0, movedPreview);
    setPreviewUrls(newPreviewUrls);
    
    // Aggiorna le censure
    const newCensors = { ...imageCensors };
    const movedCensors = newCensors[fromIndex] || [];
    
    // Riorganizza le censure in base al nuovo ordine
    if (fromIndex < toIndex) {
      // Spostamento verso il basso
      for (let i = fromIndex; i < toIndex; i++) {
        newCensors[i] = newCensors[i + 1] || [];
      }
    } else {
      // Spostamento verso l'alto
      for (let i = fromIndex; i > toIndex; i--) {
        newCensors[i] = newCensors[i - 1] || [];
      }
    }
    
    newCensors[toIndex] = movedCensors;
    setImageCensors(newCensors);
    
    // Aggiorna l'indice dell'immagine in modifica se necessario
    if (editingImageIndex === fromIndex) {
      setEditingImageIndex(toIndex);
    } else if (editingImageIndex !== null) {
      if (fromIndex < toIndex) {
        if (editingImageIndex > fromIndex && editingImageIndex <= toIndex) {
          setEditingImageIndex(editingImageIndex - 1);
        }
      } else {
        if (editingImageIndex >= toIndex && editingImageIndex < fromIndex) {
          setEditingImageIndex(editingImageIndex + 1);
        }
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (isEditing) {
      saveEditedComic();
      return;
    }
    
    // Validazione
    if (!title.trim()) {
      setFormError('Il titolo è richiesto.');
      return;
    }
    
    if (images.length === 0) {
      setFormError('Almeno un\'immagine è richiesta.');
      return;
    }
    
    try {
      setUploading(true);
      setFormError('');
      setUploadProgress(0);
      
      // Array per memorizzare le immagini caricate su Cloudinary
      const uploadedImages: any[] = [];
      
      // Carica ogni immagine
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        // Aggiorna l'avanzamento
        setUploadProgress(Math.round((i / images.length) * 80));
        setFormError(`Caricamento immagine ${i + 1}/${images.length}...`);
        
        try {
          // Prepara i dati per il caricamento
          const formData = new FormData();
          formData.append('file', image);
          formData.append('originalFilename', image.name);
          
          // Carica l'immagine
          const response = await fetch('/api/admin/upload-chunk', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`
            },
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`Errore nel caricamento dell'immagine ${i + 1}: ${response.statusText}`);
          }
          
          const result = await response.json();
          
          if (!result.success) {
            throw new Error(result.error || 'Errore nel caricamento dell\'immagine');
          }
          
          // Aggiungi l'immagine all'array di immagini caricate, incluse le censure
          uploadedImages.push({
            url: result.url,
            cloudinaryId: result.publicId,
            order: i,
            censors: imageCensors[i] || []
          });
        } catch (error) {
          console.error(`Errore nel caricamento dell'immagine ${i + 1}:`, error);
          throw new Error(`Errore nel caricamento dell'immagine ${i + 1}`);
        }
      }
      
      // Aggiorna l'avanzamento
      setUploadProgress(90);
      setFormError('Creazione del fumetto...');
      
      // Crea il fumetto con le immagini caricate
      const comicData = {
        title,
        description,
        images: uploadedImages
      };
      
      // Invia i dati del fumetto senza le immagini (ormai già caricate)
      const response = await fetch('/api/admin/comics/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(comicData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella creazione del fumetto');
      }
      
      const result = await response.json();
      setSuccessMessage('Fumetto caricato con successo!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setImages([]);
      setPreviewUrls([]);
      setImageCensors({});
      setEditingImageIndex(null);
      setFormError('');
      
      // Rilascia gli URL di anteprima per evitare memory leak
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // Aggiorna l'avanzamento
      setUploadProgress(100);
      
      // Refresh comics list
      fetchComics();
    } catch (err: any) {
      console.error('Errore durante il caricamento:', err);
      setFormError(`Errore durante il caricamento del fumetto: ${err.message || 'Si è verificato un errore'}`);
    } finally {
      setUploading(false);
    }
  };

  const publishComic = async (id: string, publish: boolean) => {
    try {
      setLoading(true);
      console.log(`${publish ? 'Pubblicazione' : 'Nascondimento'} fumetto con ID: ${id}`);
      
      const response = await fetch(`/api/admin/comics?id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ published: publish })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Errore nell\'aggiornamento del fumetto';
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Risultato operazione:', result);
      
      // Aggiungi un feedback visivo
      if (publish) {
        setSuccessMessage(`Fumetto pubblicato con successo! Ora è visibile nella pagina pubblica.`);
      } else {
        setSuccessMessage(`Fumetto nascosto con successo.`);
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh comics list
      fetchComics();
    } catch (err) {
      console.error('Errore durante l\'aggiornamento del fumetto:', err);
      setError(`Errore durante ${publish ? 'la pubblicazione' : 'il nascondimento'} del fumetto.`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const deleteComic = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo fumetto?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/comics?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione del fumetto');
      }
      
      // Refresh comics list
      fetchComics();
    } catch (err) {
      setError('Errore durante l\'eliminazione del fumetto.');
    } finally {
      setLoading(false);
    }
  };

  const sendComic = async (id: string) => {
    console.log(`Reindirizzamento all'editor email per il fumetto con ID: ${id}`);
    router.push(`/admin/email-editor/${id}`);
  };

  // Funzione per avviare la modifica di un fumetto
  const startEditComic = (comic: Comic) => {
    // Impostiamo lo stato di modifica
    setIsEditing(true);
    setEditingComic(comic);
    setSelectedComicId(comic._id?.toString() || null);
    
    // Popoliamo il form con i dati del fumetto
    setTitle(comic.title);
    setDescription(comic.description);
    
    // Creiamo le anteprime delle immagini esistenti
    if (comic.images && comic.images.length > 0) {
      // Ordiniamo le immagini per ordine
      const orderedImages = [...comic.images].sort((a, b) => a.order - b.order);
      setPreviewUrls(orderedImages.map(img => img.url));
    }
    
    // Scrolliamo verso l'alto per mostrare il form
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Funzione per annullare la modifica
  const cancelEdit = () => {
    // Reset dello stato di modifica
    setIsEditing(false);
    setEditingComic(null);
    setSelectedComicId(null);
    
    // Reset del form
    setTitle('');
    setDescription('');
    setImages([]);
    setPreviewUrls([]);
    setFormError('');
  };

  // Funzione per salvare le modifiche al fumetto
  const saveEditedComic = async () => {
    try {
      setLoading(true);
      
      // Preparazione dati da aggiornare
      const updateData = {
        title,
        description
      };
      
      // Invio delle modifiche
      const response = await fetch(`/api/admin/comics?id=${selectedComicId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nell\'aggiornamento del fumetto');
      }
      
      // Successo
      setSuccessMessage('Fumetto aggiornato con successo!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Reset dello stato di modifica
      setIsEditing(false);
      setEditingComic(null);
      setSelectedComicId(null);
      
      // Reset del form
      setTitle('');
      setDescription('');
      setImages([]);
      setPreviewUrls([]);
      
      // Aggiorniamo la lista
      fetchComics();
    } catch (err) {
      console.error('Errore durante la modifica del fumetto:', err);
      setFormError(`Errore durante la modifica del fumetto: ${err instanceof Error ? err.message : 'Si è verificato un errore'}`);
    } finally {
      setLoading(false);
    }
  };

  // Nuova funzione per gestire l'editing delle censure
  const handleEditCensors = (index: number) => {
    setEditingImageIndex(index);
  };

  // Nuova funzione per aggiornare le censure di un'immagine
  const handleCensorUpdate = (index: number, censors: CensorInfo[]) => {
    setImageCensors({
      ...imageCensors,
      [index]: censors
    });
  };

  // Componenti per l'Editor delle immagini
  const renderImageEditor = () => {
    if (editingImageIndex === null || !previewUrls[editingImageIndex]) {
      return null;
    }
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium">
              Modifica Censura - Immagine {editingImageIndex + 1}
            </h3>
            <button 
              type="button"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setEditingImageIndex(null)}
            >
              ✕
            </button>
          </div>
          <div className="p-4">
            <ImageCensorEditor 
              imageUrl={previewUrls[editingImageIndex]}
              censors={imageCensors[editingImageIndex] || []}
              onChange={(censors) => handleCensorUpdate(editingImageIndex, censors)}
            />
          </div>
          <div className="p-4 border-t">
            <button
              type="button"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => setEditingImageIndex(null)}
            >
              Fatto
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold">Caricamento...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Access</h1>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              <p>{error}</p>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="apiKey">
              API Key
            </label>
            <input
              type="password"
              id="apiKey"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          
          <button
            type="button"
            className="w-full bg-black text-white py-2 px-4 rounded hover:bg-opacity-90 transition-all"
            onClick={authenticate}
          >
            Accedi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Exit Wounds Admin</h1>
          <p className="text-gray-600">Gestisci i fumetti e le newsletter</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}
        
        {sendingResult && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            <p>Risultato invio: {sendingResult.success} successi, {sendingResult.error} errori</p>
          </div>
        )}
        
        {/* Two-column layout for comic creation/editing */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            {isEditing ? `Modifica Fumetto: ${editingComic?.title}` : 'Crea Nuovo Fumetto'}
          </h2>
          
          {successMessage && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
              <p>{successMessage}</p>
            </div>
          )}
          
          {formError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p>{formError}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column: Form */}
            <div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (isEditing) {
                  saveEditedComic();
                } else {
                  handleSubmit(e);
                }
              }}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="title">
                    Titolo
                  </label>
                  <input
                    type="text"
                    id="title"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="description">
                    Descrizione
                  </label>
                  <textarea
                    id="description"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                
                {/* Drag and drop area - mostriamo solo se non stiamo modificando */}
                {!isEditing && (
                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2">
                      Immagini del Fumetto
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={handleBrowseClick}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImagesChange}
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        Trascina qui le immagini o clicca per selezionarle
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        PNG, JPG, GIF fino a 10MB
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Image list for reordering - modificato per mostrare anche in modalità modifica */}
                {(images.length > 0 || isEditing) && (
                  <div className="mb-6">
                    <h3 className="text-md font-semibold mb-2">
                      {isEditing 
                        ? `Immagini del fumetto (${previewUrls.length})`
                        : `Immagini selezionate (${images.length})`
                      }
                    </h3>
                    
                    {isEditing ? (
                      <p className="text-xs text-gray-500 mb-2">
                        Per modificare le immagini è necessario eliminare il fumetto e crearne uno nuovo.
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mb-2">Trascina per riordinare</p>
                    )}
                    
                    {!isEditing && (
                      <ul className="space-y-2">
                        {images.map((file, index) => (
                          <li key={index} className="flex items-center p-2 border rounded bg-gray-50 group">
                            <div className="flex-shrink-0 w-10 h-10 mr-3 bg-gray-200 overflow-hidden rounded">
                              <img src={previewUrls[index]} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-grow truncate">
                              {file.name}
                              <div className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(0)} KB
                                {imageCensors[index]?.length > 0 && (
                                  <span className="ml-2 text-blue-500">
                                    {imageCensors[index].length} censure
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0 space-x-2">
                              <button
                                type="button"
                                className="text-blue-500 hover:text-blue-700"
                                onClick={() => handleEditCensors(index)}
                                title="Modifica censure"
                              >
                                ✎
                              </button>
                              {index > 0 && (
                                <button
                                  type="button"
                                  className="text-gray-500 hover:text-gray-700"
                                  onClick={() => moveImage(index, index - 1)}
                                  title="Sposta su"
                                >
                                  ↑
                                </button>
                              )}
                              {index < images.length - 1 && (
                                <button
                                  type="button"
                                  className="text-gray-500 hover:text-gray-700"
                                  onClick={() => moveImage(index, index + 1)}
                                  title="Sposta giù"
                                >
                                  ↓
                                </button>
                              )}
                              <button
                                type="button"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => removeImage(index)}
                                title="Rimuovi"
                              >
                                ×
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    {isEditing && previewUrls.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="border rounded overflow-hidden">
                            <img src={url} alt="" className="w-full h-auto" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex space-x-3">
                  {isEditing ? (
                    <>
                      <button
                        type="submit"
                        className="bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700 transition-all"
                        disabled={uploading || loading}
                      >
                        {loading ? 'Salvataggio...' : 'Salva Modifiche'}
                      </button>
                      <button
                        type="button"
                        className="bg-gray-500 text-white py-2 px-6 rounded hover:bg-gray-600 transition-all"
                        onClick={cancelEdit}
                        disabled={uploading || loading}
                      >
                        Annulla
                      </button>
                    </>
                  ) : (
                    <button
                      type="submit"
                      className="bg-black text-white py-2 px-6 rounded hover:bg-opacity-80 transition-all"
                      disabled={uploading}
                    >
                      {uploading ? 'Caricamento in corso...' : 'Pubblica Fumetto'}
                    </button>
                  )}
                </div>
              </form>
              
              {uploading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-black h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right column: Mobile preview */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Anteprima Mobile</h3>
              <div className="mx-auto w-[320px] h-[600px] border-8 border-black rounded-[36px] overflow-hidden shadow-lg relative">
                {/* Phone frame details */}
                <div className="absolute top-0 inset-x-0 h-6 bg-black z-10"></div>
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-black rounded-b-lg z-20"></div>
                
                {/* Mobile screen */}
                <div className="w-full h-full bg-white overflow-y-auto pt-6">
                  {previewUrls.length > 0 ? (
                    <div className="p-4">
                      <div className="text-center mb-4">
                        <h1 className="text-xl font-bold">{title || 'Titolo Fumetto'}</h1>
                        {description && <p className="text-sm text-gray-600">{description}</p>}
                      </div>
                      
                      <div className="space-y-4">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="border border-gray-200 rounded overflow-hidden">
                            <img 
                              src={url} 
                              alt={`Preview ${index + 1}`} 
                              className="w-full h-auto"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-center">
                        Carica immagini per vedere<br />l'anteprima del fumetto
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Lista dei fumetti */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Fumetti</h2>
          
          {loading ? (
            <p>Caricamento fumetti...</p>
          ) : comics.length === 0 ? (
            <p>Nessun fumetto disponibile</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-3 px-4 border-b text-left">Titolo</th>
                    <th className="py-3 px-4 border-b text-left">Descrizione</th>
                    <th className="py-3 px-4 border-b text-left">Immagini</th>
                    <th className="py-3 px-4 border-b text-left">Stato</th>
                    <th className="py-3 px-4 border-b text-left">Inviato</th>
                    <th className="py-3 px-4 border-b text-left">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {comics.map((comic) => (
                    <tr key={comic._id?.toString()} className="hover:bg-gray-50">
                      <td className="py-4 px-4 border-b">{comic.title}</td>
                      <td className="py-4 px-4 border-b">
                        {comic.description.length > 50
                          ? `${comic.description.substring(0, 50)}...`
                          : comic.description}
                      </td>
                      <td className="py-4 px-4 border-b">
                        {comic.images?.length || 0} immagini
                      </td>
                      <td className="py-4 px-4 border-b">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          comic.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {comic.published ? 'Pubblicato' : 'Bozza'}
                        </span>
                      </td>
                      <td className="py-4 px-4 border-b">
                        {comic.sentAt 
                          ? `Sì (${comic.recipients} destinatari)` 
                          : 'No'}
                      </td>
                      <td className="py-4 px-4 border-b">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => comic.images && comic.images.length > 0 && window.open(comic.images[0].url, '_blank')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Anteprima
                          </button>
                          
                          <button
                            onClick={() => startEditComic(comic)}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            Modifica
                          </button>
                          
                          <button
                            onClick={() => publishComic(comic._id!.toString(), !comic.published)}
                            className={`${
                              comic.published ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'
                            }`}
                          >
                            {comic.published ? 'Nascondi' : 'Pubblica'}
                          </button>
                          
                          <button
                            onClick={() => deleteComic(comic._id!.toString())}
                            className="text-red-600 hover:text-red-800"
                          >
                            Elimina
                          </button>
                          
                          {comic.published && (
                            <button
                              onClick={() => sendComic(comic._id!.toString())}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              Invia Email
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Editor di censura modale */}
      {renderImageEditor()}
    </div>
  );
} 