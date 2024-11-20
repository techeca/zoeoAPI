import { exec } from 'child_process';
import os from 'os';
import path from 'path';

const convertDocToDocx = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const isWindows = os.platform() === 'win32';

    const command = isWindows
      ? `python C:\\unoconv\\unoconv.py -f docx -o ${outputPath} ${inputPath} --listener C:\\Program Files (x86)\\OpenOffice 4\\program\\soffice.exe`
      : `unoconv -f docx -o ${outputPath} ${inputPath}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error converting document: ${stderr}`);
        reject(error);
      } else {
        console.log('Conversion successful:', stdout);
        resolve(outputPath);
      }
    });
  });
};

// Ejemplo de uso
const inputPath = path.join(process.cwd(), 'public', 'template.doc');
const outputPath = path.join(process.cwd(), 'public', 'template-converted.docx');

convertDocToDocx(inputPath, outputPath)
  .then((result) => {
    console.log('File converted successfully:', result);
  })
  .catch((error) => {
    console.error('Error during conversion:', error);
  });
