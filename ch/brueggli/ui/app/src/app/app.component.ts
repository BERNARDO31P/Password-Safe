import {AfterViewInit, ChangeDetectorRef, Component} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {FormControl} from "@angular/forms";
import {Title} from "@angular/platform-browser";
import Swal, {SweetAlertIcon} from "sweetalert2";

import {URLSearchParamsPlus} from "src/assets/js/url_searchparams";
import {SharedService} from "src/assets/js/shared.service";
import {CryptUtils} from "src/assets/js/crypt_utils";

import {User} from "src/assets/js/model/User";


export type Response = {
  message: string,
  status: string,
  data: any,
  error: any
};

@Component({
  selector: "app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements AfterViewInit {
  protected PAGE_COUNT: number = 10;
  protected API_HOST: string = window.location.origin + "/api";

  protected searching: boolean = true;

  protected pageName: string = "Password Safe";
  title: string = "";
  Object = Object;

  constructor(protected shared: SharedService, private titleService: Title, protected router: Router, protected route: ActivatedRoute, protected changeDetectorRef: ChangeDetectorRef) {
    if (this.shared.user.user_id === undefined) {
      let data = localStorage.getItem("user");
      if (data) {
        this.shared.user = JSON.parse(data);

        CryptUtils.decryptUser(this.shared.user);
      }
    }
  }

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

    if (parsed.message) {
      this.showMessage(parsed.message, parsed.status);
    }

    if (response.status === 403) this.logout(false);

    if (response.headers.has("Refresh")) {
      setTimeout(() => {
        location.reload();
      }, Number(response.headers.get("Refresh")) * 1000);
    }

    return parsed;
  }

  /**
   * Zeigt eine Benachrichtigung auf dem Bildschirm an
   * @param {string} message Die Nachricht, die angezeigt werden soll
   * @param {SweetAlertIcon} type Das Symbol, das in der Benachrichtigung angezeigt werden soll
   */
  protected showMessage(message: string, type: SweetAlertIcon): void {
    Swal.fire({
      title: message,
      icon: type,
      position: "top-end",
      timer: 2000,
      toast: true,
      showConfirmButton: false,
      timerProgressBar: true
    });
  }

  /**
   * Überprüft das FormControl-Objekt auf Gültigkeit.
   * @param {FormControl<string | null>} control Das FormControl-Objekt, das auf Gültigkeit überprüft werden soll.
   * @param {string} error Der optionale Fehler, der überprüft werden soll.
   * @return {boolean} Gibt true zurück, wenn das FormControl-Objekt ungültig ist oder der übergebene Fehler vorliegt. Gibt false zurück, wenn das FormControl-Objekt gültig ist und kein Fehler vorliegt.
   */
  protected checkFormControl(control: FormControl<string | null>, error?: string): boolean {
    if (control.dirty || control.touched) {
      if (typeof error !== "undefined") {
        return control.hasError(error);
      }
      return control.invalid;
    }
    return false;
  }

  /**
   * Setzt den Titel der Webseite und den aktiven Link in der Navigation.
   * @param {string} location Der Name des Links, der aktuell angewählt wurde.
   */
  protected setLocation(location: string): void {
    this.title = this.pageName + " - " + location;
    this.titleService.setTitle(this.title);

    let navElements = document.querySelectorAll(".nav-link");
    navElements.forEach(element => {
      let textContent = element.textContent!.split(" ")[0];

      if (textContent.toLowerCase() !== location.toLowerCase()) {
        element.classList.remove("active");
        return;
      }

      element.classList.add("active");
    });
  }

  /**
   * Überprüft, ob das bereitgestellte Datenobjekt gültige Daten enthält.
   * @param {object} data - Das zu überprüfende Datenobjekt.
   * @returns {number} - Gibt 0 zurück, wenn die Daten gültig sind.
   *                    1, wenn die Daten nicht definiert/leer sind.
   *                    2, wenn die Daten ungültig sind.
   */
  protected hasData(data: {data: Array<any>|string, count?: number}): number
  {
    if (data === undefined) return 1;
    if (data.data === undefined || data.data.length === 0 || typeof data.data === "string") return 2;
    return 0;
  }

  /**
   * Aktualisiert das Kontextmenü und zeigt ihn an.
   * Die ID vom Datensatz wird gesetzt.
   * Event-Listener werden gesetzt, damit das Menü sich wieder schliesst.
   * @param {MouseEvent} event Das Ereignis, das den Kontextmenü-Dialog ausgelöst hat.
   * @param {function} callback Die Rückruffunktion, die aufgerufen wird, wenn das Kontextmenü angezeigt wird.
   */
  protected updateContext(event: MouseEvent, callback: (id: number, context: HTMLDivElement) => void = () => {
  }) {
    event.preventDefault();

    let context = document.getElementById("contextmenu") as HTMLDivElement;
    let id = (event.currentTarget as HTMLTableRowElement).dataset["id"];
    context.dataset["id"] = id;

    context.style.top = event.pageY - 5 + "px";
    context.style.left = event.pageX - 5 + "px";

    document.addEventListener('click', function contextClose(event: MouseEvent) {
      let element = event.target as HTMLElement;

      if (!element.closest("#contextmenu")) {
        context.classList.remove("show");
        document.removeEventListener('click', contextClose);
      }
    });

    let contextButtons = context.querySelectorAll("button");
    contextButtons.forEach(contextButton => {
      if (contextButton.getAttribute("listener") !== "true") {
        contextButton.setAttribute("listener", "true");

        contextButton.addEventListener("click", () => {
          context.classList.remove("show");
        });
      }
    });

    callback(Number(id), context);

    context.classList.add("show");
  }

  /**
   * Führt eine Suche auf dem Server durch und ruft die angegebene Callback-Funktion mit der Antwort vom Server auf.
   * @param {Event} event Das auslösende Event.
   * @param {string} endpoint Der API-Endpunkt, auf dem gesucht werden soll.
   * @param {function} callback Die Callback-Funktion, die mit der Antwort aufgerufen werden soll.
   */
  protected search(event: Event, endpoint: string, callback: (response: Response) => void) {
    let input = event.currentTarget as HTMLInputElement;

    this.searching = Boolean(input.value);

    this.request("GET", endpoint + input.value).then(response => {
      callback(response);
    });
  }

  /**
   * Loggt den Benutzer aus und leitet ihn auf die Startseite weiter
   */
  protected logout(request: boolean = true) {
    // Dies wird gemacht, da die "this"-Referenz mit der setTimeout Funktion überschrieben wird
    let ngAfterViewInit = this.ngAfterViewInit;

    let callback = () => {
      this.shared.user = {} as User;

      localStorage.removeItem("user");

      this.router.navigateByUrl("/home").then(() => {
        setTimeout(() => ngAfterViewInit());
      });
    }

    if (request) {
      this.request("GET", this.API_HOST + "/auth/logout").finally(callback);
    } else callback();
  }
}
