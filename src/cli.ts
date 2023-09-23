#! /usr/bin/env node

const { Command } = require('commander');
const program = new Command();

const { 
    listAllFiles, listFiles, listBlocks, 
    uploadBlock, downloadFile 
} = require('./filesblock');

const { SERVERS } = require('./config');

program
    .name('zamatree')
    .description('CLI to manage files with merkle tree verification')
    .version('0.1.0');

program.command('files')
    .description('List all files or files in a block')
    .option('-b, --block <shortHash>', 'Block short hash')
    .action((options: any) => {
        const files = options.block === undefined ? listAllFiles() : listFiles(options.block);
        console.log(files);
    });

program.command('blocks')
    .description('List all blocks')
    .action(() => {
        const blocks = listBlocks();
        console.log(blocks);
    });

program.command('servers')
    .description('List all servers')
    .action(() => {
        console.log(SERVERS);
    });

program.command('upload')
    .description('Upload all file in a folder')
    .arguments('<folder>', 'Folder to upload')
    .arguments('<server>', 'Server name to upload files')
    .action((folder: string, server: string) => {
        uploadBlock(folder, server);
    });

program.command('download')
    .description('Download and verify a file')
    .arguments('<blockShortHash>', 'Block short hash')
    .arguments('<fileIndex>', 'File index in block')
    .arguments('<destFolder>', 'Destination folder')
    .action((blockShortHash: string, fileIndex: number, destFolder: string) => {
        downloadFile(destFolder, blockShortHash, fileIndex);
    });

program.parse();