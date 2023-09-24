import { expect , test } from '@jest/globals';

import { getMerkleProof, getMerkleRoot, verifyProof } from './merkle.js';

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
