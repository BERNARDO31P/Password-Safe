import {ChangeDetectorRef, Component} from "@angular/core";
import {Title} from "@angular/platform-browser";
import {ActivatedRoute, Router} from "@angular/router";

import {AppComponent} from "src/app/app.component";

import {SharedService} from "src/assets/js/shared.service";

@Component({
  selector: "admin",
  templateUrl: "./admin.component.html",
  styleUrls: ["./admin.component.scss"]
})
export class AdminComponent extends AppComponent {
  constructor(shared: SharedService, titleService: Title, router: Router, route: ActivatedRoute, changeDetectorRef: ChangeDetectorRef) {
    super(shared, titleService, router, route, changeDetectorRef);
  }
}
