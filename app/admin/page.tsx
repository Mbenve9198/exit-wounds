'use client';

import { useState, useEffect, FormEvent, useRef, DragEvent } from 'react';
import { Comic } from '@/lib/models/Comic';
import { useRouter } from 'next/navigation';

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
  const [successMessage, setSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [selectedComicId, setSelectedComicId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendingResult, setSendingResult] = useState<{success?: number, error?: number} | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
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

  const fetchComics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/comics', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Errore nel recupero dei fumetti');
      }
      
      const data = await response.json();
      setComics(data.comics);
    } catch (err) {
      setError('Errore nel caricamento dei fumetti.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedApiKey = localStorage.getItem('adminApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsAuthenticated(true);
      fetchComics();
    } else {
      setLoading(false);
    }
  }, []);

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

  const processUploadedFiles = (files: File[]) => {
    // Filtra solo le immagini
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setFormError('Per favore seleziona almeno un file immagine.');
      return;
    }
    
    // Aggiorna lo stato con i nuovi file
    setImages(prevImages => [...prevImages, ...imageFiles]);
    
    // Crea URL di anteprima per le nuove immagini
    const newPreviewUrls = imageFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
    
    setFormError('');
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
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Reset messages
    setSuccessMessage('');
    setFormError('');
    
    // Validate form
    if (!title.trim() || !description.trim() || images.length === 0) {
      setFormError('Titolo, descrizione e almeno un\'immagine sono obbligatori');
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      setFormError(`Caricamento in corso... Attendere prego. ${images.length} immagini da caricare.`);
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      
      // Aggiungiamo tutte le immagini con chiavi distinte
      images.forEach((image, index) => {
        formData.append(`image${index}`, image);
      });
      
      // Ottimizziamo la richiesta per gestire file di grandi dimensioni
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000); // 10 minuti di timeout
      
      const response = await fetch('/api/admin/comics', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nel caricamento del fumetto');
      }
      
      const result = await response.json();
      setSuccessMessage('Fumetto caricato con successo!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setImages([]);
      setPreviewUrls([]);
      setFormError('');
      
      // Rilascia gli URL di anteprima per evitare memory leak
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      // Refresh comics list
      fetchComics();
    } catch (err: any) {
      console.error('Errore durante il caricamento:', err);
      setFormError(`Errore durante il caricamento del fumetto: ${err.message || 'Si è verificato un errore'}`);
    } finally {
      setUploading(false);
      setUploadProgress(100);
    }
  };

  const publishComic = async (id: string, publish: boolean) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/comics?id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ published: publish })
      });
      
      if (!response.ok) {
        throw new Error('Errore nell\'aggiornamento del fumetto');
      }
      
      // Refresh comics list
      fetchComics();
    } catch (err) {
      setError('Errore durante l\'aggiornamento del fumetto.');
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
    if (!confirm('Sei sicuro di voler inviare questo fumetto a tutti gli utenti?')) {
      return;
    }
    
    try {
      setIsSending(true);
      setSendingResult(null);
      
      const response = await fetch('/api/send-comic', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comicId: id })
      });
      
      if (!response.ok) {
        throw new Error('Errore nell\'invio del fumetto');
      }
      
      const result = await response.json();
      setSendingResult({
        success: result.successCount,
        error: result.errorCount
      });
      
      // Refresh comics list
      fetchComics();
    } catch (err) {
      setError('Errore durante l\'invio del fumetto.');
    } finally {
      setIsSending(false);
    }
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
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
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
        
        {/* Two-column layout for comic creation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Crea Nuovo Fumetto</h2>
          
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
              <form onSubmit={handleSubmit}>
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
                
                {/* Drag and drop area */}
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
                
                {/* Image list for reordering */}
                {images.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-md font-semibold mb-2">Immagini selezionate ({images.length})</h3>
                    <p className="text-xs text-gray-500 mb-2">Trascina per riordinare</p>
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
                            </div>
                          </div>
                          <div className="flex-shrink-0 space-x-2">
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
                  </div>
                )}
                
                <button
                  type="submit"
                  className="bg-black text-white py-2 px-6 rounded hover:bg-opacity-80 transition-all"
                  disabled={uploading}
                >
                  {uploading ? 'Caricamento in corso...' : 'Pubblica Fumetto'}
                </button>
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
                              disabled={isSending}
                            >
                              {isSending ? 'Invio...' : 'Invia Email'}
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
    </div>
  );
} 