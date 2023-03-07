import {Credentials} from "./Credentials";

export type Password = {
  pass_id?: number,
  name: string,
  description?: string,
  url?: string,
  data: Credentials | string,
  org_id: number

}
