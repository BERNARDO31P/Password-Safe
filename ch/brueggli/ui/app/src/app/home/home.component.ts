import {Component} from "@angular/core";
import {AppComponent} from "src/app/app.component";

@Component({
  selector: "home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"]
})
export class HomeComponent extends AppComponent {
  override ngAfterViewInit() {
    super.ngAfterViewInit();

    let health = document.getElementById("health") as HTMLSpanElement;
    this.request("get", this.API_HOST + "/health").then(response => {
      health.innerHTML = "Status: " + response.data.message;
    }).catch(() => {
      health.innerHTML = "Etwas ist schief gelaufen, versuchen Sie es später nochmals";
    });
  }
}
