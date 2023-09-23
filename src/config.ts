import path = require('path');

export const MAX_FILE_SIZE = 1024 * 1024 // 1MB ("potentially small files")
export const MAX_FILES_BY_BLOCK = 50;

export const SERVERS = {
    "server1": {
        "storage": "scp",
        "host": "alpine", // user@host, support ~/.ssh/config
        //"port": 22,
        //"key": "~/.ssh/id_rsa",
        "path": "/home/tower/",
    },
    "docker": {
        "storage": "scp",
        "host": "zama@localhost",
        "port": 2222,
        "key": path.resolve(`${__dirname}/../docker-privkey`),
        "path": "/tmp",
    },
}