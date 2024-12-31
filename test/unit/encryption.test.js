"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const encryption_1 = require("../../src/utils/encryption");
describe("Encryption Utils", () => {
    it("encrypts and decrypts data correctly", () => {
        const text = "my secret data";
        const pass = "12345";
        const enc = (0, encryption_1.encryptData)(text, pass);
        expect(enc).not.toEqual(text);
        const dec = (0, encryption_1.decryptData)(enc, pass);
        expect(dec).toBe(text);
    });
    it("throws error on wrong password", () => {
        const enc = (0, encryption_1.encryptData)("hello", "right-pass");
        expect(() => (0, encryption_1.decryptData)(enc, "wrong-pass")).toThrow();
    });
});
