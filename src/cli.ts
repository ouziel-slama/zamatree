#! /usr/bin/env node

import { printTable }  from "console-table-printer";
import { Command } from 'commander';

import { 
    listAllFiles, listFiles, listBlocks, 
    uploadBlock, downloadFile 
}  from './filesblock.js';

import { SERVERS }  from './config.js';

const printJson = (data: any) => {
    console.log(JSON.stringify(data, null, 4));
};

const printOutput = (data: any, json: boolean) => {
    if (json) {
        printJson(data);
    } else {
        printTable(data);
    }
};

const program = new Command();

program
    .name('zamatree')
    .description('CLI to manage files with merkle tree verification')
    .version('0.1.0');

program.command('files')
    .description('List all files or files in a block')
    .option('-b, --block <shortHash>', 'Block short hash')
    .option('-j, --json', 'Output in json format')
    .action((options: any) => {
        if (options.block === undefined) {
            const files = listAllFiles();
            files.map((file: any) => printOutput(file, options.json));
        } else {
            const files = listFiles(options.block);
            printOutput(files, options.json);
        }
  
    });

program.command('blocks')
    .description('List all blocks')
    .option('-j, --json', 'Output in json format')
    .action((options: any) => {
        const blocks = listBlocks();
        printOutput(blocks, options.json);
    });

program.command('servers')
    .description('List all servers')
    .option('-j, --json', 'Output in json format')
    .action((options: any) => {
        if (options.json) {
            printJson(SERVERS);
        } else {
            for (const serverName in SERVERS) {
                const server = {
                    name: serverName,
                    ...SERVERS[serverName],
                }
                printTable([server]);
            }
        }
    });

program.command('upload')
    .description('Upload files mathing the glob pattern')
    .argument('<globPattern>', 'glob pattern to upload (e.g. "folder/**/*.*"')
    .argument('<server>', 'Server name to upload files')
    .action((folder: string, server: string) => {
        uploadBlock(folder, server);
    });

program.command('download')
    .description('Download and verify a file')
    .argument('<blockShortHash>', 'Block short hash')
    .argument('<fileIndex>', 'File index in block')
    .argument('[destFolder]', 'Destination folder', process.cwd())
    .action((blockShortHash: string, fileIndex: number, destFolder: string) => {
        downloadFile(destFolder, blockShortHash, fileIndex);
    });

program.parse();