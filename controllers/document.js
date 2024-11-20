import { ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs/promises'; // Usar promesas para operaciones de archivo
import { modifyDocxContent } from '../utils/modifyDocx.js';
import { connectDB } from '../database.js';

// Directorio donde se almacenan las plantillas y documentos
const jsonDirectory = 'public';

export const processDocument = async (req, res) => {
    const { documento } = req.body;

    if (!documento) {
        return res.status(400).json({ error: 'El campo "documento" es obligatorio.' });
    }

    try {
        const db = await connectDB();
        const collection = db.collection('documents');

        // Buscar el documento en la base de datos usando su ID
        const documentData = await collection.findOne({ _id: new ObjectId(documento) });

        if (!documentData) {
            return res.status(404).json({ error: 'Documento no encontrado.' });
        }

        const templatePath = 'public/template.docx'; // Ruta a la plantilla .docx
        const outputPath = `public/modified-template-${documento}.docx`; // Ruta para guardar el documento modificado

        // Modificar el contenido del documento .docx usando los datos del documento en MongoDB
        await modifyDocxContent(templatePath, outputPath, documentData.data);

        // Enviar el archivo modificado al cliente
        res.download(outputPath, `modified-template-${documento}.docx`, async (err) => {
            if (err) {
                console.error('Error enviando el archivo:', err);
                res.status(500).send('Error enviando el documento modificado.');
            } else {
                // Opcional: Eliminar el archivo generado después de enviarlo
                try {
                    await fs.unlink(outputPath);
                } catch (unlinkError) {
                    console.error('Error eliminando el archivo generado:', unlinkError);
                }
            }
        });
    } catch (error) {
        console.error('Error procesando el documento:', error);
        res.status(500).send('Error procesando el documento.');
    }
};

export const updateDocument = async (req, res) => {
    const { key, texto, docId } = req.body;

    if (!docId) {
        return res.status(400).json({ error: 'La ID del documento es obligatoria.' });
    }

    if (!key || typeof key !== 'string') {
        return res.status(400).json({ error: 'El campo "key" es obligatorio y debe ser una cadena de texto.' });
    }

    if (!texto || typeof texto !== 'object') {
        return res.status(400).json({ error: 'El campo "texto" es obligatorio y debe ser un objeto.' });
    }

    try {
        const db = await connectDB();
        const collection = db.collection('documents');

        // Preparar los campos a actualizar
        const updateFields = {};
        Object.keys(texto).forEach((field) => {
            updateFields[`data.${key}.${field}`] = texto[field];
        });

        const result = await collection.updateOne(
            { _id: new ObjectId(docId) },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Documento no encontrado.' });
        }

        res.json({ message: 'Documento actualizado correctamente en la base de datos.' });
    } catch (error) {
        console.error('Error actualizando el documento en MongoDB:', error);
        res.status(500).json({ error: 'Error actualizando el documento en la base de datos.' });
    }
};

export const createDocument = async (req, res) => {
    const { data } = req.body;

    if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: 'El campo "data" es obligatorio y debe ser un objeto.' });
    }

    try {
        const db = await connectDB();
        const collection = db.collection('documents');

        const result = await collection.insertOne({ data });
        res.status(201).json({ message: 'Documento creado correctamente.', docId: result.insertedId });
    } catch (error) {
        console.error('Error creando el documento en MongoDB:', error);
        res.status(500).json({ error: 'Error creando el documento en la base de datos.' });
    }
};
