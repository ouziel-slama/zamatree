
import { hashValue } from './utils.js';

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

const hashPair = (pair: HashPairType, isLeaf: boolean) => {
    var [a, b] = pair;
    if (b === undefined) b = a; // like in Bitcoin core implementation
    // prevent second preimage attack: append '1' if is leaf, '0' if not
    return hashValue((isLeaf ? '1' : '0') + a + b);
}

const hashListByPairs = (hashList: string[], isLeaf: boolean): string[] => {
    if (hashList.length === 1) return hashList;
    const pairs = sliceInPairs(hashList);
    return pairs.map((pair) => hashPair(pair, isLeaf));
}

const reduceHashList = (hashList: string[], isLeaf: boolean): string => {
    if (hashList.length === 1) return hashList[0];
    const levelAbove = hashListByPairs(hashList, isLeaf);
    return reduceHashList(levelAbove, false);
}

const getPairIndex = (index: number): number => {
    if (index <= 1) return 0;
    if (index % 2 === 0) return index /  2;
    return (index - 1) / 2;
}

const getBrother = (index: number, hashList: string[]): IndexedHashType => {
    const brotherIndex = index % 2 === 0 ? index + 1 : index - 1;
    const brotherHash = hashList[brotherIndex] ? hashList[brotherIndex] : hashList[index];
    return [brotherHash, brotherIndex];
}

const getUncles = (index: number, hashList: string[], uncles: ProofType, isLeaf: boolean): ProofType => {
    if (hashList.length == 2) return uncles;
    const pairIndex = getPairIndex(index);
    const levelAbove = hashListByPairs(hashList, isLeaf);
    const brother = getBrother(pairIndex, levelAbove);
    if (brother) uncles.push(brother);
    return getUncles(pairIndex, levelAbove, uncles, false);
}

export const getMerkleRoot = (leafs: string[]): string => {
    const hashList = leafs.map(hashValue);
    return reduceHashList(hashList, true);
}

export const getMerkleProof = (leafs: string[], index: number): ProofType => {
    const hashList = leafs.map(hashValue);
    const brother = getBrother(index, hashList);
    const proof = brother ? [getBrother(index, hashList)] : [];
    return getUncles(index, hashList, proof, true);
}

export const verifyProof = (leaf: string, merkleRoot: string, proof: ProofType): boolean => {
    var leafHash = hashValue(leaf);
    for (let i = 0; i < proof.length; i++) {
        const [proofHash, index] = proof[i];
        const pair: [string, string] = index % 2 === 0 ? [proofHash, leafHash] : [leafHash, proofHash];
        leafHash = hashPair(pair, i === 0 ? true : false);
    }
    return leafHash === merkleRoot;
}
