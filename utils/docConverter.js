import { exec } from 'child_process';
import os from 'os';
import path from 'path';

const convertDocToDocx = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const isWindows = os.platform() === 'win32';

    const command = isWindows
      ? `python C:\\WORKSPACE\\unoconv.py -f docx -o ${outputPath} ${inputPath}`
      : `unoconv -f docx -o ${outputPath} ${inputPath}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error converting document: ${stderr}`);
        reject(error);
      } else {
        resolve(outputPath);
      }
    });
  });
};

export default convertDocToDocx
