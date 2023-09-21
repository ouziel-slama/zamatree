
import createKeccakHash = require('keccak');

type HashPairType = [string, string];
type IndexedHashType = [string, number];
type ProofType = IndexedHashType[];

const sliceInPairs = (arr: string[]): HashPairType[] => {
    const result = [];
    for (let i = 0; i < arr.length; i += 2) {
        result.push(arr.slice(i, i + 2));
    }
    return result;
}

const hashValue = (value: string): string => {
    return createKeccakHash('keccak256').update(value).digest('hex');
}

const hashPair = (pair: HashPairType) => {
    const [a, b] = pair;
    if (b === undefined) return a;
    return hashValue(a + b);
}

const hashListByPairs = (hash_list: string[]): string[] => {
    if (hash_list.length === 1) return hash_list;
    const pairs = sliceInPairs(hash_list);
    return pairs.map(hashPair);
}

const reduceHashList = (hash_list: string[]): string => {
    if (hash_list.length === 1) return hash_list[0];
    const level_above = hashListByPairs(hash_list);
    return reduceHashList(level_above);
}

const getPairIndex = (index: number): number => {
    if (index <= 1) return 0;
    if (index % 2 === 0) return index /  2;
    return (index - 1) / 2;
}

const getBrother = (index: number, hash_list: string[]): IndexedHashType => {
    const brotherIndex = index % 2 === 0 ? index + 1 : index - 1;
    const brotherHash = hash_list[brotherIndex];
    return [brotherHash, brotherIndex];
}

const getUncles = (index: number, hash_list: string[], uncles: ProofType): ProofType => {
    if (hash_list.length == 2) return uncles;
    const pair_index = getPairIndex(index);
    const level_above = hashListByPairs(hash_list);
    uncles.push(getBrother(pair_index, level_above));
    return getUncles(pair_index, level_above, uncles);
}

const getMerkleRoot = (leafs: string[]): string => {
    const hash_list = leafs.map(hashValue);
    return reduceHashList(hash_list);
}

const getMerkleProof = (leafs: string[], index: number): ProofType => {
    const hash_list = leafs.map(hashValue);
    const proof = [getBrother(index, hash_list)];
    return getUncles(index, hash_list, proof);
}

const verifyProof = (leaf: string, merkleRoot: string, proof: ProofType): boolean => {
    var leafHash = hashValue(leaf);
    for (let i = 0; i < proof.length; i++) {
        const [proofHash, index] = proof[i];
        const pair: [string, string] = index % 2 === 0 ? [proofHash, leafHash] : [leafHash, proofHash];
        leafHash = hashPair(pair);
    }
    return leafHash === merkleRoot;
}

const test = () => {
    const leafs = ['a', 'b', 'c', 'd'];
    const root = getMerkleRoot(leafs);
    const proof = getMerkleProof(leafs, 0);
    const verified = verifyProof('a', root, proof);
    console.log(verified);
    console.log(root);
    console.log(proof);
}

test();