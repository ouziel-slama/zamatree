import fs = require('fs');
import path = require('path');
import AWS = require('aws-sdk');

import { Readable } from 'stream'

import { PutObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getFilesInFolder } from '../utils';
import  { SERVERS } from '../config';

const getAwsClient = (serverName: string) => {
    if (!SERVERS[serverName]) throw new Error(`Server not found: ${serverName}`);
    if (!SERVERS[serverName].bucket) throw new Error(`Bucket not found: ${serverName}.bucket`);
    if (!SERVERS[serverName].aws_key_id) throw new Error(`AWS Key ID not found: ${serverName}.aws_key_id`);
    if (!SERVERS[serverName].aws_secret_key) throw new Error(`AWS Secret Key not found: ${serverName}.aws_secret_key`);

    return new S3Client({
        region: "eu-west-3",
        credentials: {
            accessKeyId: SERVERS[serverName].aws_key_id,
            secretAccessKey: SERVERS[serverName].aws_secret_key
        }
    });
}

const upload = async (folderPath: string, serverName: string) => {
    if (!fs.statSync(folderPath).isDirectory()) throw new Error('Path is not a directory: ' + folderPath);

    const client = getAwsClient(serverName);
    const files = getFilesInFolder(folderPath);

    for (var i = 0; i < files.length; i++) {
        const file = files[i];  
        try {
            const fileData = fs.readFileSync(file);
            const command = new PutObjectCommand({
                Bucket: SERVERS[serverName].bucket,
                Key: path.basename(file),
                Body: fileData
            });
            const response = await client.send(command);
            console.log(`${file} uploaded successfully to ${serverName}`);
        } catch (err) {
            console.log(err)
        }
    }
}

const download = async (destFolder: string, fileName: string, serverName: string) => {
    if (!fs.statSync(destFolder).isDirectory()) throw new Error('Path is not a directory: ' + destFolder);

    const client = getAwsClient(serverName);
    const command = new GetObjectCommand({
        Bucket: SERVERS[serverName].bucket,
        Key: path.basename(fileName),
    });
    const dest = `${destFolder}/${path.basename(fileName)}`;
    
    const { Body } = await client.send(command);
    await new Promise((resolve, reject) => {
        if (Body instanceof Readable) {
            Body.pipe(fs.createWriteStream(dest))
            .on('error', err => reject(err))
            .on('close', () => resolve(null))
        } else {
            reject(new Error('Body is not a stream'))
        }
    });
}


const s3 = module.exports = {
    upload,
    download,
};