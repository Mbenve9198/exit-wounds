/**
 * Utility per caricare file di grandi dimensioni suddividendoli in chunk
 */

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunk

/**
 * Carica un file di grandi dimensioni suddividendolo in chunk
 * @param file File da caricare
 * @param apiKey API key per l'autenticazione
 * @param onProgress Callback per monitorare il progresso
 * @returns Promise con il risultato dell'upload
 */
export async function uploadLargeFile(
  file: File, 
  apiKey: string, 
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; filePath?: string; fileName?: string; error?: string }> {
  try {
    // Usa un approccio a stream quando possibile
    if (typeof ReadableStream !== 'undefined' && file.stream) {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream',
        },
        body: file.stream(),
      });
      
      return await response.json();
    }
    
    // Fallback a un approccio a chunk se lo streaming non è supportato
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const tempFilePath = `/api/admin/upload/temp/${Date.now()}`;
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('index', chunkIndex.toString());
      formData.append('total', totalChunks.toString());
      formData.append('filename', file.name);
      formData.append('tempPath', tempFilePath);
      
      const response = await fetch('/api/admin/upload/chunk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore nel caricamento del chunk');
      }
      
      // Aggiorna il progresso
      if (onProgress) {
        onProgress(Math.round(((chunkIndex + 1) / totalChunks) * 100));
      }
    }
    
    // Finalizza l'upload
    const finalizeResponse = await fetch('/api/admin/upload/finalize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tempPath: tempFilePath,
        fileName: file.name,
      }),
    });
    
    return await finalizeResponse.json();
  } catch (error) {
    console.error('Errore nell\'upload del file:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Errore sconosciuto durante l\'upload' 
    };
  }
} 