import express from 'express';
import documentRouter from './routes/DocumentRoute.js';
import cors from 'cors';
import routerAuth from './routes/AuthRoute.js'
import routerAdmin from './routes/AdminRoute.js';
//import bodyParser from 'body-parser';

const app = express();
//const port = process.env.API_PORT;

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

function setupMiddleware(){
    app.use(express.json());
    app.use(cors())
}

function setupRoutes(){
    app.use('/api', documentRouter);
    app.use('/api/auth', routerAuth);
    app.use('/api/admin', routerAdmin);
}

export function startServer(PORT){
    setupMiddleware()
    setupRoutes()
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
}
