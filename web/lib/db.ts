import { MongoClient, Db } from 'mongodb'

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

let clientPromise: Promise<MongoClient> | undefined

// Lazily created on first real use (not at module-load) so `next build`'s page-data
// collection — which imports every route module — doesn't require real credentials.
function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGO_URL
  if (!uri) throw new Error('MONGO_URL is not set')

  if (process.env.NODE_ENV === 'development') {
    // Cached across hot reloads in dev so we don't open a new connection per edit.
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect()
    }
    return global._mongoClientPromise
  }

  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect()
  }
  return clientPromise
}

export async function getDb(): Promise<Db> {
  const dbName = process.env.DB_NAME
  if (!dbName) throw new Error('DB_NAME is not set')

  const client = await getClientPromise()
  return client.db(dbName)
}
