import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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
        "s3": {
            "storage": "s3",
            "bucket": "zamabucket",
            "aws_key_id": "AKIATFAIXLJP7QQT5IKB",
            "aws_secret_key": "",
        }
    }, null, 2));
}

export const MAX_FILE_SIZE = 1024 * 1024 // 1MB ("potentially small files")
export const MAX_FILES_BY_BLOCK = 64;
export const SERVERS = JSON.parse(fs.readFileSync(serversFile).toString());
