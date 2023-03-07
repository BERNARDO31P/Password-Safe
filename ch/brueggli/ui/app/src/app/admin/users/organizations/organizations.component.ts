import {ChangeDetectorRef, Component, ElementRef, ViewChild} from "@angular/core";
import {Title} from "@angular/platform-browser";
import {ActivatedRoute, Router} from "@angular/router";
import {Location} from "@angular/common";

import {SharedService} from "src/assets/js/shared.service";
import {CryptUtils} from "src/assets/js/crypt_utils";

import {OrganizationsComponent} from "src/app/admin/organizations/organizations.component";

import {User} from "src/assets/js/model/User";
import {Member} from "src/assets/js/model/Member";
import {SecretKey} from "src/assets/js/model/SecretKey";


@Component({
  selector: "admin-users-organizations",
  templateUrl: "./organizations.component.html",
  styleUrls: ["./organizations.component.scss"]
})
export class UserOrganizationsComponent extends OrganizationsComponent {
  userOrganizations: Array<Member> = [];
  user: User = {} as User;

  @ViewChild("context") declare contextMenu: ElementRef;

  constructor(shared: SharedService, titleService: Title, router: Router, route: ActivatedRoute, changeDetectorRef: ChangeDetectorRef, private location: Location) {
    super(shared, titleService, router, route, changeDetectorRef);
  }

  /**
   * Holt die Informationen des Benutzers.
   * Holt die Mitgliedschaften von den Organisationen des entsprechenden Benutzers.
   */
  override ngAfterViewInit() {
    super.ngAfterViewInit();

    let user_id = Number(this.route.snapshot.params["id"]);
    this.request("GET", this.API_HOST + "/admin/user/" + user_id).then(response => {
      if (response.status === "success") {
        this.user = response.data;
      }
    });

    this.request("GET", this.API_HOST + "/admin/user/" + user_id + "/organizations").then(response => {
      if (response.status === "success") {
        this.userOrganizations = response.data;
      }
    });
  }

  /**
   * Führt die Methode aus der Basisklasse aus.
   * Zeigt einen neuen Knopf an, je nachdem ob der Benutzer der Organisation dazugehört oder nicht. (Hinzufügen, Entfernen)
   * @param {MouseEvent} event Das Ereignis, das den Kontextmenü-Dialog ausgelöst hat.
   */
  protected override updateContext(event: MouseEvent) {
    super.updateContext(event, (id, context) => {
      let buttons = context.querySelectorAll("button");

      buttons.forEach(button => {
        button.classList.add("hidden");
      });

      if (!this.isInOrganization(id)) {
        context.querySelector("#add")!.classList.remove("hidden");
      } else {
        context.querySelector("#remove")!.classList.remove("hidden");
      }
    });
  }

  /**
   * Führt eine Suche auf dem Server durch, indem die Methode aus der Basisklasse aufgerufen wird.
   * Diese verarbeitet auch gleich die Ergebnisse.
   * @param {Event} event Das auslösende Ereignis.
   */
  protected override search(event: Event) {
    super.search(event);
  }

  /**
   * Holt den öffentlichen Schlüssel der Organisation, welcher für den angemeldeten Benutzer bestimmt ist und entschlüsselt diesen.
   * Holt den öffentlichen Schlüssel des Benutzers.
   * Verschlüsselt den öffentlichen Schlüssel der Organisation mit dem Schlüssel des Benutzers.
   * Sendet die verschlüsselten Daten an den Server.
   */
  protected override add() {
    let org_id = Number(this.contextMenu.nativeElement.dataset["id"]);
    this.request("GET", this.API_HOST + "/admin/organization/" + org_id + "/key").then(async response => {
      if (response.status === "success") {
        let secret_key_entry = response.data;
        let secret_key = await CryptUtils.decryptSecretKey(secret_key_entry.secret_key, this.shared.user.private_key as CryptoKey);

        this.request("GET", this.API_HOST + "/admin/user/" + this.user.user_id + "/key").then(async response => {
          if (response.status === "success") {
            let public_key = await CryptUtils.getPublicKey(response.data.public_key);
            let encrypted_key = await CryptUtils.encryptSecretKey(secret_key, public_key);

            let secret_key_entry = {
              secret_key: encrypted_key,
              user_id: this.user.user_id,
              org_id: org_id,
            } as SecretKey;

            this.request("POST", this.API_HOST + "/admin/organization/key", JSON.stringify({secret_key: secret_key_entry})).then(response => {
              if (response.status === "success") {
                let member_entry = {
                  user_id: this.user.user_id,
                  org_id: org_id,
                } as Member;

                this.request("POST", this.API_HOST + "/admin/organization/member", JSON.stringify({member: member_entry})).then(response => {
                  if (response.status === "success") {
                    this.userOrganizations.push(member_entry);
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  /**
   * Holt den öffentlichen Schlüssel der Organisation, welcher für den angemeldeten Benutzer bestimmt ist und entschlüsselt diesen.
   * Holt den öffentlichen Schlüssel des Benutzers.
   * Verschlüsselt den öffentlichen Schlüssel der Organisation mit dem Schlüssel des Benutzers.
   * Sendet die verschlüsselten Daten an den Server.
   */
  protected remove() {
    let org_id = Number(this.contextMenu.nativeElement.dataset["id"]);
    let member_entry = {
      user_id: this.user.user_id,
      org_id: org_id
    } as Member;

    this.request("DELETE", this.API_HOST + "/admin/organization/member", JSON.stringify({member: member_entry})).then(response => {
      if (response.status === "success") {
        let member_index = this.userOrganizations.findIndex(member => member.org_id === org_id);
        this.userOrganizations.splice(member_index, 1);

        //if (!this.user.is_admin) this.renewOrganizationKeys();
      }
    });
  }

  /**
   * Überprüft, ob der Benutzer zur angegebenen Organisation dazugehört.
   * @param {number | undefined} org_id Die ID der Organisation, die überprüft werden soll.
   * @return {boolean} Gibt true zurück, wenn der Benutzer in der angegebenen Organisation ist, sonst false.
   */
  protected isInOrganization(org_id: number | undefined): boolean {
    if (!this.userOrganizations.length) return false;

    let index = this.userOrganizations.findIndex(member => member.org_id === org_id);
    return index !== -1;
  }

  /**
   * Geht einen Schritt zurück in der Browser-Historie.
   */
  protected goBack(): void {
    this.location.back();
  }
}
