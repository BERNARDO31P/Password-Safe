import {ChangeDetectorRef, Component} from "@angular/core";
import {Title} from "@angular/platform-browser";
import {ActivatedRoute, Router} from "@angular/router";

import {AppComponent} from "src/app/app.component";

import {SharedService} from "src/assets/js/shared.service";
import {CryptUtils} from "src/assets/js/crypt_utils";

import {Password} from "src/assets/js/model/Password";
import {Member} from "src/assets/js/model/Member";
import {SecretKey} from "src/assets/js/model/SecretKey";

@Component({
  selector: "admin",
  templateUrl: "./admin.component.html",
  styleUrls: ["./admin.component.scss"]
})
export class AdminComponent extends AppComponent {
  constructor(shared: SharedService, titleService: Title, router: Router, route: ActivatedRoute, changeDetectorRef: ChangeDetectorRef) {
    super(shared, titleService, router, route, changeDetectorRef);
  }

  override ngAfterViewInit() {
    super.ngAfterViewInit();

    this.setLocation("Admin");
  }

  /**
   * Erneuert die Schlüssel einer Organisation.
   * @param org_id - Die ID der Organisation
   * @returns {Promise<void>} - Ein Promise, das zurückgegeben wird, wenn die Aktualisierung der Daten abgeschlossen ist.
   */
  protected async renewOrganizationKeys(org_id: number): Promise<void> {
    let secret_key = await CryptUtils.generateSecretKey();

    await this.updateOrganizationData(org_id, secret_key);
    await this.updateOrganizationMembers(org_id, secret_key);
  }

  /**
   * Aktualisiert die Daten der Organisation mit dem neuen symmetrischen Schlüssel.
   * @param {number} org_id - Die ID der Organisation.
   * @param {CryptoKey} secret_key - Der neue symmetrische Schlüssel.
   * @param {CryptoKey} secret_key_old - Der alte symmetrische Schlüssel.
   * @param {number} [passwordPage=1] - Die Seitennummer für die Passwortliste. Standardmäßig wird die Seite 1 verwendet.
   * @returns {Promise<void>} - Ein Promise, das zurückgegeben wird, wenn die Aktualisierung der Daten abgeschlossen ist.
   */
  private async updateData(org_id: number, secret_key: CryptoKey, secret_key_old: CryptoKey, passwordPage: number = 1): Promise<void> {
    let response = await this.request("GET", this.API_HOST + "/safe/" + org_id, null, {page: passwordPage});
    if (response.status !== "success" || !response.data.data.length) return;

    passwordPage++;

    let passwords = [];
    for (let password of response.data.data as Array<Password>) {
      let decrypted = await CryptUtils.decryptData(password.data as string, secret_key_old);
      password.data = await CryptUtils.encryptData(decrypted, secret_key);

      passwords.push(password);
    }

    response = await this.request("PATCH", this.API_HOST + "/safe/" + org_id, JSON.stringify({passwords: passwords}));
    if (response.status === "success") await this.updateData(org_id, secret_key, secret_key_old, passwordPage);
  }

  /**
   * Aktualisiert die Schlüssel der Mitglieder für eine Organisation mit dem neuen symmetrischen Schlüssel.
   * @param {number} org_id - Die ID der Organisation.
   * @param {CryptoKey} secret_key - Der neue symmetrische Schlüssel.
   * @param {number} [memberPage=1] - Die Seitennummer für die Mitgliederliste. Standardmäßig wird die Seite 1 verwendet.
   * @returns {Promise<void>} - Ein Promise, das zurückgegeben wird, wenn die Aktualisierung der Mitglieder abgeschlossen ist.
   */
  protected async updateOrganizationMembers(org_id: number, secret_key: CryptoKey, memberPage: number = 1): Promise<void> {
    let response = await this.request("GET", this.API_HOST + "/admin/organization/" + org_id + "/members", null, {page: memberPage});
    if (response.status !== "success" || !response.data.data.length) return;

    memberPage++;

    let secret_keys = [];
    for (let member of response.data.data as Array<Member>) {
      let response = await this.request("GET", this.API_HOST + "/admin/user/" + member.user_id + "/key");
      if (response.status !== "success") {
        this.showMessage("Erfolgreich alle Schlüssel erneuert", "success");
        return;
      }

      let public_key = await CryptUtils.getPublicKey(response.data.public_key);

      let secret_key_encrypted = {
        user_id: member.user_id,
        org_id: org_id,
        secret_key: await CryptUtils.encryptSecretKey(secret_key as CryptoKey, public_key)
      } as SecretKey;

      secret_keys.push(secret_key_encrypted);
    }

    response = await this.request("PATCH", this.API_HOST + "/admin/organization/keys", JSON.stringify({secret_keys: secret_keys}));
    if (response.status === "success") await this.updateOrganizationMembers(org_id, secret_key, memberPage);
  }

  /**
   * Aktualisiert die Daten der Organisation mit dem neuen symmetrischen Schlüssel und dem alten symmetrischen Schlüssel, der vom Server abgerufen wird.
   * @param {number} org_id - Die ID der Organisation.
   * @param {CryptoKey} secret_key - Der neue symmetrische Schlüssel.
   * @returns {Promise<void>} - Ein Promise, das zurückgegeben wird, wenn die Aktualisierung der Daten abgeschlossen ist.
   */
  protected async updateOrganizationData(org_id: number, secret_key: CryptoKey): Promise<void> {
    let response = await this.request("GET", this.API_HOST + "/admin/organization/" + org_id + "/key");
    if (response.status !== "success") return;

    let secret_key_old = await CryptUtils.decryptSecretKey(response.data.secret_key, this.shared.user.private_key as CryptoKey);

    await this.updateData(org_id, secret_key, secret_key_old);
  }

}
