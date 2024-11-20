import express from 'express';
import { processDocument, updateDocument, createDocument, listDocuments, findDocument, deleteDocument } from '../controllers/DocumentController.js';
import { authenticateToken } from '../middlewares/jwt.js';

const documentRouter = express.Router();

documentRouter.post('/process-document', authenticateToken, processDocument);

documentRouter.post('/update-document', authenticateToken, updateDocument);

documentRouter.post('/create-document', authenticateToken, createDocument);

documentRouter.get('/list-documents', authenticateToken, listDocuments)

documentRouter.get('/document/:id', authenticateToken, findDocument)

documentRouter.delete('/delete-document', authenticateToken, deleteDocument)

export default documentRouter;
