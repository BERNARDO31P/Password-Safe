import {Component, ElementRef, ViewChild} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import Modal from "bootstrap/js/dist/modal";

import {CryptUtils} from "src/assets/js/crypt_utils";

import {AdminComponent} from "src/app/admin/admin.component";

import {User} from "src/assets/js/model/User";

@Component({
  selector: "app-users",
  templateUrl: "./users.component.html",
  styleUrls: ["./users.component.scss"]
})
export class UsersComponent extends AdminComponent {
  formGroup = new FormGroup({
    email: new FormControl("", [
      Validators.required,
      Validators.email
    ]),
    first_name: new FormControl("", [
      Validators.required,
      Validators.minLength(4)
    ]),
    last_name: new FormControl("", [
      Validators.required,
      Validators.minLength(4)
    ]),
    is_admin: new FormControl(),
    is_suspended: new FormControl()
  });

  translation: Record<string, string> = {
    user_id: "Benutzer ID",
    first_name: "Vorname",
    last_name: "Nachname",
    email: "E-Mail Adresse",
    organizations: "Organisationen",
    is_admin: "Administration",
    is_suspended: "Ausgeschlossen",
    last_login: "Letzte Anmeldung",
    password: "Passwort"
  };

  declare users: { data: Array<User>, count?: number };
  user: User = {} as User;

  @ViewChild("context") declare private contextMenu: ElementRef;
  @ViewChild("modal") declare private modalRef: ElementRef;

  declare private modal: Modal;

  /**
   * Funktion, die nach der Initialisierung der Komponente aufgerufen wird.
   * Lädt die Daten und verarbeitet diese.
   */
  override ngAfterViewInit() {
    super.ngAfterViewInit();

    if (this.modalRef !== undefined) {
      this.modal = new Modal(this.modalRef.nativeElement);
    }

    this.setLocation("Benutzer");
    this.loadData();
  }

  /**
   * Führt eine Suche nach Benutzern auf dem Server durch und speichert das Ergebnis in die Benutzerliste.
   * @param {Event} event Das Auslöser-Event.
   */
  protected override search(event: Event) {
    super.search(event, this.API_HOST + "/admin/users/", (response) => {
      if (response.status === "success") {
        this.users = response.data;
      }
    });
  }

  /**
   * Lädt die benötigten Daten für die Darstellung der Benutzerliste.
   */
  protected loadData() {
    this.request("GET", this.API_HOST + "/admin/users", null, {page: this.shared.page}).then(response => {
      if (response.status === "success") {
        this.users = structuredClone(response.data) as { data: Array<User>, count: number };
      }
    });
  }

  /**
   * Speichert die vorgenommenen Änderungen am Benutzer und aktualisiert die Benutzerliste.
   *
   * Sendet eine PATCH-Anfrage an den Server, um die vorgenommenen Änderungen am Benutzer zu speichern und aktualisiert die Benutzerliste auf der Seite.
   *
   * Wenn der Benutzer zu einem Admin wird, ruft die Funktion die Liste aller Organisationen und deren geheime Schlüssel vom angemeldeten Benutzer ab.
   * Verschlüsselt die Schlüssel mit dem öffentlichen Schlüssel des zu bearbeitenden Benutzers.
   *
   * Wenn der Benutzer kein Admin mehr ist, sendet die Funktion eine DELETE-Anfrage an den Server, um die verschlüsselten Organisationsschlüssel des Benutzers zu entfernen.
   * Generiert die Organisationsschlüssel neu, um Sicherheit zu gewähren.
   */
  protected save() {
    let id = Number(this.modalRef.nativeElement.dataset["id"]);
    this.request("PATCH", this.API_HOST + "/admin/user/" + id, JSON.stringify(this.formGroup.value)).then(response => {
      if (response.status === "success") {
        if (this.user.is_admin !== this.formGroup.value.is_admin) {
          if (this.formGroup.value.is_admin) {
            this.request("GET", this.API_HOST + "/admin/organizations/key").then(async response => {
              if (response.status === "success") {
                let public_key = await CryptUtils.getPublicKey(this.user.public_key as string);

                let data = {} as Record<string, string>;
                for (let org of response.data) {
                  let secret_key = await CryptUtils.decryptSecretKey(org.secret_key, this.shared.user.private_key as CryptoKey);

                  data[org.org_id] = await CryptUtils.encryptSecretKey(secret_key, public_key);
                }

                this.request("PATCH", this.API_HOST + "/admin/user/" + id + "/admin", JSON.stringify({data: data}));
              }
            });
          } else {
            this.request("DELETE", this.API_HOST + "/admin/user/" + id + "/admin").then(response => {
              if (response.status === "success") {
                this.renewOrganizationsKeys();
              }
            });
          }
        }

        this.user = {...this.user, ...this.formGroup.value as User};

        let index = this.users.data.findIndex(user => user.user_id === id);
        this.users.data[index] = this.user;

        this.modal.hide();
      }
    });
  }

  /**
   * Holt die Informationen des ausgewählten Benutzers.
   * Fügt alle Informationen bekannten Informationen ein.
   * Öffnet das Modal zum Bearbeiten des ausgewählten Benutzers.
   */
  protected edit() {
    let id = Number(this.contextMenu.nativeElement.dataset["id"]);
    this.request("GET", this.API_HOST + "/admin/user/" + id).then(response => {
      this.user = structuredClone(response.data) as User;

      this.formGroup.patchValue(response.data);
      this.changeDetectorRef.detectChanges();

      this.modal.show();
    });
  }

  /**
   * Löscht den ausgewählten Benutzer aus dem System.
   */
  protected delete() {
    let id = Number(this.contextMenu.nativeElement.dataset["id"]);

    this.request("DELETE", this.API_HOST + "/admin/user/" + id).then(async response => {
      if (response.status === "success") {
        await this.renewOrganizationsKeys();
        this.loadData();
      }
    });
  }

  /**
   * Erneuert die Schlüssel von allen Organisationen.
   * @returns {Promise<void>} - Ein Promise, welcher die asynchrone Handlung beendet.
   */
  protected async renewOrganizationsKeys(): Promise<void> {
    return new Promise((resolve) => {
      this.request("GET", this.API_HOST + "/admin/organizations/keys").then(async response => {
        // TODO: Redo, Database schema changed
      });
    });
  }

  /**
   * Leitet auf die angegebene Route weiter, inklusive des ID-Parameters des entsprechenden Eintrags.
   * @param {Event} event Das auslösende Event.
   * @param {string} route Die Route, auf die weitergeleitet werden soll.
   */
  protected redirect(event: Event, route: string): void {
    let button = event.currentTarget as HTMLButtonElement;
    let context = button.closest("#contextmenu") as HTMLDivElement;
    let id = context.dataset["id"];

    this.router.navigateByUrl(location.pathname + "/" + route + "/" + id);
  }
}
