import {Injectable} from '@angular/core';

import {User} from "./model/User";

/*
 * Dafür da, um diverse Variablen unter verschiedenen Komponenten teilen zu können
 */
@Injectable({
  providedIn: "root",
})
export class SharedService {
  user: User = {} as User;
  page?: number;
}
