
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

const hashPair = (pair: HashPairType, isLeaf: boolean) => {
    const [a, b] = pair;
    if (b === undefined) return a;
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
    const brotherHash = hashList[brotherIndex];
    return brotherHash ? [brotherHash, brotherIndex] : undefined;
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

const test = () => {
    const leafs = [
        '73a608be1593cfe2e1b1431e926cb70550090df3459e299de4f9f286278b8e18',
        '8e2be3d5282fd20e3c56011cf0844109666ee500e6ebe25d351f786df9f11def',
        '155eec1a550204b4e901fd25bc89246806c12adb1f42bf458bdd5a0c1e9f2aab',
        '8890e537e9cfa239df6579564ebe341b89491b771dbeed400df1909f70937800',
        '1760fa1c01a38e64e24b03f8a8ec29c9215baaa79d1fc42b4fc883c1db390678',
        'a5ed3095b906298fb287593179d707c6821f885e394d1a8cb95307e8234446b4'
    ];
    const root = getMerkleRoot(leafs);
    console.log('root:', root);
    if (root !== '0bda731c82f30759c1fd4a9495b15c793b40b9c91a7e908597e165ae3aaa780b') {
        throw new Error('Root is not valid');
    }
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