import { ObjectId } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../database.js';
import { modifyDocxContent } from '../utils/modifyDocx.js';
import fs from 'node:fs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//const templatePath = path.join(__dirname, '../templates/template.docx');
const templatePath = path.join(__dirname, '../templates/template-converted.docx');

export const processDocument = async (req, res) => {
  const { documento } = req.body;
  const templatePath = path.resolve(__dirname, '../templates/template.docx'); // Ruta al archivo .docx convertido

  //const jsonPath = `public/${documento}.json`
  const { documents } = await connectDB();
  let jsonPath = await documents.findOne({ _id: new ObjectId(documento) });
  const outputPath = path.resolve(__dirname, `../templates/TEA-${documento}.docx`); // Ruta para guardar el documento modificado

  try {
    await modifyDocxContent(templatePath, outputPath, jsonPath);
    // Enviar el archivo modificado al cliente
    res.download(outputPath, `public/TEA-${documento}.docx`);
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).send('Error processing document');
  }
};

export const updateDocument = async (req, res) => {
  const { key, documento, texto, docId } = req.body;

  if (!docId) {
    return res.status(400).json({ error: 'Error al obtener la ID del documento.' });
  }

  //const tipoDocumento = SIGLAS[`${documento}`];
  console.log(`ID documento: ${docId}`);

  try {
    // Conectar a la base de datos
    const { documents } = await connectDB();

    // Buscar el documento en la base de datos usando el docId
    let jsonData = await documents.findOne({ _id: new ObjectId(docId) });
    if (!jsonData) {
      return res.status(404).json({ error: 'Documento no encontrado en la base de datos.' });
    }

    // Verificar que la key exista en jsonData
    if (!jsonData[key]) {
      return res.status(404).json({ error: `La clave ${key} no existe en el documento.` });
    }

    // Actualizar los valores en jsonData
    Object.keys(jsonData[key]).forEach((element) => {
      if (texto[element] !== undefined) {
        jsonData[key][element] = texto[element];
      }
    });

    // Actualizar el documento en la base de datos
    const updatedDocument = {
      ...jsonData,
      updatedAt: new Date()  // Cambiado de createdAt a updatedAt
    };
    const result = await documents.updateOne({ _id: new ObjectId(docId) }, { $set: updatedDocument });

    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: 'No se pudo actualizar el documento en la base de datos.' });
    }

    // Enviar respuesta de éxito
    res.json({ message: 'Documento actualizado' });
  } catch (err) {
    console.error('Error en la actualización del documento:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

export const createDocument = async (req, res) => {
  const { document } = req.body
  const jsonPath = path.resolve(__dirname, `../templates/${document}.json`)

  fs.readFile(jsonPath, 'utf8', async (err, data) => {
      if (err) {
          console.error('Error al leer el archivo JSON:', err);
          return res.status(500).json({ error: 'Error al leer el archivo JSON.' });
      }

      let jsonData = {};
      try {
          jsonData = JSON.parse(data);
          const { documents } = await connectDB();

          jsonData = {
              ...jsonData,
              createdAt: new Date()
          }
          const result = await documents.insertOne(jsonData);
          jsonData._id = result.insertedId;
          res.status(201).json({ message: 'Documento creado', document: jsonData });
      } catch (parseError) {
          console.error('Error al parsear el contenido JSON:', parseError);
          res.status(500).json({ error: 'Hubo un error al insertar el documento' });
      }
  });
}

export const listDocuments = async (req, res) => {
  try {
      const { documents } = await connectDB();
      const allDocuments = await documents.find().toArray();
      res.status(200).json(allDocuments);
  } catch (error) {
      console.error('Error al obtener los documentos:', error);
      res.status(500).json({ error: 'Hubo un error al obtener los documentos.' });
  }
}

export const findDocument = async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID no válido' });
  }

  try {
      const { documents } = await connectDB();
      const document = await documents.findOne({ _id: new ObjectId(id) });

      if (!document) {
          return res.status(404).json({ error: 'Documento no encontrado' });
      }

      res.status(200).json(document);
  } catch (error) {
      console.error('Error al buscar el documento:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export const deleteDocument = async (req, res) => {
  const { id } = req.body;
  const { documents } = await connectDB();

  try {
      const result = await documents.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 1) {
          return res.status(200).json({ message: 'Documento eliminado' })
      } else {
          return res.status(404).json({ message: 'Documento no encontrado' })
      }
  } catch (error) {
      console.error('Error al eliminar el documento', error);
      res.status(500).json({ message: 'Error al eliminar el documento' })
  }
}