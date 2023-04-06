import {Injectable} from "@angular/core";
import {ActivatedRoute} from "@angular/router";

import {User} from "./model/User";
import {Organization} from "./model/Organization";
import {Sorting} from "./model/Sorting";

/*
 * Dafür da, um diverse Variablen unter verschiedenen Komponenten teilen zu können
 */
@Injectable({
  providedIn: "root",
})
export class SharedService {
  user: User = {} as User;

  search: string = "";
  page: number = 1;
  sorting: Sorting = {} as Sorting;

  organizations: Array<Organization> = [];

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      if (params["page"]) this.page = Number(params["page"]);
      if (params["sort"]) this.sorting.sort = params["sort"];
      if (params["order"]) this.sorting.order = params["order"];

      if (this.search === "" && params["search"]) this.page = 1;
      this.search = params["search"] ?? "";
    });
  }
}
