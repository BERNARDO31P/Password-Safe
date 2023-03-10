import {User} from "./model/User";
import {SecretKey} from "./model/SecretKey";
import {Credentials} from "./model/Credentials";

export class CryptUtils {
  /**
   * Berechnet den SHA-512-Hashwert von symmetrischen Schlüssel.
   * @param {CryptoKey} secretKey Der Schlüssel welcher gehasht werden soll.
   * @return {Promise<string>} Der Hashwert des Schlüssels als Base64-kodierte Zeichenfolge.
   */
  static async hashSecretKey(secretKey: CryptoKey): Promise<string> {
    let key = await crypto.subtle.exportKey("raw", secretKey);
    const hash = await crypto.subtle.digest("SHA-512", key);
    return this.arrayToBase64(hash);
  }

  /**
   * Fügt zwei ArrayBuffer zusammen und gibt das Ergebnis zurück.
   * @param {ArrayBuffer} buffer1 Der erste ArrayBuffer.
   * @param {ArrayBuffer} buffer2 Der zweite ArrayBuffer.
   * @return {ArrayBuffer} Ein neuer ArrayBuffer, der die beiden Argument-Buffer enthält.
   */
  private static concatenateArrayBuffers(buffer1: ArrayBuffer, buffer2: ArrayBuffer): ArrayBuffer {
    const combined = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    combined.set(new Uint8Array(buffer1), 0);
    combined.set(new Uint8Array(buffer2), buffer1.byteLength);
    return combined.buffer;
  }

  /**
   * Teilt den ArrayBuffer am angegebenen Index und gibt die beiden resultierenden Buffer als Tuple zurück.
   * Wenn der Split-Index größer als die Größe des Buffers ist, wird eine Fehlermeldung zurückgegeben.
   * @param {ArrayBuffer} buffer Der ArrayBuffer, der geteilt werden soll.
   * @param {number} splitIndex Der Index, an dem der ArrayBuffer geteilt werden soll.
   * @return {[ArrayBuffer, ArrayBuffer]} Ein Tupel, das die beiden resultierenden Buffer enthält.
   */
  private static splitArrayBuffer(buffer: ArrayBuffer, splitIndex: number): [ArrayBuffer, ArrayBuffer] {
    if (splitIndex > buffer.byteLength) {
      throw new Error('Split index is out of bounds');
    }

    const buffer1 = buffer.slice(0, splitIndex);
    const buffer2 = buffer.slice(splitIndex);

    return [buffer1, buffer2];
  }

  /**
   * Konvertiert eine Base64-kodierte Zeichenfolge in eine Uint8Array-Instanz.
   * @param {string} base64 Die Base64-kodierte Zeichenfolge.
   * @return {Uint8Array} Das Uint8Array-Objekt, das aus der Base64-kodierten Zeichenfolge erstellt wurde.
   */
  static base64ToArray(base64: string): Uint8Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  }

  /**
   * Konvertiert ein ArrayBuffer-Objekt in eine Base64-kodierte Zeichenfolge.
   * @param {ArrayBuffer} array Der ArrayBuffer, der in eine Base64-kodierte Zeichenfolge konvertiert werden soll.
   * @return {string} Die Base64-kodierte Zeichenfolge.
   */
  static arrayToBase64(array: ArrayBuffer): string {
    const bytes = new Uint8Array(array);
    let binary = '';

    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  }

  /**
   * Entschlüsselt den privaten und öffentlichen Schlüssel eines Benutzers mithilfe des gegebenen Passworts.
   * Gibt den Benutzer mit entschlüsselten Daten zurück.
   * @param {User} user Der Benutzer, dessen Schlüssel entschlüsselt werden sollen.
   * @return {Promise<User>} Der Benutzer mit entschlüsselten Schlüsseln.
   */
  static async decryptUser(user: User): Promise<User> {
    user.salt = this.base64ToArray(user.salt as string);

    let secret_key = await this.passwordToSecretKey(user.password, user.salt);

    user.private_key = await this.decryptPrivateKey(secret_key, user.private_key as string);
    user.public_key = await this.getPublicKey(user.public_key as string);

    return user;
  }

  /**
   * Importiert den öffentlichen Schlüssel im base64-Format und gibt das resultierende CryptoKey-Objekt zurück.
   * @param {string} base64Key Der öffentliche Schlüssel im base64-Format
   * @return {Promise<CryptoKey>} Ein CryptoKey-Objekt, das den öffentlichen Schlüssel repräsentiert
   */
  static async getPublicKey(base64Key: string): Promise<CryptoKey> {
    let publicKey = this.base64ToArray(base64Key);

    return await crypto.subtle.importKey("spki", publicKey, {name: "RSA-OAEP", hash: "SHA-512"}, false, ["encrypt"]);
  }

  /**
   * Entschlüsselt den privaten Schlüssel im base64-Format mit dem gegebenen geheimen Schlüssel und gibt das resultierende CryptoKey-Objekt zurück.
   * @param {CryptoKey} secretKey Der geheime Schlüssel, mit dem der private Schlüssel entschlüsselt werden soll
   * @param {string} base64Key Der zu entschlüsselnde private Schlüssel im base64-Format
   * @return {Promise<CryptoKey>} Ein CryptoKey-Objekt, das den entschlüsselten privaten Schlüssel repräsentiert
   */
  static async decryptPrivateKey(secretKey: CryptoKey, base64Key: string): Promise<CryptoKey> {
    const encrypted = this.base64ToArray(base64Key);
    const split = this.splitArrayBuffer(encrypted, 16);

    const decrypted = await crypto.subtle.decrypt({name: "AES-GCM", iv: split[0], length: 256, tagLength: 128}, secretKey, split[1]);

    return await crypto.subtle.importKey("pkcs8", decrypted, {name: "RSA-OAEP", hash: "SHA-512"}, true, ["decrypt"]);
  }

  /**
   * Verschlüsselt den privaten Schlüssel mit dem gegebenen geheimen Schlüssel und gibt das Ergebnis als base64-kodierten String zurück.
   * @param {CryptoKey} privateKey Der zu verschlüsselnde private Schlüssel
   * @param {CryptoKey} secretKey Der geheime Schlüssel, mit dem der private Schlüssel verschlüsselt werden soll
   * @return {Promise<string>} Ein base64-kodierter String, der den verschlüsselten privaten Schlüssel repräsentiert
   */
  static async encryptPrivateKey(privateKey: CryptoKey, secretKey: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.exportKey("pkcs8", privateKey);
    let encrypted = await crypto.subtle.encrypt({name: "AES-GCM", iv: iv, length: 256, tagLength: 128}, secretKey, key) as Uint8Array;

    return this.arrayToBase64(this.concatenateArrayBuffers(iv, encrypted));
  }

  /**
   * Entschlüsselt den gegebenen Base64-kodierten Schlüssel mit dem gegebenen privaten Schlüssel.
   * Gibt den entschlüsselten Schlüssel als CryptoKey-Objekt zurück.
   * @param {string} base64Key Der Base64-kodierte Schlüssel, der entschlüsselt werden soll.
   * @param {CryptoKey} privateKey Der private Schlüssel, der zum Entschlüsseln des Schlüssels verwendet werden soll.
   * @return {Promise<CryptoKey>} Das entschlüsselte CryptoKey-Objekt.
   */
  static async decryptSecretKey(base64Key: string, privateKey: CryptoKey): Promise<CryptoKey> {
    const encrypted = this.base64ToArray(base64Key);
    const decrypted = await crypto.subtle.decrypt({name: "RSA-OAEP"}, privateKey, encrypted);

    return await crypto.subtle.importKey("raw", decrypted, {name: "AES-GCM", length: 256}, true, ["encrypt", "decrypt"]);
  }

  /**
   * Verschlüsselt den geheimen Schlüssel mit dem gegebenen öffentlichen Schlüssel und gibt das Ergebnis als base64-kodierten String zurück.
   * @param {CryptoKey} secretKey Der zu verschlüsselnde geheime Schlüssel
   * @param {CryptoKey} publicKey Der öffentliche Schlüssel, mit dem der geheime Schlüssel verschlüsselt werden soll
   * @return {Promise<string>} Ein base64-kodierter String, der den verschlüsselten geheimen Schlüssel repräsentiert
   */
  static async encryptSecretKey(secretKey: CryptoKey, publicKey: CryptoKey): Promise<string> {
    let key = await crypto.subtle.exportKey("raw", secretKey);
    let encrypted = await crypto.subtle.encrypt({name: "RSA-OAEP"}, publicKey, key);

    return this.arrayToBase64(encrypted);
  }

  /**
   * Entschlüsselt die gegebenen Base64-kodierten Daten mit dem gegebenen Schlüssel.
   * Gibt die entschlüsselten Daten als Zeichenfolge zurück.
   * @param {string} base64Data Die Base64-kodierten Daten, die entschlüsselt werden sollen.
   * @param {CryptoKey} secretKey Der Schlüssel, der zum Entschlüsseln der Daten verwendet werden soll.
   * @return {Promise<string>} Die entschlüsselten Daten als Zeichenfolge.
   */
  static async decryptData(base64Data: string, secretKey: CryptoKey): Promise<Credentials> {
    if (!base64Data) return {} as Credentials;

    const split = this.splitArrayBuffer(this.base64ToArray(base64Data), 16);

    const decrypted = await crypto.subtle.decrypt({name: "AES-GCM", iv: split[0], length: 256, tagLength: 128}, secretKey, split[1]);
    const decoded = new TextDecoder().decode(decrypted);

    return JSON.parse(decoded);
  }

  /**
   * Verschlüsselt die gegebenen Daten mit dem gegebenen Schlüssel.
   * Gibt die verschlüsselten Daten als Base64-kodierte Zeichenfolge zurück.
   * @param {string} data Die zu verschlüsselnden Daten als Zeichenfolge.
   * @param {CryptoKey} secretKey Der Schlüssel, der zum Verschlüsseln der Daten verwendet werden soll.
   * @return {Promise<string>} Die verschlüsselten Daten als Base64-kodierte Zeichenfolge.
   */
  static async encryptData(data: Credentials, secretKey: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(16));

    const json = JSON.stringify(data);
    const encoded = new TextEncoder().encode(json);
    const encrypted = await crypto.subtle.encrypt({name: "AES-GCM", iv: iv, length: 256, tagLength: 128}, secretKey, encoded);

    return this.arrayToBase64(this.concatenateArrayBuffers(iv, encrypted));
  }

  /**
   * Leitet einen geheimen Schlüssel aus dem gegebenen Passwort und Salt ab.
   * Das abgeleitete Schlüsselobjekt kann dann zum Verschlüsseln und Entschlüsseln von Daten verwendet werden.
   * @param {string} password Das Passwort, aus dem der Schlüssel abgeleitet werden soll.
   * @param {ArrayBuffer} salt Das Salt, das zur Schlüsselableitung verwendet werden soll.
   * @return {Promise<CryptoKey>} Der abgeleitete geheime Schlüssel als CryptoKey-Objekt.
   */
  static async passwordToSecretKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
    let encoded = new TextEncoder().encode(password);

    let imported = await crypto.subtle.importKey(
      "raw",
      encoded,
      {
        name: "PBKDF2",
      },
      false,
      ["deriveKey"]
    ) as CryptoKey;

    return await crypto.subtle.deriveKey(
      {name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-512"},
      imported,
      {name: "AES-GCM", length: 256},
      true,
      ["encrypt", "decrypt"]
    ) as CryptoKey;
  }

  /**
   * Generiert ein neues Schlüsselpaar mit den folgenden Eigenschaften:
   * Algorithmus: RSA-OAEP
   * Hash-Algorithmus: SHA-512
   * Modulus-Länge: 2048
   * Public Exponent: 0x10001
   * @return {Promise<CryptoKeyPair>} Das generierte Schlüsselpaar als CryptoKeyPair-Objekt.
   */
  static async generateKeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        hash: "SHA-512",
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      },
      true,
      ["encrypt", "decrypt"]
    ) as CryptoKeyPair;
  }

  /**
   * Generiert einen neuen geheimen Schlüssel mit den folgenden Eigenschaften:
   * Algorithmus: AES-GCM
   * Schlüssellänge: 256 Bit
   * @return {Promise<CryptoKey>} Der generierte geheime Schlüssel als CryptoKey-Objekt.
   */
  static async generateSecretKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    ) as CryptoKey;
  }

  /**
   * Generiert geheime Schlüssel und verschlüsselt diese mit den öffentlichen Schlüsseln der gegebenen Benutzer.
   * Gibt ein assoziatives Array zurück, das die Benutzer-IDs als Schlüssel und die Base64-kodierten Schlüssel als Werte enthält.
   * @param {Array<User>} users Ein Array von Benutzern, deren öffentliche Schlüssel zur Verschlüsselung der geheimen Schlüssel verwendet werden sollen.
   * @param {number} org_id Die ID der Organisation, für welche die geheimen Schlüssel generiert werden sollen.
   * @return {Promise<Record<number, string>>} Ein assoziatives Array, das die Benutzer-IDs als Schlüssel und die Base64-kodierten geheimen Schlüssel als Werte enthält.
   */
  static async generateSecretKeys(users: Array<User>, org_id: number): Promise<Array<SecretKey>> {
    let secret_key = await this.generateSecretKey();
    let secret_keys = [] as Array<SecretKey>;

    for (let user of users) {
      let public_key = await this.getPublicKey(user.public_key as string);

      let secret_key_entry = {
        secret_key: await this.encryptSecretKey(secret_key, public_key as CryptoKey),
        user_id: user.user_id,
        org_id: org_id
      } as SecretKey;

      secret_keys.push(secret_key_entry);
    }

    return secret_keys;
  }
}
