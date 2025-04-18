import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

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

// GET /api/admin/users - Recupera gli utenti
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    
    // Recupera tutti gli utenti
    const users = await db.collection('users').find({}).toArray();
    
    // Mappa i risultati per nascondere le informazioni sensibili
    const safeUsers = users.map(user => ({
      _id: user._id.toString(),
      email: user.email,
      nickname: user.nickname || 'Utente',
      isVerified: !!user.isVerified,
      isApproved: !!user.isApproved,
      createdAt: user.createdAt || null
    }));
    
    return NextResponse.json({ 
      success: true, 
      users: safeUsers
    });
  } catch (error) {
    console.error('Errore nel recupero degli utenti:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 