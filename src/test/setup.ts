import '@testing-library/jest-dom';

// Polyfill window.crypto if needed in test environment
if (typeof window !== 'undefined' && !window.crypto) {
  // @ts-ignore
  window.crypto = {
    getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
      if (array && 'byteLength' in array) {
        const u8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
        for (let i = 0; i < u8.length; i++) {
          u8[i] = Math.floor(Math.random() * 256);
        }
      }
      return array;
    },
    subtle: {} as SubtleCrypto,
  } as unknown as Crypto;
}
