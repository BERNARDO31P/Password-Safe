export type User = {
  user_id?: number,
  email: string,
  password: string,
  first_name: string,
  last_name: string,
  is_admin: boolean,
  is_suspended: boolean,
  last_login?: number,
  private_key: CryptoKey | string,
  public_key: CryptoKey | string,
  sign_private_key: CryptoKey | string,
  salt: ArrayBuffer | string,
}
