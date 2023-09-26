import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import * as mime from 'mime-types';
import * as tar from 'tar';
import { globSync } from 'glob'

import { hashValue } from './utils.js';
import { getMerkleProof, getMerkleRoot, verifyProof } from './merkle.js';
import { MAX_FILE_SIZE, SERVERS } from './config.js';
import scp from './storages/scp.js';
import s3 from './storages/s3.js';

const STORES = {
    "scp": scp,
    "s3": s3,
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

const injectProof = (fileProperties: any, index: number, leafs: string[]) => {
    return {
        ...fileProperties,
        index,
        proof: getMerkleProof(leafs, index),
    }
}

const generateBlockProperties = (globPattern: string) => {
    var files = globSync(globPattern).map(getFileProperties);
    if (files.length < 2) throw new Error('Less than 2 files found: ' + globPattern);
    const hashes = files.map(file => file.hash);
    files = files.map((file, index) => injectProof(file, index, hashes));
    return {
        root: getMerkleRoot(hashes),
        path: globPattern,
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

const prepareBlockForUpload = (globPattern: string, serverName: string) => {
    const blockProperties = generateBlockProperties(globPattern);
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

const extractAndVerify = (tmpDestFolder: string, fileName: string, blockProperties: any) => {
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
    return filePath;
}

const getBlockProperties = (blockShortHash: string) => {
    const blockPath = path.join(os.homedir(), ".zamatree", "blocks", blockShortHash + '.json');
    if (!fs.existsSync(blockPath)) throw new Error('Block not found: ' + blockShortHash);
    return JSON.parse(fs.readFileSync(blockPath).toString());
}

const initTempFolder = (blockShortHash: string) => {
    const tmpDestFolder = path.join(os.tmpdir(), blockShortHash);
    if (fs.existsSync(tmpDestFolder)) fs.rmSync(tmpDestFolder, { recursive: true });
    fs.mkdirSync(tmpDestFolder, { recursive: true });
    return tmpDestFolder;
}

const downloadInTempFolder = async (blockShortHash: string, fileIndex: number, blockProperties: any) => {
    const tmpDestFolder = initTempFolder(blockShortHash);
    const fileName = `${fileIndex}_${blockShortHash}.tar.gz`;
    console.log(`Downloading file from ${blockProperties.server}...`);
    await STORES[SERVERS[blockProperties.server].storage].download(
        tmpDestFolder, `${blockShortHash}/${fileName}`, blockProperties.server
    );
    return { tmpDestFolder, fileName };
}

export const uploadBlock = async (globPattern: string, serverName: string) => {
    if (!SERVERS[serverName]) throw new Error(`Server not found: ${serverName}`);
    if (!(SERVERS[serverName].storage in STORES)) throw new Error(`Storage not found: ${SERVERS[serverName].storage}`);
    const folder = prepareBlockForUpload(globPattern, serverName);
    console.log(`Uploading files in ${globPattern} to ${serverName}...`);
    await STORES[SERVERS[serverName].storage].upload(folder, serverName);
    const blockShortHash = path.basename(folder);
    console.log(`Files uploaded in block ${blockShortHash}.`);
    return blockShortHash;
}

export const downloadFile = async (destFolder: string, blockShortHash: string, fileIndex: number) => {
    if (!fs.statSync(destFolder).isDirectory()) throw new Error('Path is not a directory: ' + destFolder);
    const blockProperties = getBlockProperties(blockShortHash);
    if (fileIndex >= blockProperties.filecount) throw new Error('File not found: ' + fileIndex);
    const { tmpDestFolder, fileName } = await downloadInTempFolder(blockShortHash, fileIndex, blockProperties);
    const filePath = extractAndVerify(tmpDestFolder, fileName, blockProperties);
    const destPath = path.join(destFolder, path.basename(filePath));
    fs.copyFileSync(filePath, destPath);
    console.log(`File downloaded and verified: ${destPath}`)
}

export const listFiles = (blockShortHash: string) => {
    const blockPath = path.join(os.homedir(), ".zamatree", "blocks", blockShortHash + '.json');
    if (!fs.existsSync(blockPath)) throw new Error('Block not found: ' + blockShortHash);
    const blockProperties = JSON.parse(fs.readFileSync(blockPath).toString());
    return blockProperties.files.map((file: any, index: number) => {
        return {
            filename: file.filename,
            size: file.size,
            mime: file.mime,
            shortHash: blockShortHash,
            index,
        }
    });
}

export const listBlocks = () => {
    const blocksFolder = path.join(os.homedir(), ".zamatree", "blocks");
    if (!fs.existsSync(blocksFolder)) throw new Error('Blocks folder not found: ' + blocksFolder);
    const blocks = fs.readdirSync(blocksFolder);
    return blocks.map((blockShortHash: string) => {
        const blockPath = path.join(blocksFolder, blockShortHash);
        const blockProperties = JSON.parse(fs.readFileSync(blockPath).toString());
        return {
            shortHash: blockShortHash.split('.')[0],
            root: blockProperties.root,
            filecount: blockProperties.filecount,
            createdAt: blockProperties.createdAt,
            server: blockProperties.server,
        }
    });
}

export const listAllFiles = () => {
    const blocks = listBlocks();
    var files = [];
    blocks.forEach((block: any) => {
        files.push(listFiles(block.shortHash));
    });
    return files;
}
