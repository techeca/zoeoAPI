import jwt from 'jsonwebtoken'

const SECRET_T = process.env.JWT_SECRET

// Middleware de autenticación
export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer token"

    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    jwt.verify(token, SECRET_T, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                // Token expirado, permitir continuar para que el cliente lo maneje
                return next();
            }
            return res.status(403).json({ message: 'Token no válido' });
        }
        req.user = user; // Guarda el usuario decodificado en `req.user`
        next();
    });
}

export function authenticateAdminToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer token"

    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    jwt.verify(token, SECRET_T, (err, user) => {
        console.log(user);
        if (err) {
            return res.status(403).json({ message: 'Token no válido' });
        }

        if(user.role !== 'Administrador'){
            return res.status(403).json({ message: 'Token no válido' });
        }
        
        req.user = user; // Guarda el usuario decodificado en `req.user`
        next();
    });
}