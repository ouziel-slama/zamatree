# Zamatree

Zamatree is a command line utility for uploading and downloading files with integrity checking using a Merkle tree.

Zamatree is completely “server agnostic” and does not require any special installation on the server as long as it is possible to upload and download files. Zamatree currently only supports SSH servers via `scp`, but the code is structured so that you can easily add other server types like S3 for example.

[Installation](#installation)
[Usage](#usage)
    [Upload a file](#upload-a-file)
    [List uploaded files](#list-uploaded-files)
    [Download a file](#download-a-file)
[Implementation](#implementation)
[Short-comings and TODOs](#short-comings-and-todos)

# Installation

```
$ git clone git@github.com:ouziel-slama/zamatree.git
$ cd for trees
$ npm install && npm run build && npm link
```

To start a test openssh server:

```
$ docker-compose up
```

This server is automatically added in the `~/.zamatree/servers.json` configuration file the first time `zamatree` is run. Edit this file to add other ssh servers.

# Usage

![help_screenshot](screenshots/help.png)


## Upload a file

```
$ zamatree upload <folder path> <server name defined in ~/.zamatree/servers.json>
```

For example:

```
$ zamatree upload ./src docker
```

![upload_screenshot](screenshots/upload.png)


## List uploaded files

```
$ zamatree files
$ zamatree blocks
```

![lists_screenshot](screenshots/lists.png)


## Download a file

```
$ zamatree download <block short hash> <file index> <destination folder>
```

For example

```
$ zamatree download 625c7693 3 ./
```

![download_screenshot](screenshots/download.png)

# Implementation

To ensure maximum compatibility with existing cloud services, Zamatree is designed to leave no responsibility for the server other than storing files. All Merkle tree generation and verification operations are done on the client.

Before being uploaded to a server, the file is packaged in a tar.gz archive, accompanied by a `properties.json` file which contains the Merkle proof.

![properties_screenshot](screenshots/properties.png)

Zamatree keeps Merkle's root hash in a file `~/.zamatree/blocks/&lt;blockShortHash>.json` and uses it when downloading a file to check Markle's proof of the `properties.json` file.

![block_screenshot](screenshots/block.png)

# Short-comings and Todos

1. Use Rust. I'm currently working with Typescript, so it was the fastest language for this challenge.
2. better error handling and test suite.
3. Support more storages (S3, Google Cloud, Azur, etc.).
4. Support folders with more than 64 files (by separating them into several blocks).
5. Develop a pool system: before being uploaded, files are placed in a pool, and uploaded when the pool is full or a timeout has passed.
6. GUI. With a local web server and an HTML/JS interface.
7. Give the possibility of storing files from the same blocks on several different servers. To distribute or double the storage.
8. Support large files, by splitting them into several small files.
9. Make a backup of root hashes with `zamatree upload`.
10. Add a command to add/edit/delete a server without editing the json file.
