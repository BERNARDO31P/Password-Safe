export type SecretKey = {
  secret_id?: number,
  secret_key: CryptoKey | string,
  user_id: number,
  org_id: number,
}
