/**
 * 阅后即焚加解密核心（Web Crypto API 封装）
 * 
 * 使用 PBKDF2(密码, roomId) 派生 AES-GCM-256 密钥
 */
export class EphemeralCrypto {
  private static readonly ALGO_PBKDF2 = 'PBKDF2';
  private static readonly ALGO_AES_GCM = 'AES-GCM';
  private static readonly ITERATIONS = 100000;
  private static readonly HASH_ALGO = 'SHA-256';

  /**
   * 将字符串转换为 Uint8Array
   */
  private static strToUint8Array(str: string): Uint8Array {
    return new TextEncoder().encode(str) as Uint8Array;
  }

  /**
   * 将 Uint8Array 转换为字符串
   */
  private static uint8ArrayToStr(buffer: Uint8Array | ArrayBuffer): string {
    return new TextDecoder().decode(buffer);
  }

  /**
   * 导入原始密码为 CryptoKey
   */
  private static async importPassword(password: string): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
      'raw',
      this.strToUint8Array(password) as any,
      { name: this.ALGO_PBKDF2 },
      false,
      ['deriveKey']
    );
  }

  /**
   * 根据密码和 roomId (作为 salt) 派生 AES-GCM-256 密钥
   */
  static async deriveKey(password: string, roomId: string): Promise<CryptoKey> {
    const passwordKey = await this.importPassword(password);
    return await crypto.subtle.deriveKey(
      {
        name: this.ALGO_PBKDF2,
        salt: this.strToUint8Array(roomId) as any,
        iterations: this.ITERATIONS,
        hash: this.HASH_ALGO
      },
      passwordKey,
      { name: this.ALGO_AES_GCM, length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 加密明文，返回 Base64 格式的 cipherText 和 iv
   */
  static async encrypt(key: CryptoKey, plainText: string): Promise<{ cipherText: string; iv: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM 推荐 12 字节 IV
    const encodedPlaintext = this.strToUint8Array(plainText);

    const cipherBuffer = await crypto.subtle.encrypt(
      {
        name: this.ALGO_AES_GCM,
        iv: iv
      },
      key,
      encodedPlaintext as any
    );

    return {
      cipherText: this.bufferToBase64(cipherBuffer),
      iv: this.bufferToBase64(iv.buffer)
    };
  }

  /**
   * 解密，如果密码错误或密文被篡改，会抛出异常
   */
  static async decrypt(key: CryptoKey, cipherTextB64: string, ivB64: string): Promise<string> {
    const cipherBuffer = this.base64ToBuffer(cipherTextB64);
    const ivBuffer = new Uint8Array(this.base64ToBuffer(ivB64));

    const plainBuffer = await crypto.subtle.decrypt(
      {
        name: this.ALGO_AES_GCM,
        iv: ivBuffer
      },
      key,
      cipherBuffer
    );

    return this.uint8ArrayToStr(plainBuffer);
  }

  // --- Base64 Helpers ---
  private static bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
