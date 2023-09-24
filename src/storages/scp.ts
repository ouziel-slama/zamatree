import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'node:child_process';

import  { SERVERS } from '../config.js';

const scpCommand = async (serverName: string, src: string, dest: string) => {
    if (!SERVERS[serverName]) throw new Error(`Server not found: ${serverName}`);

    var command = ["-r"];
    if (SERVERS[serverName].port) { 
        command.push(`-P`);
        command.push(SERVERS[serverName].port)
    };
    if (SERVERS[serverName].key) {
        command.push(`-i`);
        command.push(SERVERS[serverName].key);
    };
    command.push(src);
    command.push(dest);
    //console.log(command.join(' '));
    const scp = spawn('scp', command);
    await new Promise((resolve) => {
        scp.stdin = process.stdin;
        scp.stdout.on('data', (data: any) => console.log(data.toString()));
        scp.stderr.on('data', (data: any) => console.log(data.toString()));
        scp.on('close', resolve);
    });
}

const upload = async (folderPath: string, serverName: string) => {
    if (!fs.statSync(folderPath).isDirectory()) throw new Error('Path is not a directory: ' + folderPath);
    const src = folderPath;
    const dest = `${SERVERS[serverName].host}:${SERVERS[serverName].path}`;
    await scpCommand(serverName, src, dest);
}

const download = async (destFolder: string, fileName: string, serverName: string) => {
    if (!fs.statSync(destFolder).isDirectory()) throw new Error('Path is not a directory: ' + destFolder);
    const src = `${SERVERS[serverName].host}:${SERVERS[serverName].path}/${fileName}`;
    const dest = `${destFolder}/${path.basename(fileName)}`;
    await scpCommand(serverName, src, dest);
}

export default {
    upload,
    download,
};