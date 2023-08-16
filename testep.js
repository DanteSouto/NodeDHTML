function testConversionPerformance() {
    const iterations = 100000;
    const sourceData = Array.from({ length: 1000 }, () => 'a').join('');

    // Using Buffer and spread operator
    console.time('Variant 1');
    for (let i = 0; i < iterations; i++) {
        const buffer = Buffer.from(sourceData);
        const byteArray = [...buffer];
    }
    console.timeEnd('Variant 1');

    // Using TypedArray
    console.time('Variant 2');
    for (let i = 0; i < iterations; i++) {
        const buffer = new ArrayBuffer(sourceData.length);
        const byteArray = new Uint8Array(buffer);
        for (let j = 0; j < sourceData.length; j++) {
            byteArray[j] = sourceData.charCodeAt(j);
        }
    }
    console.timeEnd('Variant 2');
}

testConversionPerformance();