import {Component, ElementRef, ViewChild} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import Modal from "bootstrap/js/dist/modal";

import {CryptUtils} from "src/assets/js/crypt_utils";

import {AdminComponent} from "src/app/admin/admin.component";

import {User} from "src/assets/js/model/User";
import {SecretKey} from "src/assets/js/model/SecretKey";
import {Organization} from "src/assets/js/model/Organization";
import {Password} from "src/assets/js/model/Password";
import {Member} from "src/assets/js/model/Member";

@Component({
  selector: "admin-users",
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
   *
   * TODO: Check comment
   */
  protected save() {
    let id = Number(this.modalRef.nativeElement.dataset["id"]);
    this.request("PATCH", this.API_HOST + "/admin/user/" + id, JSON.stringify(this.formGroup.value)).then(response => {
      if (response.status === "success") {
        if (this.user.is_admin !== this.formGroup.value.is_admin) {
          if (this.formGroup.value.is_admin) {
            this.addOrganizationsKey();
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

  // TODO: Comment
  private async updateOrganizationData(organization: Organization, secret_key: CryptoKey): Promise<void> {
    return await new Promise(async (resolve, reject) => {
      let response = await this.request("GET", this.API_HOST + "/admin/organization/" + organization.org_id + "/key");
      if (response.status !== "success") reject();

      let secret_key_old = await CryptUtils.decryptSecretKey(response.data.secret_key, this.shared.user.private_key as CryptoKey);

      let passwordPage = 1;
      let passwordInterval = setInterval(async () => {
        response = await this.request("GET", this.API_HOST + "/safe/" + organization.org_id, null, {page: passwordPage});
        if (response.status !== "success") reject();
        if (!response.data.data.length) {
          clearInterval(passwordInterval);
          resolve();
        }

        passwordPage++;

        let passwords = [];
        for (let password of response.data.data as Array<Password>) {
          let decrypted = await CryptUtils.decryptData(password.data as string, secret_key_old);
          password.data = await CryptUtils.encryptData(decrypted, secret_key);

          passwords.push(password);
        }

        response = await this.request("PATCH", this.API_HOST + "/safe/" + organization.org_id, JSON.stringify({passwords: passwords}));
        if (response.status !== "success") reject();
      }, 1000);
    });
  }

  // TODO: Comment
  private async updateOrganizationMembers(organization: Organization, secret_key: CryptoKey): Promise<void> {
    return await new Promise(async (resolve, reject) => {
      let memberPage = 1;
      let memberInterval = setInterval(async () => {
        let response = await this.request("GET", this.API_HOST + "/admin/organization/" + organization.org_id + "/members", null, {page: memberPage});
        if (response.status !== "success") reject();
        if (!response.data.data.length) {
          clearInterval(memberInterval);
          resolve();
        }

        memberPage++;

        let secret_keys = [];
        for (let member of response.data.data as Array<Member>) {
          let response = await this.request("GET", this.API_HOST + "/admin/user/" + member.user_id + "/key");
          if (response.status !== "success") reject();

          let public_key = await CryptUtils.getPublicKey(response.data.public_key);

          let secret_key_encrypted = {
            user_id: member.user_id,
            org_id: organization.org_id,
            secret_key: await CryptUtils.encryptSecretKey(secret_key as CryptoKey, public_key)
          } as SecretKey;

          secret_keys.push(secret_key_encrypted);
        }

        this.request("PATCH", this.API_HOST + "/admin/organization/keys", JSON.stringify({secret_keys: secret_keys}));
      }, 1000);
    });
  }

  // TODO: Comment
  protected async addOrganizationsKey(): Promise<void> {
    return await new Promise((resolve) => {
      let keyPage = 1;
      let keyInterval = setInterval(() => {
        this.request("GET", this.API_HOST + "/admin/organizations/key", null, {page: keyPage}).then(async response => {
          if (response.status === "success") {
            if (!response.data.data.length) {
              clearInterval(keyInterval);
              resolve();
            }

            keyPage++;

            let public_key = await CryptUtils.getPublicKey(this.user.public_key as string);

            let secret_keys = [];
            for (let secret_key_admin of response.data.data as Array<SecretKey>) {
              let secret_key = await CryptUtils.decryptSecretKey(secret_key_admin.secret_key as string, this.shared.user.private_key as CryptoKey);

              let secret_key_user = {
                user_id: this.user.user_id,
                org_id: secret_key_admin.org_id,
                secret_key: await CryptUtils.encryptSecretKey(secret_key, public_key)
              } as SecretKey;

              secret_keys.push(secret_key_user);
            }

            this.request("POST", this.API_HOST + "/admin/organizations/key", JSON.stringify({secret_keys: secret_keys}));
          }
        });
      }, 1000);
    });
  }

  /**
   * Erneuert die Schlüssel von allen Organisationen.
   * @returns {Promise<void>} - Ein Promise, welcher die asynchrone Handlung beendet.
   *
   * TODO: Check comment
   */
  protected async renewOrganizationsKeys(): Promise<void> {
    let organizationPage = 1;
    return new Promise((resolve) => {
      let organizationInterval = setInterval(async () => {
        let response = await this.request("GET", this.API_HOST + "/admin/organizations", null, {page: organizationPage})
        if (response.status === "success") {
          if (!response.data.data.length) {
            clearInterval(organizationInterval);
            resolve();
          }

          organizationPage++;

          for (let organization of response.data.data as Array<Organization>) {
            let secret_key = await CryptUtils.generateSecretKey();
            await this.updateOrganizationData(organization, secret_key);
            await this.updateOrganizationMembers(organization, secret_key);
          }
        }
      }, 1000);
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
