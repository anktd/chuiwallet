import CryptoJS from 'crypto-js';

const encrypt = (text: string, password: string): string => {
  return CryptoJS.AES.encrypt(text, password).toString();
};

const decrypt = (ciphertext: string, password: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, password);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export default { encrypt, decrypt };
