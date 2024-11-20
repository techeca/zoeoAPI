import express from 'express';
import { getAllProfesional, userDelete, userRegister } from '../controllers/AdminController.js';
import { authenticateAdminToken, authenticateToken } from '../middlewares/jwt.js';

const routerAdmin = express.Router();

//routerAdmin.get('/allProfesional', authenticateToken, getAllProfesional)
routerAdmin.post('/registerProfesional', authenticateAdminToken, userRegister)
routerAdmin.delete('/deleteProfesional', authenticateAdminToken, userDelete)

export default routerAdmin