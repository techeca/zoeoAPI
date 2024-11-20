import { connectDB } from "../database.js";
import bcrypt from 'bcrypt'
import { ObjectId } from 'mongodb';

const SALT_ROUNDS = 10; // Número de rondas para hash de la contraseña

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

export const userRegister = async (req, res) => {
    const { email, password, username } = req.body;

    try {
        // Conectarse a la base de datos
        const { users } = await connectDB();

        // Verificar si el usuario ya existe por correo electrónico
        const existingUser = await users.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
        }

        // Generar hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Crear el nuevo usuario
        const newUser = {
            email,
            username,
            role: 'Profesional',
            password: hashedPassword, // Guardar la contraseña hasheada
            createdAt: new Date()
        };

        // Insertar el usuario en la base de datos
        const result = await users.insertOne(newUser);

        // Responder con los datos del nuevo usuario (sin la contraseña)
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: { id: result.insertedId, email: newUser.email, username: newUser.username, role: newUser.role }
        });
    } catch (error) {
        console.error("Error al registrar el usuario:", error);
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
}

export const userDelete = async (req, res) => {
    const { id } = req.body;
    const { users } = await connectDB();
  
    try {
        const result = await users.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 1) {
            return res.status(200).json({ message: 'Usuario eliminado' })
        } else {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }
    } catch (error) {
        console.error('Error al eliminar el usuario', error);
        res.status(500).json({ message: 'Error al eliminar el usuario' })
    }
  }