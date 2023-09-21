"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var createKeccakHash = require("keccak");
var sliceInPairs = function (arr) {
    var result = [];
    for (var i = 0; i < arr.length; i += 2) {
        result.push(arr.slice(i, i + 2));
    }
    return result;
};
var hashValue = function (value) {
    var hash = createKeccakHash('keccak256');
    hash.update(value);
    return hash.digest('hex');
};
var hashPair = function (pair) {
    var a = pair[0], b = pair[1];
    if (b === undefined)
        return a;
    return hashValue(a + b);
};
var hashListByPairs = function (hash_list) {
    if (hash_list.length === 1)
        return hash_list[0];
    var pairs = sliceInPairs(hash_list);
    return pairs.map(hashPair);
};
var reduceHashList = function (hash_list) {
    console.log(hash_list);
    if (hash_list.length === 1)
        return hash_list[0];
    var level_above = hashListByPairs(hash_list);
    return reduceHashList(level_above);
};
var getPairIndex = function (index) {
    if (index <= 1)
        return 0;
    if (index % 2 === 0)
        return index / 2;
    return (index - 1) / 2;
};
var getBrother = function (index, hash_list) {
    if (index % 2 === 0)
        return hash_list[index + 1];
    return hash_list[index - 1];
};
var getUncles = function (index, hash_list, uncles) {
    if (hash_list.length == 2)
        return uncles;
    var pair_index = getPairIndex(index);
    var level_above = hashListByPairs(hash_list);
    uncles.push(getBrother(pair_index, level_above));
    return getUncles(pair_index, level_above, uncles);
};
var merkleRoot = function (leafs) {
    var hash_list = leafs.map(hashValue);
    return reduceHashList(hash_list);
};
var merkleProof = function (leafs, index) {
    var hash_list = leafs.map(hashValue);
    var proof = [];
    proof.push(getBrother(index, hash_list));
    proof = getUncles(index, hash_list, proof);
    return proof;
};
var leafs = ['a', 'b', 'c', 'd'];
var root = merkleRoot(leafs);
var proof = merkleProof(leafs, 1);
console.log(root);
console.log(proof);
