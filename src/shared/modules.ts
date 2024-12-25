/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
declare module 'browser-passworder' {
  export function encrypt(password: string, privateKey: any): Promise<string>;
  export function decrypt(password: string, encrypted: string): Promise<Buffer>;
}
