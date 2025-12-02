import { MongoClient, Db } from 'mongodb';

class DatabaseService {
	private client: MongoClient;
	private db: Db | null = null;

	constructor() {
		// Get MongoDB connection details from environment variables
		const username = process.env.MONGO_USERNAME || 'root';
		const password = process.env.MONGO_PASSWORD || 'root';
		const host = process.env.MONGO_HOST || 'localhost';
		const port = process.env.MONGO_PORT || '27017';
		const dbName = process.env.MONGO_DB || 'myapp';
		const auth = process.env.MONGO_AUTH || dbName;

		// Construct the MongoDB URI
		let uri: string;

		if (username && password) {
			// URI with authentication
			uri = `mongodb://${username}:${password}@${host}:${port}/${dbName}?directConnection=true&authSource=${auth}`;
		} else {
			// URI without authentication
			uri = `mongodb://${host}:${port}/${dbName}?directConnection=true&authSource=${auth}`;
		}

		// Create MongoDB client
		this.client = new MongoClient(uri);

		console.log(`Configured MongoDB connection to ${host}:${port}/${dbName}`);
	}

	async connect(): Promise<Db> {
		if (this.db) return this.db;

		try {
			await this.client.connect();
			const dbName = process.env.MONGO_DB || 'myapp';
			this.db = this.client.db(dbName);
			console.log(`Connected to MongoDB database: ${dbName}`);
			return this.db;
		} catch (error) {
			console.error('Failed to connect to MongoDB', error);
			throw error;
		}
	}

	async disconnect(): Promise<void> {
		if (this.client) {
			await this.client.close();
			this.db = null;
			console.log('Disconnected from MongoDB');
		}
	}

	async getDb(): Promise<Db> {
		if (!this.db) {
			// Automatically connect if not already connected
			return await this.connect();
		}
		return this.db;
	}

	async getClient(): Promise<MongoClient> {
		return this.client;
	}
}

// Singleton instance
export const database = new DatabaseService();
// default export
export default database;
