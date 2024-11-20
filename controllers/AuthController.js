import { connectDB } from '../database.js';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

async function authenticateUser(email, password) {
    try {
        // Conectarse a la base de datos
        const { users } = await connectDB();

        // Buscar el usuario por correo electrónico
        const user = await users.findOne({ email });

        // Si el usuario no existe, retorna null
        if (!user) return null;

        // Comparar la contraseña ingresada con la almacenada (hashed) en la base de datos
        const isPasswordValid = await bcrypt.compare(password, user.password);

        // Si la contraseña es incorrecta, retorna null
        if (!isPasswordValid) return null;

        // Retorna el usuario autenticado sin la contraseña
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        console.error("Error al autenticar usuario:", error);
        return null;
    }
}

export const refreshToken = (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) return res.status(401).json({ message: 'Refresh token no proporcionado' });

    // Validar el Refresh Token
    jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Refresh token no válido' });

        // Generar un nuevo Access Token
        const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
        res.json({ accessToken });
    });
};

export const userLogin = async (req, res) => {
    const { email, password } = req.body;

    // Verificar si las credenciales son válidas
    const user = await authenticateUser(email, password);
    if (!user) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar un token JWT con una clave secreta y datos del usuario
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_JWT_SECRET,
        { expiresIn: '7d' }
    )

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.APP_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth/login',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    })

    // Responder con el token y los datos básicos del usuario
    res.status(200).json({
        message: 'Inicio de sesión exitoso',
        token,
        user: { id: user._id, username: user.username, role: user.role, email: user.email }
    });
}

export const getAllProfesional = async (req, res) => {
    try {
        const { users } = await connectDB();
        const allDocuments = await users.find().toArray();
        res.status(200).json({
            pros: allDocuments,
            message: 'Profesionales encontrados'
        });
    } catch (error) {
        console.error('Error al obtener los profesionales:', error);
        res.status(500).json({ error: 'Hubo un error al obtener los documentos' });
    }
}
