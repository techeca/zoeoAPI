import express from 'express';
import cors from 'cors';
import documentRouter from './routes/DocumentRoute.js';
import routerAuth from './routes/AuthRoute.js'
import routerAdmin from './routes/AdminRoute.js';
import { createServer } from 'http';
import { Server } from 'socket.io'
//import bodyParser from 'body-parser';
import { connectDB } from './database.js';
import { ObjectId } from 'mongodb';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

function setupMiddleware() {
    app.use(express.json());
    app.use(cors())
}

function setupRoutes() {
    app.use('/api', documentRouter);
    app.use('/api/auth', routerAuth);
    app.use('/api/admin', routerAdmin);
}

export async function startServer(PORT) {
    const { documents } = await connectDB();

    setupMiddleware()
    setupRoutes()

    io.on('connection', (socket) => {
        console.log(`Usuario conectado ${socket.id}`);

        socket.on('join', async (docId) => {
            console.log(`Usuario ${socket.id} unido al documento: ${docId}`);
            // Unirse al room del documento
            socket.join(docId);
            const document = await documents.findOne({ _id: new ObjectId(docId) });
            //console.log(document);
            socket.emit('init', document);
        });

        socket.on('edit', async ({ documentSelected, key, texto, user, inputSelected }) => {
            console.log('Usuario conectado edit');
            let document = await documents.findOne({ _id: new ObjectId(documentSelected) });

            // Actualizar los valores
            Object.keys(document[key]).forEach((element) => {
                if (texto[element] !== undefined) {
                    document[key][element] = texto[element];
                }
            });

            // Actualizar el documento en la base de datos
            const updatedDocument = {
                ...document,
                updatedAt: new Date()  // Cambiado de createdAt a updatedAt
            };
            await documents.updateOne({ _id: new ObjectId(documentSelected) }, { $set: updatedDocument });
            const data = { updatedDocument, otherUser: user, inputSelected }
            socket.to(documentSelected).emit('update', data);
        });
    })

    httpServer.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
