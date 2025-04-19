'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Comic } from '@/lib/models/Comic';
import { ObjectId } from 'mongodb';

interface EmailEditorProps {
  params: {
    id: string;
  };
}

// Definizione dei tipi di destinatari
type RecipientType = 'all' | 'specific' | 'audience';

interface User {
  _id: string;
  email: string;
  nickname: string;
  isVerified: boolean;
  isApproved: boolean;
}

export default function EmailEditor({ params }: EmailEditorProps) {
  const { id } = params;
  const router = useRouter();

  const [comic, setComic] = useState<Comic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Contenuto email
  const [emailSubject, setEmailSubject] = useState('');
  const [textBefore, setTextBefore] = useState('');
  const [textAfter, setTextAfter] = useState('');
  const [showTitle, setShowTitle] = useState(true);
  
  // Gestione dei destinatari
  const [recipientType, setRecipientType] = useState<RecipientType>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showRecipientSelection, setShowRecipientSelection] = useState(false);
  
  // Dati risultato invio
  const [sendingResult, setSendingResult] = useState<{success?: number, error?: number} | null>(null);

  useEffect(() => {
    // Recupera API key dal localStorage
    const savedApiKey = localStorage.getItem('adminApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      
      // Carica il fumetto
      fetchComic(savedApiKey);
      // Carica gli utenti
      fetchUsers(savedApiKey);
    } else {
      setError('API Key non trovata. Torna alla pagina di amministrazione.');
      setLoading(false);
    }
  }, [id]);

  const fetchComic = async (key: string) => {
    try {
      setLoading(true);
      console.log('Recupero fumetto con ID:', id);
      
      // Recupera il fumetto dall'API
      const response = await fetch(`/api/admin/comics?id=${id}`, {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Risposta API errore:', errorData);
        throw new Error(errorData.error || 'Errore nel recupero del fumetto');
      }
      
      const data = await response.json();
      console.log('Risposta API fumetto:', data);
      
      if (data.comic) {
        setComic(data.comic);
        
        // Imposta il soggetto dell'email con il titolo del fumetto
        setEmailSubject(`Exit Wounds - ${data.comic.title}`);
        
        // Imposta testo predefinito prima e dopo
        setTextBefore(`Ciao {{nickname}},\n\nEcco il nuovo fumetto della tua serie preferita di fallimenti imprenditoriali e traumi da startup!`);
        setTextAfter(`Ti è piaciuto? Fammi sapere cosa ne pensi rispondendo direttamente a questa email.\n\nRicorda che puoi anche condividere questo contenuto con altri founder traumatizzati - la miseria ama compagnia.`);
      } else {
        console.error('Struttura risposta API:', data);
        throw new Error('Fumetto non trovato nella risposta API');
      }
    } catch (err) {
      console.error('Errore completo durante il recupero del fumetto:', err);
      setError(`Errore nel caricamento del fumetto: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (key: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Errore nel recupero degli utenti');
      }
      
      const data = await response.json();
      
      if (data.users && Array.isArray(data.users)) {
        // Filtra solo gli utenti verificati e approvati
        const verifiedUsers = data.users.filter((user: User) => user.isVerified && user.isApproved);
        setUsers(verifiedUsers);
      } else {
        console.error('Risposta API non valida:', data);
      }
    } catch (err) {
      console.error('Errore durante il recupero degli utenti:', err);
    }
  };

  const handleProceedToRecipients = () => {
    // Prima di procedere alla selezione dei destinatari, validiamo l'email
    if (!emailSubject.trim()) {
      setError('L\'oggetto dell\'email è obbligatorio');
      return;
    }
    
    setShowRecipientSelection(true);
  };

  const handleBackToEditor = () => {
    setShowRecipientSelection(false);
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      // Se l'utente è già selezionato, lo rimuoviamo
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      // Altrimenti lo aggiungiamo
      return [...prev, userId];
    });
  };
  
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      // Se tutti gli utenti sono già selezionati, deselezioniamo tutti
      setSelectedUsers([]);
    } else {
      // Altrimenti, selezioniamo tutti
      setSelectedUsers(users.map(user => user._id));
    }
  };

  const handleSendEmail = async () => {
    if (!comic) return;
    
    if (!confirm('Sei sicuro di voler inviare questo fumetto?')) {
      return;
    }
    
    try {
      setSending(true);
      setSendingResult(null);
      
      const response = await fetch('/api/send-comic', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          comicId: id,
          emailSubject,
          textBefore,
          textAfter,
          showTitle,
          recipientType,
          selectedUsers: recipientType === 'specific' ? selectedUsers : [],
          audienceId: recipientType === 'audience' ? '2ae0ef0c-c5d8-45db-a3cb-6f4032647ec9' : null
        })
      });
      
      if (!response.ok) {
        throw new Error('Errore nell\'invio del fumetto');
      }
      
      const result = await response.json();
      setSendingResult({
        success: result.successCount,
        error: result.errorCount
      });
      
      setSuccessMessage(`Fumetto inviato con successo a ${result.successCount} utenti!`);
      
      // Torna alla pagina admin dopo 3 secondi
      setTimeout(() => {
        router.push('/admin');
      }, 3000);
      
    } catch (err) {
      console.error('Errore durante l\'invio del fumetto:', err);
      setError('Errore durante l\'invio del fumetto.');
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    router.push('/admin');
  };

  // Converti il testo con \n in paragrafi HTML e sostituisci i placeholder
  const formatTextToParagraphs = (text: string) => {
    // Sostituisci i placeholder
    const processed = text.replace(/\{\{nickname\}\}/g, "Nome Utente");
    
    return processed.split('\n').map((paragraph, index) => (
      paragraph ? <p key={index} style={{marginBottom: '8px'}}>{paragraph}</p> : <br key={index} />
    ));
  };

  // Questa nuova funzione renderà l'anteprima più simile all'email reale
  const renderEmailPreview = () => {
    if (!comic) return null;

    // Ordina le immagini per il campo order
    const orderedImages = [...comic.images].sort((a, b) => a.order - b.order);

    // Base URL per le immagini statiche
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

    return (
      <div className="bg-white h-full overflow-y-auto" style={{
        fontFamily: 'Helvetica Neue, Arial, sans-serif', 
        lineHeight: 1.4, 
        color: '#333',
        backgroundColor: '#f9f9f9', 
        height: '100%'
      }}>
        {/* Container principale con bordo e ombra come nell'email reale */}
        <div style={{
          maxWidth: '100%',
          margin: '0 5px',
          padding: '15px 10px',
          backgroundColor: '#ffffff',
          border: '2px solid #000',
          borderRadius: '15px',
          boxShadow: '4px 4px 0px #000'
        }}>
          {/* Header con bordo e immagine */}
          <div style={{
            textAlign: 'center',
            marginBottom: '20px',
            paddingBottom: '15px',
          }}>
            {/* Utilizziamo l'immagine dell'header come nell'email reale */}
            <div style={{
              marginBottom: '15px'
            }}>
              <img src="/images/header_comics.png" alt="Exit Wounds" style={{
                maxWidth: '100%',
                height: 'auto',
                margin: '0 auto'
              }} />
            </div>
            
            {showTitle && (
              <h2 style={{
                color: '#000',
                fontSize: '18px',
                marginBottom: '15px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                textAlign: 'center'
              }}>
                {comic.title}
              </h2>
            )}
          </div>
          
          {/* Testo prima delle immagini */}
          <div style={{padding: '0'}}>
            {formatTextToParagraphs(textBefore)}
          </div>
          
          {/* Immagini del fumetto */}
          <div style={{margin: 0, padding: 0, width: '100%'}}>
            {orderedImages.map((image, index) => (
              <div key={index} style={{margin: 0, padding: 0, width: '100%'}}>
                <img 
                  src={image.url} 
                  alt={`Immagine ${index + 1}`}
                  style={{
                    maxWidth: '100%',
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    margin: 0,
                    padding: 0,
                    border: 'none'
                  }}
                />
              </div>
            ))}
          </div>
          
          {/* Testo dopo le immagini */}
          <div style={{padding: '0'}}>
            {formatTextToParagraphs(textAfter)}
          </div>
          
          {/* Footer */}
          <div style={{
            marginTop: '20px',
            paddingTop: '15px',
            borderTop: '1px solid #eee',
            textAlign: 'center',
            fontSize: '14px'
          }}>
            <div style={{
              fontStyle: 'italic',
              marginTop: '10px',
              fontWeight: 600,
              fontSize: '13px'
            }}>
              Still somewhat breathing,<br /><br />
              Marco<br />
              Ex-founder, Eternal White Belt & Accidental AI Wrangler
            </div>
            
            <div style={{
              marginTop: '15px',
              fontSize: '12px',
              color: '#777',
              textAlign: 'center'
            }}>
              <p><small>©2025 Exit Wounds | <a href="#" style={{color: '#555', textDecoration: 'underline'}}>Unsubscribe</a></small></p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold">Caricamento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-md">
          <p>{error}</p>
          <button 
            onClick={handleBack}
            className="mt-4 bg-black text-white py-2 px-4 rounded hover:bg-opacity-80 transition-all"
          >
            Torna alla dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!comic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 max-w-md">
          <p>Fumetto non trovato</p>
          <button 
            onClick={handleBack}
            className="mt-4 bg-black text-white py-2 px-4 rounded hover:bg-opacity-80 transition-all"
          >
            Torna alla dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Editor Email</h1>
            <p className="text-gray-600">{comic.title}</p>
          </div>
          <button 
            onClick={handleBack}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-all"
          >
            Torna alla dashboard
          </button>
        </div>
        
        {successMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            <p>{successMessage}</p>
          </div>
        )}
        
        {sendingResult && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
            <p>Risultato invio: {sendingResult.success} successi, {sendingResult.error} errori</p>
          </div>
        )}
        
        {!showRecipientSelection ? (
          // Step 1: Editor del contenuto email
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Colonna editor */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Editor</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="subject">
                  Oggetto Email
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showTitle}
                    onChange={(e) => setShowTitle(e.target.checked)}
                    className="h-4 w-4 text-black border-gray-300 rounded"
                  />
                  <span className="text-gray-700">Mostra titolo del fumetto nell'email</span>
                </label>
              </div>
              
              <div className="mb-2 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                <p className="text-sm text-gray-700 mb-1 font-medium">Campi dinamici disponibili:</p>
                <div className="flex flex-wrap gap-2">
                  <button 
                    className="text-xs bg-yellow-200 hover:bg-yellow-300 text-black font-medium py-1 px-2 rounded border border-yellow-300"
                    onClick={() => {
                      // Inserisce il campo per il nickname nel punto in cui si trova il cursore nell'ultimo campo di testo selezionato
                      const activeElement = document.activeElement as HTMLTextAreaElement;
                      if (activeElement && (activeElement.id === 'textBefore' || activeElement.id === 'textAfter')) {
                        const cursorPosition = activeElement.selectionStart || 0;
                        const currentValue = activeElement.id === 'textBefore' ? textBefore : textAfter;
                        const newValue = currentValue.substring(0, cursorPosition) + 
                                        '{{nickname}}' + 
                                        currentValue.substring(cursorPosition);
                        
                        if (activeElement.id === 'textBefore') {
                          setTextBefore(newValue);
                        } else {
                          setTextAfter(newValue);
                        }
                        
                        // Imposta il focus di nuovo sull'elemento dopo l'aggiornamento
                        setTimeout(() => {
                          activeElement.focus();
                          activeElement.setSelectionRange(cursorPosition + 12, cursorPosition + 12);
                        }, 10);
                      } else {
                        // Se nessun campo di testo è attivo, aggiungiamo il tag al campo "Testo Prima delle Immagini"
                        setTextBefore(textBefore + '{{nickname}}');
                        // Focalizziamo il campo di testo
                        const textBeforeElement = document.getElementById('textBefore') as HTMLTextAreaElement;
                        if (textBeforeElement) {
                          setTimeout(() => {
                            textBeforeElement.focus();
                            textBeforeElement.setSelectionRange(textBefore.length + 12, textBefore.length + 12);
                          }, 10);
                        }
                      }
                    }}
                  >
                    {'Inserisci {{nickname}}'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{'Clicca sul pulsante per inserire il campo nel testo. Il campo {{nickname}} verrà sostituito con il nome di ogni utente.'}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="textBefore">
                  Testo Prima delle Immagini
                </label>
                <textarea
                  id="textBefore"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={5}
                  value={textBefore}
                  onChange={(e) => setTextBefore(e.target.value)}
                />
              </div>
              
              {/* Anteprima immagini in modalità compatta */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Immagini del Fumetto
                </label>
                <div className="border border-gray-200 rounded p-3 bg-gray-50">
                  <div className="grid grid-cols-3 gap-2">
                    {comic.images
                      .sort((a, b) => a.order - b.order)
                      .map((image, index) => (
                        <div key={index} className="border rounded overflow-hidden">
                          <img src={image.url} alt={`Immagine ${index + 1}`} className="w-full h-auto" />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2" htmlFor="textAfter">
                  Testo Dopo le Immagini
                </label>
                <textarea
                  id="textAfter"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={5}
                  value={textAfter}
                  onChange={(e) => setTextAfter(e.target.value)}
                />
              </div>
              
              <button
                onClick={handleProceedToRecipients}
                className="bg-black text-white py-2 px-6 rounded hover:bg-opacity-80 transition-all"
              >
                Procedi alla selezione dei destinatari
              </button>
            </div>
            
            {/* Colonna anteprima */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Anteprima Email</h2>
              
              <div className="mx-auto w-[320px] h-[600px] border-8 border-black rounded-[36px] overflow-hidden shadow-lg relative">
                {/* Phone frame details */}
                <div className="absolute top-0 inset-x-0 h-6 bg-black z-10"></div>
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-black rounded-b-lg z-20"></div>
                
                {/* Mobile screen - Sostituiamo con il nuovo rendering */}
                <div className="w-full h-full bg-white overflow-y-auto pt-6">
                  {renderEmailPreview()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Step 2: Selezione dei destinatari
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Seleziona i destinatari</h2>
            
            <div className="mb-6">
              <div className="flex flex-col space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={recipientType === 'all'}
                    onChange={() => setRecipientType('all')}
                    className="h-4 w-4 text-black"
                  />
                  <span>Tutti gli utenti registrati ({users.length})</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={recipientType === 'audience'}
                    onChange={() => setRecipientType('audience')}
                    className="h-4 w-4 text-black"
                  />
                  <span>Tutti gli utenti nell'audience Resend (ID: 2ae0ef0c-c5d8-45db-a3cb-6f4032647ec9)</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={recipientType === 'specific'}
                    onChange={() => setRecipientType('specific')}
                    className="h-4 w-4 text-black"
                  />
                  <span>Utenti specifici</span>
                </label>
              </div>
            </div>
            
            {/* Mostra la selezione degli utenti solo se recipientType è 'specific' */}
            {recipientType === 'specific' && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Seleziona utenti specifici</h3>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {selectedUsers.length === users.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
                  </button>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Seleziona
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nickname
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                          <tr 
                            key={user._id}
                            className={selectedUsers.includes(user._id) ? 'bg-blue-50' : ''}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user._id)}
                                onChange={() => handleUserSelection(user._id)}
                                className="h-4 w-4 text-black border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.nickname}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.email}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mt-3 text-sm text-gray-600">
                  {selectedUsers.length} utenti selezionati
                </div>
              </div>
            )}
            
            <div className="flex space-x-4">
              <button
                onClick={handleBackToEditor}
                className="bg-gray-500 text-white py-2 px-6 rounded hover:bg-gray-600 transition-all"
              >
                Indietro
              </button>
              
              <button
                onClick={handleSendEmail}
                className="bg-black text-white py-2 px-6 rounded hover:bg-opacity-80 transition-all"
                disabled={sending || (recipientType === 'specific' && selectedUsers.length === 0)}
              >
                {sending ? 'Invio in corso...' : 'Invia Fumetto via Email'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}