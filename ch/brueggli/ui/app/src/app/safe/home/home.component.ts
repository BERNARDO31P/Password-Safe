import {Component} from "@angular/core";

import {SafeComponent} from "src/app/safe/safe.component";

@Component({
  selector: "safe-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"]
})
export class SafeHomeComponent extends SafeComponent {
  /**
   * Lädt die Organisationen.
   * Falls eine Organisation bereits geladen wurde, wird man sofort zu dieser weitergeleitet, sonst zur ersten Organisation.
   */
  override ngAfterViewInit() {
    super.ngAfterViewInit(() => {
      if (this.shared.organizations.length) {
        this.router.navigateByUrl("safe/" + this.shared.organizations[0].org_id);
      }
    }, true);
  }
}
