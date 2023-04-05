export type SecretKey = {
  secret_id?: number,
  data: CryptoKey | string,
  sign: string,
  user_id: number,
  org_id: number,
}
