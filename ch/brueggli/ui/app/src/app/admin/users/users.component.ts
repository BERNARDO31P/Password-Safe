import {AfterViewChecked, Component, ElementRef, OnDestroy, ViewChild} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import Modal from "bootstrap/js/dist/modal";

import {AdminComponent} from "src/app/admin/admin.component";

import {CryptUtils} from "src/assets/js/crypt_utils";

import {User} from "src/assets/js/model/User";
import {SecretKey} from "src/assets/js/model/SecretKey";
import {Organization} from "src/assets/js/model/Organization";

@Component({
  selector: "admin-users",
  templateUrl: "./users.component.html",
  styleUrls: ["./users.component.scss"]
})
export class UsersComponent extends AdminComponent implements AfterViewChecked, OnDestroy {
  formGroup = new FormGroup({
    email: new FormControl("", [
      Validators.required,
      Validators.email
    ]),
    first_name: new FormControl("", [
      Validators.required,
      Validators.minLength(4),
      Validators.maxLength(128)
    ]),
    last_name: new FormControl("", [
      Validators.required,
      Validators.minLength(4),
      Validators.maxLength(128)
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

    this.loadData();
  }

  ngAfterViewChecked() {
    this.setLocation("Benutzer");
  }

  ngOnDestroy() {
    if (this.modal !== undefined) this.modal.hide();
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
    this.request("GET", this.API_HOST + "/admin/users", null, {page: this.shared.page, ...this.shared.sorting}).then(response => {
      if (response.status === "success") {
        this.users = response.data;
      }
    });
  }

  /**
   * Speichert die vorgenommenen Änderungen am Benutzer und aktualisiert die Benutzerliste.
   *
   * Sendet eine PATCH-Anfrage an den Server, um die vorgenommenen Änderungen am Benutzer zu speichern und aktualisiert die Benutzerliste auf der Seite.
   *
   * Wenn der Benutzer zu einem Admin wird, wird für jede Organisation der symmetrische Schlüssel geholt.
   * Diese werden für den Benutzer verschlüsselt und im System abgelegt.
   *
   * Wenn der Benutzer kein Admin mehr ist, sendet die Funktion eine DELETE-Anfrage an den Server, um die verschlüsselten Organisationsschlüssel des Benutzers zu entfernen.
   * Generiert die Organisationsschlüssel neu, um Sicherheit zu gewähren.
   */
  protected save() {
    let id = Number(this.modalRef.nativeElement.dataset["id"]);
    this.request("PATCH", this.API_HOST + "/admin/user/" + id, JSON.stringify(this.formGroup.value)).then(async response => {
      if (response.status === "success") {
        this.modal.hide();

        if (this.user.is_admin !== this.formGroup.value.is_admin) {
          this.showLoading();
          if (this.formGroup.value.is_admin) {
            await this.addOrganizationsKey()
          } else {
            let response = await this.request("DELETE", this.API_HOST + "/admin/user/" + id + "/admin");
            if (response.status === "success") {
              await this.renewOrganizationsKeys();
            }
          }
          this.showMessage(response.message, response.status);
        }

        this.user = {...this.user, ...this.formGroup.value as User};

        let index = this.users.data.findIndex(user => user.user_id === id);
        this.users.data[index] = this.user;
      }
    });
  }

  /**
   * Holt die Informationen des ausgewählten Benutzers.
   * Fügt alle bekannten Informationen ein.
   * Öffnet das Modal zum Bearbeiten der Informationen.
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
   * Falls der Benutzer ein Administrator war, werden die Schlüssel von allen Organisationen erneuert.
   * Sonst nur von jeden Organisationen, in welchen der Benutzer Mitglied war.
   */
  protected delete() {
    let id = Number(this.contextMenu.nativeElement.dataset["id"]);

    this.request("GET", this.API_HOST + "/admin/user/" + id + "/organizations").then(response => {
      if (response.status === "success") {
        let index = this.users.data.findIndex((user) => user.user_id === id);
        let user = this.users.data[index];
        let userMember = response.data;

        this.request("DELETE", this.API_HOST + "/admin/user/" + id).then(async response => {
          if (response.status === "success") {
            this.showLoading();

            if (user.is_admin) {
              await this.renewOrganizationsKeys();
            } else {
              for (let member of userMember) {
                await this.renewOrganizationKeys(member.org_id);
              }
            }
            this.showMessage(response.message, response.status);
            this.loadData();
          }
        });
      }
    });
  }

  /**
   * Holt für jede Organisation den symmetrischen Schlüssel für den angemeldeten Benutzer.
   * Diese werden für den neuen Administrator verschlüsselt und im System abgelegt.
   * @returns {Promise<void>} - Ein Promise, welcher die asynchrone Handlung beendet.
   */
  protected async addOrganizationsKey(keyPage: number = 1): Promise<void> {
    let response = await this.request("GET", this.API_HOST + "/admin/organizations/key", null, {page: keyPage});
    if (response.status !== "success" || !response.data.data.length) return;

    keyPage++;

    let public_key = await CryptUtils.getPublicKey(this.user.public_key as string);

    let count = response.data.data.length;
    let secret_keys = [];
    for (let secret_key_admin of response.data.data as Array<SecretKey>) {
      let secret_key = await CryptUtils.decryptSecretKey(secret_key_admin.data as string, this.shared.user.private_key as CryptoKey);
      let data = await CryptUtils.encryptSecretKey(secret_key, public_key);

      let encrypted = {
        user_id: this.user.user_id,
        org_id: secret_key_admin.org_id,
        data: data,
        sign: await CryptUtils.signData(data, this.shared.user.sign_private_key as CryptoKey),
      } as SecretKey;

      secret_keys.push(encrypted);
    }

    response = await this.request("POST", this.API_HOST + "/admin/organizations/key", JSON.stringify({secret_keys: secret_keys}));
    if (response.status === "success" && count === this.PAGE_COUNT) await this.addOrganizationsKey(keyPage);
  }

  /**
   * Erneuert die Schlüssel von allen Organisationen.
   * Verschlüsselt die Daten mit dem neuen Schlüssel.
   * @returns {Promise<void>} - Ein Promise, welcher die asynchrone Handlung beendet.
   */
  protected async renewOrganizationsKeys(organizationPage: number = 1): Promise<void> {
    let response = await this.request("GET", this.API_HOST + "/admin/organizations", null, {page: organizationPage})
    if (response.status !== "success" || !response.data.data.length) return;

    organizationPage++;

    let count = response.data.data.length;
    for (let organization of response.data.data as Array<Organization>) {
      let secret_key = await CryptUtils.generateSecretKey();
      await this.updateOrganizationData(organization.org_id!, secret_key);
      await this.updateOrganizationMembers(organization.org_id!, secret_key);
    }

    if (count === this.PAGE_COUNT) await this.renewOrganizationsKeys(organizationPage);
  }

  /**
   * Aktualisiert die Sortierung der Tabelle und lädt die Daten neu.
   * @param {Event} event Das auslösende Event.
   */
  protected override updateSorting(event: Event): void {
    super.updateSorting(event, () => {
      this.loadData();
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
