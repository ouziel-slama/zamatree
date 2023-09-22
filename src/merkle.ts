
import { hashValue } from './utils';

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

const hashPair = (pair: HashPairType) => {
    const [a, b] = pair;
    if (b === undefined) return a;
    return hashValue(a + b);
}

const hashListByPairs = (hashList: string[]): string[] => {
    if (hashList.length === 1) return hashList;
    const pairs = sliceInPairs(hashList);
    return pairs.map(hashPair);
}

const reduceHashList = (hashList: string[]): string => {
    if (hashList.length === 1) return hashList[0];
    const levelAbove = hashListByPairs(hashList);
    return reduceHashList(levelAbove);
}

const getPairIndex = (index: number): number => {
    if (index <= 1) return 0;
    if (index % 2 === 0) return index /  2;
    return (index - 1) / 2;
}

const getBrother = (index: number, hashList: string[]): IndexedHashType => {
    const brotherIndex = index % 2 === 0 ? index + 1 : index - 1;
    const brotherHash = hashList[brotherIndex];
    return [brotherHash, brotherIndex];
}

const getUncles = (index: number, hashList: string[], uncles: ProofType): ProofType => {
    if (hashList.length == 2) return uncles;
    const pairIndex = getPairIndex(index);
    const levelAbove = hashListByPairs(hashList);
    uncles.push(getBrother(pairIndex, levelAbove));
    return getUncles(pairIndex, levelAbove, uncles);
}

export const getMerkleRoot = (leafs: string[]): string => {
    const hashList = leafs.map(hashValue);
    return reduceHashList(hashList);
}

export const getMerkleProof = (leafs: string[], index: number): ProofType => {
    const hashList = leafs.map(hashValue);
    const proof = [getBrother(index, hashList)];
    return getUncles(index, hashList, proof);
}

export const verifyProof = (leaf: string, merkleRoot: string, proof: ProofType): boolean => {
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
    if (root !== '115cbb4775ed495f3d954dfa47164359a97762b40059d9502895def16eed609c') {
        throw new Error('Root is not valid');
    }
    console.log('root:', root);
    for (let i = 0; i < leafs.length; i++) {
        const proof = getMerkleProof(leafs, i);
        const verified = verifyProof(leafs[i], root, proof);
        console.log(leafs[i], verified);
        if (!verified) {
            throw new Error('Proof is not valid');
        }
    }
}

//test();