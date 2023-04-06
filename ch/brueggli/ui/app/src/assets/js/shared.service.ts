import {Injectable} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";

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

  private previousPage: number | null = null;
  page: number = 1;

  sorting: Sorting = {} as Sorting;

  organizations: Array<Organization> = [];

  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.queryParams.subscribe(params => {
      if (params["page"]) this.page = Number(params["page"]);
      if (params["sort"]) this.sorting.sort = params["sort"];
      if (params["order"]) this.sorting.order = params["order"];

      if (this.search === "" && params["search"]) {
        this.previousPage = this.page;
        this.page = 1;
        this.setParams({page: null});
      } else if (!params["search"] && this.previousPage) {
        this.setParams({page: this.previousPage});
        this.page = this.previousPage as number;
        this.previousPage = null;
      }

      this.search = params["search"] ?? "";
    });
  }

  private setParams(params: object): void {
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: params,
        queryParamsHandling: "merge"
      });
  }
}
