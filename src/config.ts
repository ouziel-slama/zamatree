import fs = require('fs');
import path = require('path');
import os = require('os');

const appFolder = path.join(os.homedir(), ".zamatree");
const serversFile = path.join(appFolder, "servers.json");
if (!fs.existsSync(serversFile)) {
    fs.mkdirSync(appFolder, { recursive: true });
    fs.writeFileSync(serversFile, JSON.stringify({
        "docker": {
            "storage": "scp",
            "host": "zama@localhost", // support hosts in ~/.ssh/config
            "port": 2222,
            "key": path.resolve(`${__dirname}/../docker-privkey`),
            "path": "/tmp",
        },
    }, null, 2));
}

export const MAX_FILE_SIZE = 1024 * 1024 // 1MB ("potentially small files")
export const MAX_FILES_BY_BLOCK = 64;
export const SERVERS = JSON.parse(fs.readFileSync(serversFile).toString());
