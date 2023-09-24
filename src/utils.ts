import * as fs from 'fs';
import * as path from 'path';

import createKeccakHash from 'keccak';

export const hashValue = (value: string): string => {
    return createKeccakHash('keccak256').update(value).digest('hex');
}

export const getFilesInFolder = (folderPath: string) => {
    if (!fs.statSync(folderPath).isDirectory()) {
        throw new Error('Path is not a directory: ' + folderPath);
    }
    const filesInFolder = fs.readdirSync(folderPath)
    var allFiles = [];
    filesInFolder.forEach((file)  =>{
        const filePath = path.resolve(path.join(folderPath, file));
        if (fs.statSync(filePath).isDirectory()) {
            allFiles = allFiles.concat(getFilesInFolder(filePath));
        } else {
            allFiles.push(filePath);
        }
    })
    return allFiles;
}