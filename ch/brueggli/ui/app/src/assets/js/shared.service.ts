import {Injectable} from '@angular/core';

import {User} from "./model/User";
import {Organization} from "./model/Organization";

/*
 * Dafür da, um diverse Variablen unter verschiedenen Komponenten teilen zu können
 */
@Injectable({
  providedIn: "root",
})
export class SharedService {
  user: User = {} as User;
  page: number = 1;

  organizations: Array<Organization> = [];
}
