import 'dotenv/config';
import { Collection, MongoClient } from "mongodb"

//const API_PORT = process.env.API_PORT
const USER_MONGODB = process.env.USER_MONGODB
const PASSWORD_MONGODB = process.env.PASSWORD_MONGODB
const HOST_MONGODB = process.env.HOST_MONGODB
const DBNAME_MONGODB = process.env.DBNAME_MONGODB

const URI_MONGODB = `mongodb+srv://${USER_MONGODB}:${PASSWORD_MONGODB}@${HOST_MONGODB}/${DBNAME_MONGODB}?retryWrites=true&w=majority`
const client = new MongoClient(URI_MONGODB)
let dbInstance = null;

export async function connectDB(){
    if (dbInstance) return dbInstance; // Reutilizar la conexión existente si ya fue establecida.
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const database = client.db(DBNAME_MONGODB)
        const documents = database.collection('documents')
        const users = database.collection('users')
        dbInstance = { database, documents, users };
        return dbInstance;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

// Cerrar la conexión cuando el proceso se interrumpe
process.on('SIGINT', async () => {
    try {
        await client.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        process.exit(1);
    }
});