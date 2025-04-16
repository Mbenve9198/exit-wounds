import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = "mongodb+srv://marco:xlnhOlTFYwhPICkK@exit-wounds.2otjbuu.mongodb.net/?retryWrites=true&w=majority&appName=exit-wounds";

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
    throw error;
  }
}

export async function getDatabase() {
  const client = await connectToDatabase();
  return client.db("exit-wounds");
} 