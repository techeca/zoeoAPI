import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import JSZip from 'jszip'
import Docxtemplater from 'docxtemplater';
import { DOMParser, XMLSerializer } from 'xmldom';

// Función para extraer y analizar los checkboxes del documento
function extractCheckboxes(docXml, jsonPath) {
  try {
    const doc = new DOMParser().parseFromString(docXml, 'text/xml');
    const serializer = new XMLSerializer();
    const checkboxData = [];

    // Buscar elementos de checkbox por <w:ffData>
    const ffDataElements = doc.getElementsByTagName('w:ffData');
    for (let i = 0; i < ffDataElements.length; i++) {
      const nameElement = ffDataElements[i].getElementsByTagName('w:name')[0];
      const checkboxElement = ffDataElements[i].getElementsByTagName('w:checkBox')[0];

      if (nameElement && checkboxElement) {
        const checkboxName = nameElement.getAttribute('w:val');
        const checkedElement = checkboxElement.getElementsByTagName('w:checked')[0];
        let checkboxState = checkedElement.getAttribute('w:val');

        // Modificar el atributo w:val //0:desactivado //1:activado
        //4 - 10
        if(i >= 4 && i <= 10){
          if(!jsonPath.datosIdentificacion[`${i}`]){
            checkedElement.setAttribute('w:val', '0');   
          }else{
            checkedElement.setAttribute('w:val', '1'); 
          }
        }

        if(i >= 42 && i <= 44){
          if(!jsonPath.diagnostico[`${i}`]){
            checkedElement.setAttribute('w:val', '0');   
          }else{
            checkedElement.setAttribute('w:val', '1'); 
          }
        }

        if(i >= 51 && i <= 63){
          if(!jsonPath.documentos[`${i}`]){
            checkedElement.setAttribute('w:val', '0');   
          }else{
            checkedElement.setAttribute('w:val', '1'); 
          }
        }

        if(i >= 67 && i <= 121){
          if(!jsonPath.revaluacion[`${i}`]){
            checkedElement.setAttribute('w:val', '0');   
          }else{
            checkedElement.setAttribute('w:val', '1'); 
          }
        }

        if(i >= 127 && i <= 148){
          if(!jsonPath.evaluacionApoyos[`${i}`]){
            checkedElement.setAttribute('w:val', '0');   
          }else{
            checkedElement.setAttribute('w:val', '1'); 
          }
        }

        // Actualizar el estado después de la modificación
        checkboxState = checkedElement.getAttribute('w:val');

        checkboxData.push({
          id: i,  // Identificador único basado en el índice
          nombreCB: checkboxName,
          estado: checkboxState,
        });
      }
    }
    
    //Imprime todos los id de los checkbox
    //checkboxData.map(cb => console.log(cb.id))
    
    // Convertir el documento modificado de vuelta a XML
    const modifiedXml = serializer.serializeToString(doc);
    return { checkboxData, modifiedXml };

  } catch (error) {
    console.error('Error extrayendo y modificando checkboxes:', error);
    throw error;
  }
}

export const modifyDocxContent = async (templatePath, outputPath, jsonPath) => {
  try {
    // Verificar si el archivo de plantilla existe
    if (!fs.existsSync(templatePath)) {
      console.error(`El archivo ${templatePath} no existe.`);
      return;
    }

    // Leer el contenido del archivo .docx como binario
    const content = fs.readFileSync(templatePath, 'binary');

    // Leer el contenido del archivo JSON
    const jsonContent = jsonPath;

    // Cargar el contenido del archivo .docx con JSZip para modificar los checkboxes
    const zip1 = new JSZip();
    const zipContent = await zip1.loadAsync(content, { binary: true })

    const docXml = await zipContent.file('word/document.xml').async('text')
    const { checkboxData, modifiedXml } = extractCheckboxes(docXml, jsonPath);

    if (!modifiedXml) {
      console.error('Error al obtener el XML modificado.');
      return;
    }

    // Actualizar el contenido del archivo .docx con el XML modificado
    zipContent.file('word/document.xml', modifiedXml);

    // Generar el nuevo contenido del archivo .docx modificado
    const updatedContent = await zipContent.generateAsync({ type: 'nodebuffer' });

    // Guardar el documento .docx modificado
    fs.writeFileSync(outputPath, updatedContent);

    //console.log(checkboxData);
    console.log(`Archivo con checkboxes modificados guardado en: ${outputPath}`);

    const outcontent = fs.readFileSync(outputPath, 'binary');
    const zip = new PizZip(outcontent);
    // Inicializar Docxtemplater con la plantilla
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Renderizar datos en la plantilla
    const datosIdentificacion = jsonContent.datosIdentificacion
    const profesional = jsonContent.profesional
    const diagnostico = jsonContent.diagnostico
    const documentos = jsonContent.documentos
    const revaluacion = jsonContent.revaluacion
    const evaluacionApoyos = jsonContent.evaluacionApoyos

    // Setear los datos para el template
    doc.render({
      //datosIdentificacion
      NOMBRECOMPLETOESTUDIANTE: datosIdentificacion.nombreCompleto,
      fnest: datosIdentificacion.fechaNacimiento,
      EDADEST: datosIdentificacion.edad,
      runest: datosIdentificacion.RUN,
      cursoest: datosIdentificacion.curso,
      ESTABLECIMIENTOEST: datosIdentificacion.establecimiento,
      rbd: datosIdentificacion.RBD,
      nombreDirector: datosIdentificacion.nombreDirector,
      OTRAOE: datosIdentificacion.OEotra,
      VOTRA: datosIdentificacion.VCotra,

      NOMBREPROFESIONAL: profesional.nombreProfesional,
      rutpro: profesional.RUT,
      Profesionpro: profesional.profesionpro,
      Cargopro: profesional.cargo,
      fonopro: profesional.fono,
      emailpro: profesional.email,
      fechapro: profesional.fecha,

      DiagnosticoObservaciones: diagnostico.observaciones,
      fechaEmi: diagnostico.fechaEmision,
      indModDiag: diagnostico.indicacionesModificacionesDiagnostico,
      proNuevoDiag: diagnostico.proNuevoDiag,

      nroDocs: documentos.numeroDocumento,
      otroDocEspec: documentos.otrosEspecificar,
      EMEsp: documentos.EMEsp,

      DescIntSoc: revaluacion.ISprogresos,
      EnfaIntSoc: revaluacion.ISaspectosEnfasis,
      obsIS: revaluacion.IStxtObsContextoEscolar,
      appIS: revaluacion.IStxtAplicacionInstrumento,

      DescLengCom: revaluacion.LCprogresos,
      EnfaLengCom: revaluacion.LCaspectosEnfasis,
      obsLC: revaluacion.LCtxtObsContextoEscolar,
      appLC: revaluacion.LCtxtAplicacionInstrumento,

      DescCog: revaluacion.Cprogresos,
      EnfaCog: revaluacion.CaspectosEnfasis,
      obsC: revaluacion.CtxtObsContextoEscolar,
      appC: revaluacion.CtxtAplicacionInstrumento,

      DescProSen: revaluacion.PSprogresos,
      EnfaProSen: revaluacion.PSaspectosEnfasis,
      obsPS: revaluacion.PStxtObsContextoEscolar,
      appPS: revaluacion.PStxtAplicacionInstrumento,

      DescMot: revaluacion.Mprogresos,
      EnfaMot: revaluacion.MaspectosEnfasis,
      obsM: revaluacion.MtxtObsContextoEscolar,
      appM: revaluacion.MtxtAplicacionInstrumento,

      aprendizajeLogrado: revaluacion.AFaprendizajeLogrado,
      aprendizajeNoLogrado: revaluacion.AFaprendizajeNoLogrado,
      logrosRelevantes: revaluacion.AFlogrosRelevantes,
      obsAF: revaluacion.AFtxtObsContextoEscolar,
      appaf: revaluacion.AFtxtAplicacionInstrumento,

      DescdesPerSoc: revaluacion.DPSprogresos,
      EnfadesPerSoc: revaluacion.DPSaspectosEnfasis,
      obsDPS: revaluacion.DPStxtObsContextoEscolar,
      appDPS: revaluacion.DPStxtAplicacionInstrumento,

      DescConFam: revaluacion.CFSprogresos,
      EnfaConFam: revaluacion.CFSaspectosEnfasis,
      obsCFS: revaluacion.CFStxtObsContextoEscolar,
      appCFS: revaluacion.CFStxtAplicacionInstrumento,

      efecPer: evaluacionApoyos.PERefectividad,
      obsPer: evaluacionApoyos.PERcontinuidad,

      efecCur: evaluacionApoyos.CURefectividad,
      obsCur: evaluacionApoyos.CURcontinuidad,

      efecMedRecMat: evaluacionApoyos.MRMefectividad,
      obsMedRecMat: evaluacionApoyos.MRMcontinuidad,

      efecOrg: evaluacionApoyos.ORGefectividad,
      obsOrg: evaluacionApoyos.ORGcontinuidad,

      efecFam: evaluacionApoyos.FAMefectividad,
      obsFam: evaluacionApoyos.FAMcontinuidad,

      efecApo: evaluacionApoyos.OAefectividad,
      obsApo: evaluacionApoyos.OAcontinuidad,

      efecEst: evaluacionApoyos.estrategias,
      descEst: evaluacionApoyos.efectividad,

      nuevosApo: evaluacionApoyos.nuevosApoyos,
      comentarios: evaluacionApoyos.comentarios
    });

    // Generar el documento modificado
    const generatedContent = doc.getZip().generate({ type: 'nodebuffer' });

    // Guardar el documento modificado
    fs.writeFileSync(outputPath, generatedContent);
    console.log(`Archivo con textos modificados guardado en: ${outputPath}`);
  } catch (error) {
    console.error('Error modificando documento:', error);
    throw error;
  }
};

// Función para cambiar el nombre del checkbox y guardarlo
export const changeCheckboxName = (templatePath, outputPath, checkboxId, newName) => {
  try {
    // Leer el contenido del archivo .docx
    const content = fs.readFileSync(templatePath);
    const zip = new PizZip(content);

    // Obtener el contenido del documento XML
    const docXml = zip.file('word/document.xml').asText();
    const doc = new DOMParser().parseFromString(docXml, 'text/xml');

    // Obtener el elemento del checkbox por su id
    const ffDataElements = doc.getElementsByTagName('w:ffData');
    const checkboxElement = ffDataElements[checkboxId];
    if (!checkboxElement) {
      throw new Error(`Checkbox con id ${checkboxId} no encontrado.`);
    }

    // Cambiar el nombre del checkbox
    const nameElement = checkboxElement.getElementsByTagName('w:name')[0];
    if (!nameElement) {
      throw new Error(`Elemento de nombre no encontrado para el checkbox ${checkboxId}.`);
    }
    nameElement.setAttribute('w:val', newName);

    // Serializar de vuelta el documento XML modificado
    const serializer = new XMLSerializer();
    const modifiedXml = serializer.serializeToString(doc);

    // Guardar el documento modificado de vuelta al archivo zip
    zip.file('word/document.xml', modifiedXml);

    // Guardar el archivo .docx modificado
    const generatedContent = zip.generate({ type: 'nodebuffer' });
    fs.writeFileSync(outputPath, generatedContent);
    console.log(`Nombre del checkbox ${checkboxId} cambiado a "${newName}". Documento guardado en ${outputPath}`);
  } catch (error) {
    console.error('Error modificando nombre del checkbox:', error);
    throw error;
  }
};

// Función para modificar los primeros 5 checkboxes a un estado de "1"
function modifyCheckboxes(docXml) {
  try {
    const doc = new DOMParser().parseFromString(docXml, 'text/xml');
    const serializer = new XMLSerializer();

    // Buscar elementos de checkbox por <w:ffData>
    const ffDataElements = doc.getElementsByTagName('w:ffData');
    //const checkedElement = ffDataElements[index].getElementsByTagName('w:checked')[0];

    for (let i = 0; i < ffDataElements.length; i++) {
      const checkedElements = ffDataElements[i].getElementsByTagName('w:checked');
      for (let j = 0; j < checkedElements.length; j++) {
        const element = checkedElements[j];
        //const currentState = element.getAttribute('w:val');
        //if (currentState === '0') {
        element.setAttribute('w:val', '');
        //}
      }
    }
    // Convertir el documento modificado de vuelta a XML
    const modifiedXml = serializer.serializeToString(doc);
    return modifiedXml;
  } catch (error) {
    console.error('Error modificando estado del checkbox:', error);
    throw error;
  }
}

// Función para cambiar el estado del checkbox a "1" y guardarlo
export const checkCheckbox = (templatePath, outputPath, checkboxId) => {
  try {
    // Leer el contenido del archivo .docx
    const content = fs.readFileSync(templatePath);
    const zip = new PizZip(content);

    // Obtener el contenido del documento XML
    const docXml = zip.file('word/document.xml').asText();
    const doc = new DOMParser().parseFromString(docXml, 'text/xml');

    // Obtener el elemento del checkbox por su id
    const ffDataElements = doc.getElementsByTagName('w:ffData');
    const checkboxElement = ffDataElements[checkboxId];
    if (!checkboxElement) {
      throw new Error(`Checkbox con id ${checkboxId} no encontrado.`);
    }

    // Cambiar el estado del checkbox a "1"
    const checkboxDataElement = checkboxElement.getElementsByTagName('w:checked')[0];
    if (!checkboxDataElement) {
      throw new Error(`Elemento de estado no encontrado para el checkbox ${checkboxId}.`);
    }
    checkboxDataElement.setAttribute('w:val', '1');

    // Serializar de vuelta el documento XML modificado
    const serializer = new XMLSerializer();
    const modifiedXml = serializer.serializeToString(doc);

    // Guardar el documento modificado de vuelta al archivo zip
    zip.file('word/document.xml', modifiedXml);

    // Guardar el archivo .docx modificado
    const generatedContent = zip.generate({ type: 'nodebuffer' });
    fs.writeFileSync(outputPath, generatedContent);
    console.log(`Estado del checkbox ${checkboxId} cambiado a "1". Documento guardado en ${outputPath}`);
  } catch (error) {
    console.error('Error cambiando estado del checkbox:', error);
    throw error;
  }
};
