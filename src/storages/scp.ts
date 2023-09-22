import * as fs from 'fs'
import path = require('path');
const { spawn } = require('node:child_process');

import  { SERVERS } from '../config';

const upload = async (folderPath: string, serverName: string) => {
    if (!SERVERS[serverName]) throw new Error(`Server not found: ${serverName}`);
    if (!fs.statSync(folderPath).isDirectory()) throw new Error('Path is not a directory: ' + folderPath);
    var command = ["-r"];
    if (SERVERS[serverName].port) command.push(`-P ${SERVERS[serverName].port}`);
    if (SERVERS[serverName].key) command.push(`-i ${SERVERS[serverName].key}`);
    command.push(`${folderPath}`);
    command.push(`${SERVERS[serverName].host}:${SERVERS[serverName].path}`);
    const scp = spawn('scp', command);
    await new Promise( (resolve) => {
        scp.stdout.on('data', (data) => {
            console.log(data.toString());
        });
        scp.on('close', resolve);
    });
}

const download = async (destFolder: string, fileName: string, serverName: string) => {
    if (!SERVERS[serverName]) throw new Error(`Server not found: ${serverName}`);
    if (!fs.statSync(destFolder).isDirectory()) throw new Error('Path is not a directory: ' + destFolder);
    var command = [];
    if (SERVERS[serverName].port) command.push(`-P ${SERVERS[serverName].port}`);
    if (SERVERS[serverName].key) command.push(`-i ${SERVERS[serverName].key}`);
    command.push(`${SERVERS[serverName].host}:${SERVERS[serverName].path}/${fileName}`);
    command.push(`${destFolder}/${path.basename(fileName)}`);
    const scp = spawn('scp', command);
    await new Promise((resolve) => {
        scp.stdout.on('data', (data) => {
            console.log(data.toString());
        });
        scp.on('close', resolve);
    });
}

const scp = module.exports = {
    upload,
    download,
};