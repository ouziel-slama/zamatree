# Zamatree

Zamatree is a command line utility for uploading and downloading files with integrity checking using a Merkle tree.

Zamatree is completely “server agnostic” and does not require any special installation on the server as long as it is possible to upload and download files. Zamatree currently supports SSH servers (via `scp`) and Amazon `S3`, but the code is structured so that you can easily add other server types like Google Cloud or Azure for example.

- [Installation](#installation)
- [Usage](#usage)
    - [Upload files in a folder](#upload-files-in-a-folder)
    - [List uploaded files](#list-uploaded-files)
    - [Download a file](#download-a-file)
- [Implementation](#implementation)
    - [Methodology](#methodology)
    - [Code organization](#code-organization)
- [Short-comings and TODOs](#short-comings-and-todos)

# Installation

## Requirement

- `scp`

## Download and install

```
$ git clone git@github.com:ouziel-slama/zamatree.git
$ cd zamatree
$ npm install && npm run build && npm link
$ zamatree help
```

To start a test openssh server:

```
$ docker-compose up
```

## Configure

The servers are configured in the `~/.zamatree/servers.json` file. A default configuration, containing the test openssh docker server and a `S3` test account, is automatically generated the first time `zamatree` is run.
Edit this file to update the S3 key or add a server.

```
$ zamatree help # to generate the default config file
$ vi ~/.zamatree/servers.json
```

# Usage

&nbsp;
![help_screenshot](screenshots/help.png)
&nbsp;

## Upload files in a folder

```
$ zamatree upload <folder path> <server name defined in ~/.zamatree/servers.json>
```

For example:

```
$ zamatree upload ./src docker
```

&nbsp;
![upload_screenshot](screenshots/upload.png)
&nbsp;

## List uploaded files

```
$ zamatree files
$ zamatree blocks
```

&nbsp;
![lists_screenshot](screenshots/lists.png)
&nbsp;

## Download a file

```
$ zamatree download <block short hash> <file index> <destination folder>
```

For example

```
$ zamatree download 625c7693 3 ./
```

&nbsp;
![download_screenshot](screenshots/download.png)
&nbsp;

# Implementation

## Methodology

To ensure maximum compatibility with existing cloud services, Zamatree is designed to leave no responsibility for the server other than storing files. All Merkle tree generation and verification operations are done on the client.

Before being uploaded to a server, the file is packaged in a tar.gz archive, accompanied by a `properties.json` file which contains the Merkle proof.

&nbsp;
![properties_screenshot](screenshots/properties.png)
&nbsp;

Zamatree keeps Merkle's root hash in a file `~/.zamatree/blocks/<blockShortHash>.json` and uses it when downloading a file to check Markle's proof of the `properties.json` file.

&nbsp;
![block_screenshot](screenshots/block.png)
&nbsp;

## Code organization

The two most important modules are `src/merkle.ts` and `src/filesblock.ts`.

- `src/merkle.ts`: implementation of the Merkle tree. The code can be optimized to obtain better performance but given the relatively small number of nodes I preferred to prioritize readability. For nodes that have no brothers (on levels with an odd number of nodes), I use the same method as Bitcoin core by concatenating the hash with itself.
This module exposes 3 functions: `getMerkleProof`, `getMerkleRoot`, `verifyProof`.

- `src/fileblocks.ts`: this module is responsible for preparing the files before uploading them and also for checking the files after downloading them. It is this module which generates a json file per block (kept on the client) as well as a json file per file containing the proof of Merkle (uploaded with the file). This module exposes 5 functions: `uploadBlock`, `downloadFile`, `listAllFiles`, `listFiles`, `listBlocks`.

- `src/cli.ts`: a command line wrapper for the 5 functions exposed by `fileblock.ts`

- `src/config.ts`: Here is defined the maximum size of files and blocks as well as the default servers.

- `src/storages/`: This folder contains one module per server type. For now `scp.ts` and `s3.ts`. To be used by `filesblock.ts` these modules must expose two functions:

```
const upload = async(folderPath: string, serverName: string)
const download = async(destFolder: string, fileName: string, serverName: string)
```

**Note about comments in code.**

The code is deliberately almost not commented. I try as much as possible to practice “code as comment”. Comments are only there to justify algorithm choices, arbitrary constants or particularly complex lines of code.
For the rest, the names of functions and variables must be clear enough and the code readable enough to not require comments.

# Short-comings and Todos

1. Use Rust. I'm currently working with Typescript, so it was the fastest language for this challenge.
2. better error handling and test suite.
3. Support more storages (Google Cloud, Azure, etc.).
4. Support folders with more than 64 files (by separating them into several blocks).
5. Develop a pool system: before being uploaded, files are placed in a pool, and uploaded when the pool is full or a timeout has passed.
6. GUI. With a local web server and an HTML/JS interface.
7. Give the possibility of storing files from the same blocks on several different servers. To distribute or double the storage.
8. Support large files, by splitting them into several small files.
9. Make a backup of root hashes with `zamatree upload`.
10. Add a command to add/edit/delete a server without editing the json file.
