import { expect , test } from '@jest/globals';

import { getMerkleProof, getMerkleRoot, verifyProof, internalFunctions } from './merkle.js';

const {
    sliceInPairs,
    hashPair,
    hashListByPairs,
    reduceHashList,
    getPairIndex,
    getBrother,
    getUncles,
} = internalFunctions;

test('should slice in pairs', () => {
    const evenList = ['a', 'b', 'c', 'd', 'e', 'f'];
    const pairs = sliceInPairs(evenList);
    expect(pairs).toEqual([['a', 'b'], ['c', 'd'], ['e', 'f']]);

    const oddList = ['a', 'b', 'c', 'd', 'e'];
    const pairs2 = sliceInPairs(oddList);
    expect(pairs2).toEqual([['a', 'b'], ['c', 'd'], ['e', undefined]]);
});

test('should hash pair', () => {
    const pair: [string, string] = ['a', 'b'];
    const pairHashNode = hashPair(pair, false);
    expect(pairHashNode).toBe('d0a842687c3810e7db3b38e5d70c997c88651332d42832335bab4893efa46bc5');
    const pairHashLeaf = hashPair(pair, true);
    expect(pairHashLeaf).toBe('88ec794475ba2488221b63cda430abca513123bd30dec35485552e89d652b833');

    expect(hashPair(['a', undefined], false)).toBe('7419b1fd3e0c49924cf7968fd5e50b423572d68b4cb85eafeb7c8880c7661c50');
});

test('should hash list by pairs', () => {
    const list = ['a', 'b', 'c', 'd', 'e', 'f'];
    const hashList = hashListByPairs(list, false);
    expect(hashList).toEqual([
        'd0a842687c3810e7db3b38e5d70c997c88651332d42832335bab4893efa46bc5',
        '04cd7a245bf8b635616277c1a1060c29b32de386308b83f70003e7e44a616773',
        'f9e264acfaa66efd7af3dba33293d78e8d0074a809eeffaac34c69990f4afff4',
    ]);
});

test('should reduce hash list', () => {
    const hashList = [
        'd0a842687c3810e7db3b38e5d70c997c88651332d42832335bab4893efa46bc5',
        '04cd7a245bf8b635616277c1a1060c29b32de386308b83f70003e7e44a616773',
        'b9d7e8fa3db8ac19c495e05cd88a9a2350a1005f725c2ff862f75fc6dbff6ddd',
    ];
    const root = reduceHashList(hashList, true);
    expect(root).toBe('304fc5f9b3a2298863c11ee6e7613e3a9d1408f8ba5ff305fb0d0c3db0e1a743');
});

test('should get pair index', () => {
    expect(getPairIndex(0)).toBe(0);
    expect(getPairIndex(1)).toBe(0);
    expect(getPairIndex(2)).toBe(1);
    expect(getPairIndex(3)).toBe(1);
    expect(getPairIndex(4)).toBe(2);
    expect(getPairIndex(5)).toBe(2);
    expect(getPairIndex(6)).toBe(3);
    expect(getPairIndex(7)).toBe(3);
});

test('should get brother', () => {
    const hashList = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(getBrother(0, hashList)).toEqual(['b', 1]);
    expect(getBrother(1, hashList)).toEqual(['a', 0]);
    expect(getBrother(2, hashList)).toEqual(['d', 3]);
    expect(getBrother(3, hashList)).toEqual(['c', 2]);
    expect(getBrother(4, hashList)).toEqual(['f', 5]);
    expect(getBrother(5, hashList)).toEqual(['e', 4]);
});

test('should get uncles', () => {
    const hashList = ['a', 'b', 'c', 'd', 'e', 'f'];
    const uncles = getUncles(0, hashList, [], true);
    expect(uncles).toEqual([
        ['edadada73364831037b431ae261118bb0475dfbed4826d5cd5445689e4e26933', 1], 
        ['e8796f7d44d251df71bafe63cc1f69a30210970b8dbe052391f06c94f25fe7f6', 1]
    ]);
});

test('should get merkle root', () => {
    const leafs = ['a', 'b', 'c', 'd', 'e', 'f'];
    const root = getMerkleRoot(leafs);
    expect(root).toBe('803d1264e1763723d13da5082b4c97e83879d140852ec48bc2618f16e9acad89');
});

test('should get merkle proof', () => {
    const leafs = ['a', 'b', 'c', 'd', 'e', 'f'];
    const proof = getMerkleProof(leafs, 0);
    expect(proof).toEqual([
        ['b5553de315e0edf504d9150af82dafa5c4667fa618ed0a6f19c69b41166c5510', 1], 
        ['3df420d865c32934a17d41f1cf42490f52ebc1dcaecc8022733e9b9f4c76fad1', 1],
        ['6a1c2819d910e50c1f9c7caa00e9716532203dc6a9d49c303bf4b097d2b855f5', 1]
    ]);
});

test('should verify proof', () => {
    const leaf = 'a';
    const root = '803d1264e1763723d13da5082b4c97e83879d140852ec48bc2618f16e9acad89';
    const proof: [string, number][] = [
        ['b5553de315e0edf504d9150af82dafa5c4667fa618ed0a6f19c69b41166c5510', 1], 
        ['3df420d865c32934a17d41f1cf42490f52ebc1dcaecc8022733e9b9f4c76fad1', 1],
        ['6a1c2819d910e50c1f9c7caa00e9716532203dc6a9d49c303bf4b097d2b855f5', 1]
    ];
    const verified = verifyProof(leaf, root, proof);
    expect(verified).toBe(true);
});

test('should verify all leafs', () => {
    const leafs = [
        '73a608be1593cfe2e1b1431e926cb70550090df3459e299de4f9f286278b8e18',
        '8e2be3d5282fd20e3c56011cf0844109666ee500e6ebe25d351f786df9f11def',
        '155eec1a550204b4e901fd25bc89246806c12adb1f42bf458bdd5a0c1e9f2aab',
        '8890e537e9cfa239df6579564ebe341b89491b771dbeed400df1909f70937800',
        '1760fa1c01a38e64e24b03f8a8ec29c9215baaa79d1fc42b4fc883c1db390678',
        'a5ed3095b906298fb287593179d707c6821f885e394d1a8cb95307e8234446b4'
    ];
    const root = getMerkleRoot(leafs);
    expect(root).toBe('ab3fff9abac9590b9a8be77f64e8b8cd74cc1cf0ff31e130b087a12bf11004ac');
    
    for (let i = 0; i < leafs.length; i++) {
        const proof = getMerkleProof(leafs, i);
        const verified = verifyProof(leafs[i], root, proof);
        expect(verified).toBe(true);
    }
});
