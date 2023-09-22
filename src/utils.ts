import createKeccakHash = require('keccak');

export const hashValue = (value: string): string => {
    return createKeccakHash('keccak256').update(value).digest('hex');
}
