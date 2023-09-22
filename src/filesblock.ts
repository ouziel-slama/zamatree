import * as fs from 'fs'
import mime = require('mime-types');
import path = require("path");
import tar = require('tar');
import os = require('os');

import { hashValue } from './utils';
import { getMerkleProof, getMerkleRoot, verifyProof } from './merkle';
import { MAX_FILES_BY_BLOCK, MAX_FILE_SIZE, SERVERS } from './config';
import scp = require('./storages/scp');

const STORES = {
    "scp": scp,
}

const getFileProperties = (filePath: string) => {
    const abspath = path.resolve(filePath);
    var stats = fs.statSync(abspath);
    if (stats.isDirectory()) throw new Error('Directory is not supported: ' + filePath);
    if (stats.size > MAX_FILE_SIZE) throw new Error('File is too big: ' + filePath);
    // TODO: only for "potentially small files"
    const fileContent = fs.readFileSync(filePath);
    return {
        filename: path.basename(abspath),
        size: stats.size,
        mime: mime.lookup(abspath),
        hash: hashValue(fileContent.toString()),
        path: abspath,
    }
}

const getFilesInFolder = (folderPath: string) => {
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

const injectProof = (fileProperties: any, index: number, leafs: string[]) => {
    return {
        ...fileProperties,
        index,
        proof: getMerkleProof(leafs, index),
    }
}

const getBlockProperties = (folderPath: string) => {
    const abspath = path.resolve(folderPath);
    var files = getFilesInFolder(abspath).map(getFileProperties);
    const hashes = files.map(file => file.hash);
    files = files.map((file, index) => injectProof(file, index, hashes));
    if (files.length > MAX_FILES_BY_BLOCK) {
        throw new Error('Too many files, max. ' + MAX_FILES_BY_BLOCK + ': ' + files.length)
    };
    return {
        root: getMerkleRoot(hashes),
        path: abspath,
        filecount: files.length,
        createdAt: new Date().toISOString(),
        files,
    };
}

const prepareFile = (fileProperties: any, destFolder: string, merkleRoot: string) => {
    const fileFolderName = [fileProperties.index, merkleRoot.substring(0, 8)].join('_');
    const fileFolderPath = path.join(destFolder, fileFolderName);
    const finalPath = fileFolderPath + '.tar.gz';
    const properties = JSON.stringify(fileProperties, null, 2);
    fs.mkdirSync(fileFolderPath, { recursive: true });
    fs.writeFileSync(path.join(fileFolderPath, 'properties.json'), properties);
    fs.copyFileSync(fileProperties.path, path.join(fileFolderPath, fileProperties.filename));
    tar.create({
        gzip: true,
        file: finalPath,
        cwd: destFolder,
        sync: true,
    }, [fileFolderName]);
    fs.rmSync(fileFolderPath, { recursive: true });
}

const prepareFiles = (blockProperties: any) => {
    const destFolder = path.join(os.tmpdir(), blockProperties.root.substring(0, 8));
    const merkleRoot = blockProperties.root;
    blockProperties.files.forEach(
        (fileProperties: any) => prepareFile(fileProperties, destFolder, merkleRoot)
    );
    return destFolder;
}

const prepareBlockForUpload = (folderPath: string, serverName: string) => {
    const blockProperties = getBlockProperties(folderPath);
    const folder = prepareFiles(blockProperties);
    const blocksFolder = path.join(os.homedir(), ".zamatree", "blocks");
    // don't make sense to keep hashes and proofs
    const cleanedBlockProperties = {
        root: blockProperties.root,
        filecount: blockProperties.filecount,
        createdAt: blockProperties.createdAt,
        server: serverName,
        files: blockProperties.files.map((file: any) => {
            return {
                filename: file.filename,
                size: file.size,
                mime: file.mime,
            }
        }),
    };
    const blockJson = JSON.stringify(cleanedBlockProperties, null, 2);
    const blockPath = path.join(blocksFolder, blockProperties.root.substring(0, 8) + '.json');
    fs.mkdirSync(blocksFolder, { recursive: true });
    fs.writeFileSync(blockPath, blockJson);
    return folder;
}

const uploadBlock = async (folderPath: string, serverName: string) => {
    if (!fs.statSync(folderPath).isDirectory()) throw new Error('Path is not a directory: ' + folderPath);
    if (!SERVERS[serverName]) throw new Error(`Server not found: ${serverName}`);
    if (!(SERVERS[serverName].storage in STORES)) throw new Error(`Storage not found: ${SERVERS[serverName].storage}`);
    
    const folder = prepareBlockForUpload(folderPath, serverName);
    console.log(`Uploading files in ${folderPath} to ${serverName}...`);
    await STORES[SERVERS[serverName].storage].upload(folder, serverName);
    const blockShortHash = path.basename(folder);
    console.log(`Files uploaded in block ${blockShortHash}.`);
    return blockShortHash;
}

const downloadFile = async (destFolder: string, blockShortHash: string, fileIndex: number) => {
    if (!fs.statSync(destFolder).isDirectory()) throw new Error('Path is not a directory: ' + destFolder);
    
    const blockPath = path.join(os.homedir(), ".zamatree", "blocks", blockShortHash + '.json');
    if (!fs.existsSync(blockPath)) throw new Error('Block not found: ' + blockShortHash);
    
    const blockProperties = JSON.parse(fs.readFileSync(blockPath).toString());
    if (fileIndex >= blockProperties.filecount) throw new Error('File not found: ' + fileIndex);
    
    const fileName = `${fileIndex}_${blockShortHash}.tar.gz`;
    const tmpDestFolder = path.join(os.tmpdir(), blockProperties.root.substring(0, 8));
    if (fs.existsSync(tmpDestFolder)) fs.rmSync(tmpDestFolder, { recursive: true });
    fs.mkdirSync(tmpDestFolder, { recursive: true });

    console.log(`Downloading file from ${blockProperties.server}...`);
    await STORES[SERVERS[blockProperties.server].storage].download(
        tmpDestFolder, `${blockShortHash}/${fileName}`, blockProperties.server
    );
    tar.extract({
        file: path.join(tmpDestFolder, fileName),
        cwd: tmpDestFolder,
        sync: true,
    });

    const propertiesPath = path.join(tmpDestFolder, fileName.replace('.tar.gz', ''), 'properties.json');
    const properties = JSON.parse(fs.readFileSync(propertiesPath).toString());
    const filePath = path.join(tmpDestFolder, fileName.replace('.tar.gz', ''), properties.filename);
    const fileContent = fs.readFileSync(filePath);
    const fileHash = hashValue(fileContent.toString());
    const verified = verifyProof(fileHash, blockProperties.root, properties.proof);
    if (!verified) throw new Error('File verification failed');
    const destPath = path.join(destFolder, properties.filename);
    fs.copyFileSync(filePath, destPath);
    console.log(`File downloaded and verified: ${destPath}`)
}

const test = async () => {
    const blockShortHash = await uploadBlock('./src', "server1")
    await downloadFile('./', blockShortHash, 2);
}

/* (async () => {
    await test();
})(); */
