import express from 'express';
import { getAllProfesional, refreshToken, userLogin } from '../controllers/AuthController.js'
import { authenticateToken } from '../middlewares/jwt.js';

const routerAuth = express.Router();

routerAuth.post('/login', userLogin);
//routerAuth.post('/register', userRegister);
routerAuth.get('/allProfesional', authenticateToken, getAllProfesional)
routerAuth.post('/token', refreshToken)

export default routerAuth