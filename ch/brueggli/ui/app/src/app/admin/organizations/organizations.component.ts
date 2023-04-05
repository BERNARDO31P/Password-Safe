import {AfterViewChecked, Component, ElementRef, OnDestroy, ViewChild} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import Modal from "bootstrap/js/dist/modal";

import {AdminComponent} from "src/app/admin/admin.component";

import {CryptUtils} from "src/assets/js/crypt_utils";

import {Organization} from "src/assets/js/model/Organization";

@Component({
  selector: "admin-organizations",
  templateUrl: "./organizations.component.html",
  styleUrls: ["./organizations.component.scss"]
})
export class OrganizationsComponent extends AdminComponent implements AfterViewChecked, OnDestroy {
  translation: Record<string, string> = {
    org_id: "Organisation ID",
    name: "Name",
    description: "Beschreibung",
    members: "Mitglieder"
  };

  formGroup = new FormGroup(
    {
      name: new FormControl("", [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(32)
      ]),
      description: new FormControl("", [
        Validators.maxLength(256)
      ])
    },
    {
      updateOn: "change"
    });

  declare organizations: { data: Array<Organization>, count?: number };
  organization: Organization = {} as Organization;

  @ViewChild("context") declare contextMenu: ElementRef;
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
    this.setLocation("Organisationen");
  }

  ngOnDestroy() {
    if (this.modal !== undefined) this.modal.hide();
  }

  /**
   * Führt eine Suche nach Organisationen auf dem Server durch und speichert das Ergebnis in die Liste der Organisationen.
   * @param {Event} event Das Auslöser-Event.
   */
  protected override search(event: Event) {
    super.search(event, this.API_HOST + "/admin/organizations/", (response) => {
      if (response.status === "success") {
        this.organizations = response.data;
      }
    });
  }

  /**
   * Lädt die benötigten Daten für die Darstellung der Liste der Organisationen.
   */
  protected loadData() {
    this.request("GET", this.API_HOST + "/admin/organizations", null, {page: this.shared.page}).then(response => {
      if (response.status === "success") {
        this.organizations = response.data;
      }
    });
  }

  /**
   * Setzt das Formular auf die Standardwerte zurück und öffnet das Modal zum Hinzufügen einer neuen Organisation.
   */
  protected add() {
    this.formGroup.reset();
    this.organization = {} as Organization;

    this.modal.show();
  }

  /**
   * Speichert die Organisation im System.
   * Wenn die ID der Organisation bekannt ist, wird diese angepasst.
   * Sonst wird eine neue mit einem symmetrischen Schlüssel erstellt.
   */
  protected save() {
    if (!this.formGroup.valid) {
      this.showMessage("Programmmanipulation festgestellt", "error");
      return;
    }

    let id = Number(this.modalRef.nativeElement.dataset["id"]);
    if (id) {
      this.request("PATCH", this.API_HOST + "/admin/organization/" + id, JSON.stringify(this.formGroup.value)).then(response => {
        if (response.status === "success") {
          this.organization = {...this.organization, ...this.formGroup.value as Organization};

          let index = this.organizations.data.findIndex(org => org.org_id === id);
          this.organizations.data[index] = this.organization;

          this.modal.hide();
        }
      });
    } else {
      this.request("POST", this.API_HOST + "/admin/organizations", JSON.stringify(this.formGroup.value)).then(async response => {
        if (response.status === "success") {
          this.showLoading();

          this.organizations.data.push(response.data);
          this.organizations.count!++;

          let org_id = response.data.org_id;

          new Promise<void>((resolve) => {
            this.request("GET", this.API_HOST + "/admin/users/admins").then(async response => {
              if (response.status === "success") {
                let secret_keys = await CryptUtils.generateSecretKeys(response.data, org_id, this.shared.user.sign_private_key as CryptoKey);

                await this.request("POST", this.API_HOST + "/admin/organization/keys", JSON.stringify({secret_keys: secret_keys}));
                resolve();
              }
            });
          }).then(() => {
            this.showMessage(response.message, response.status);
            this.modal.hide();
          });
        }
      });
    }
  }

  /**
   * Fügt alle bekannten Informationen der ausgewählten Organisation ein.
   * Öffnet das Modal zum Bearbeiten der Informationen.
   */
  protected edit() {
    let id = Number(this.contextMenu.nativeElement.dataset["id"]);
    let index = this.organizations.data.findIndex(org => org.org_id === id);
    this.organization = structuredClone(this.organizations.data[index]) as Organization;

    this.formGroup.patchValue(this.organization);
    this.modal.show();
  }

  /**
   * Löscht die ausgewählte Organisation aus dem System.
   */
  protected delete() {
    let id = Number(this.contextMenu.nativeElement.dataset["id"]);
    this.request("DELETE", this.API_HOST + "/admin/organization/" + id).then(response => {
      if (response.status === "success") {
        this.loadData();
      }
    });
  }

  /**
   * Erneuert den symmetrischen Schlüssel der Organisation.
   * Verschlüsselt die Daten mit dem neuen Schlüssel.
   * Verschlüsselt den Schlüssel für die Mitglieder der Organisation.
   */
  protected async renewKeys() {
    let id = Number(this.contextMenu.nativeElement.dataset["id"]);

    let secret_key = await CryptUtils.generateSecretKey();

    this.showLoading();
    await this.updateOrganizationData(id, secret_key);
    await this.updateOrganizationMembers(id, secret_key);

    this.showMessage("Schlüssel erfolgreich erneuert", "success");
  }
}
