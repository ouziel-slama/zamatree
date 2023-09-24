#! /usr/bin/env node
import { printTable }  from "console-table-printer";
import { Command } from 'commander';

import { 
    listAllFiles, listFiles, listBlocks, 
    uploadBlock, downloadFile 
}  from './filesblock.js';

import { SERVERS }  from './config.js';

const program = new Command();

program
    .name('zamatree')
    .description('CLI to manage files with merkle tree verification')
    .version('0.1.0');

program.command('files')
    .description('List all files or files in a block')
    .option('-b, --block <shortHash>', 'Block short hash')
    .action((options: any) => {
        if (options.block === undefined) {
            const files = listAllFiles();
            files.map((file: any) => printTable(file));
        } else {
            const files = listFiles(options.block);
            printTable(files);
        }
  
    });

program.command('blocks')
    .description('List all blocks')
    .action(() => {
        const blocks = listBlocks();
        printTable(blocks);
    });

program.command('servers')
    .description('List all servers')
    .action(() => {
        for (const serverName in SERVERS) {
            const server = {
                name: serverName,
                ...SERVERS[serverName],
            }
            printTable([server]);
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
    .argument('<destFolder>', 'Destination folder')
    .action((blockShortHash: string, fileIndex: number, destFolder: string) => {
        downloadFile(destFolder, blockShortHash, fileIndex);
    });

program.parse();