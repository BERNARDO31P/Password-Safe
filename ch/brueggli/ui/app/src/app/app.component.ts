import {AfterViewInit, Component} from "@angular/core";

import {URLSearchParamsPlus} from "../assets/js/url_searchparams";

export type Response = {
  message: string,
  status: string,
  data: any,
  error: any
};

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements AfterViewInit {

  protected API_HOST: string = window.location.origin + "/api";

  protected pageName: string = "Password Safe";
  title: string = "";


  /**
   * Lifecycle-Methode, die nach der Initialisierung der Ansicht aufgerufen wird.
   * Fügt einen Event-Listener für die Navigations-Elemente hinzu.
   */
  ngAfterViewInit() {
    let navLinks = document.querySelectorAll(".navbar .navbar-nav [href]");
    for (let navLink of Object.values(navLinks)) {
      if (navLink.getAttribute("listener") !== "true") {
        navLink.setAttribute("listener", "true");

        navLink.addEventListener("click", (e) => {
          e.preventDefault();

          let navbarCollapse = document.querySelector(".navbar-collapse")!;
          if (navbarCollapse.classList.contains("show")) {
            let navClose = document.querySelector(".navbar-toggler")! as HTMLButtonElement;
            navClose.click();
          }
        });
      }
    }
  }

  /**
   * Sendet eine HTTP-Anfrage an den angegebenen Endpunkt und liefert das Ergebnis zurück.
   * Bei einer Nachricht wird diese angezeigt.
   *
   * @param {string} method Die HTTP-Methode, die verwendet wird (GET, POST, etc.)
   * @param {string} action Die URL des Endpunkts
   * @param {string | FormData | null} data Die zu sendenden Daten
   * @param {Record<string, any> | URLSearchParams | undefined} params Die zu sendenden Parameter
   * @param {boolean} contentType Ob die Anfrage als application/x-www-form-urlencoded gesendet wird
   * @returns {Promise<Response>} Die HTTP-Antwort des Servers
   */
  protected async request(
    method: string, action: string,
    data: string | FormData | null = null,
    params: Record<string, any> | URLSearchParams | undefined = undefined,
    contentType: boolean = false
  ): Promise<Response> {

    let options = {
      method: method,
      body: data,
    } as RequestInit;

    if (contentType) {
      options.headers = {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      };
    }

    const response = await fetch(action + ((params) ? new URLSearchParamsPlus(params): ""), options);

    let parsed: any = {};
    await response.text().then((text) => {
      parsed = JSON.parse(text) as Response;
    });

    if (response.headers.has("Refresh")) {
      setTimeout(() => {
        location.reload();
      }, Number(response.headers.get("Refresh")) * 1000);
    }

    return parsed;
  }
}
