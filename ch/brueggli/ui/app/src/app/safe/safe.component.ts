import {Component} from "@angular/core";

import {AppComponent} from "src/app/app.component";

@Component({
  selector: "safe",
  templateUrl: "./safe.component.html",
  styleUrls: ["./safe.component.scss"]
})
export class SafeComponent extends AppComponent {
  /**
   * Überschreibt die ngAfterViewInit-Methode von AppComponent-Klasse, um zusätzliche Funktionalität zu implementieren.
   * Setzt den Seitentitel auf "Tresor" und führt einen AJAX-Request zum Abrufen der Tresor-Daten durch, falls load true ist.
   * Ruft die Callback-Funktion auf, sobald die Tresor-Daten abgerufen wurden und aktualisiert das shared-Objekt mit den abgerufenen Daten.
   * @param {function} callback Die Funktion, die aufgerufen werden soll, sobald die Tresor-Daten abgerufen wurden.
   * @param {boolean} load Bestimmt, ob die Tresor-Daten geladen werden sollen oder nicht. Standardmäßig ist dieser Wert auf false gesetzt.
   * @return {void}
   */
  override ngAfterViewInit(callback = () => {
  }, load = false) {
    super.ngAfterViewInit();

    if (typeof this.setLocation !== "undefined")
      this.setLocation("Tresor");

    if (load) this.request("GET", this.API_HOST + "/safe").then(response => {
      if (response.status === "success") {
        this.shared.organizations = response.data;
        callback();
      }
    });
  }
}
