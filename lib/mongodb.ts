import { MongoClient, ServerApiVersion } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let cachedClient: MongoClient | null = null;

export async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connesso con successo a MongoDB!");
    cachedClient = client;
    return client;
  } catch (error) {
    console.error("Errore nella connessione a MongoDB:", error);
    throw new Error(`Errore nella connessione al database: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
  }
}

export async function getDatabase() {
  const client = await connectToDatabase();
  return client.db(process.env.MONGODB_DB || 'exit-wounds');
} 