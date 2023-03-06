import {Component, ElementRef, ViewChild} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import Modal from "bootstrap/js/dist/modal";

import {CryptUtils} from "src/assets/js/crypt_utils";

import {AdminComponent} from "src/app/admin/admin.component";

import {Organization} from "src/assets/js/model/Organization";

@Component({
  selector: "app-organizations",
  templateUrl: "./organizations.component.html",
  styleUrls: ["./organizations.component.scss"]
})
export class OrganizationsComponent extends AdminComponent {
  translation: Record<string, string> = {
    org_id: "Organisation ID",
    name: "Name",
    description: "Beschreibung",
    members: "Mitglieder"
  };

  formGroup = new FormGroup({
    name: new FormControl("", [
      Validators.required,
      Validators.min(8),
      Validators.max(32)
    ]),
    description: new FormControl("", [
      Validators.max(256)
    ])
  });

  declare organizations: { data: Array<Organization>, count?: number };
  organization: Organization = {} as Organization;

  @ViewChild("context") declare contextMenu: ElementRef;
  @ViewChild("modal") declare private modalRef: ElementRef;

  declare private modal: Modal;

  override ngAfterViewInit() {
    super.ngAfterViewInit();

    if (this.modalRef !== undefined) {
      this.modal = new Modal(this.modalRef.nativeElement);
    }

    this.setLocation("Organisationen");
    this.loadData();
  }

  /**
   * Führt eine Suche nach Organisationen auf dem Server durch und speichert das Ergebnis in die Liste der Organisationen.
   * @param {Event} event Das Auslöser-Event.
   */
  protected override search(event: Event) {
    super.search(event, this.API_HOST + "/admin/organizations/",(response) => {
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
        this.organizations = structuredClone(response.data) as {data: Array<Organization>, count: number};
      }
    });
  }

  protected add() {
    this.formGroup.reset();
    this.organization = {} as Organization;

    this.modal.show();
  }

  protected async save() {
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
      this.request("POST", this.API_HOST + "/admin/organizations", JSON.stringify(this.formGroup.value)).then(response => {
        if (response.status === "success") {
          this.organizations.data.push(response.data);
          this.organizations.count!++;

          let org_id = response.data.org_id;

          this.request("GET", this.API_HOST + "/admin/users/admins").then(async response => {
            if (response.status === "success") {
              let secret_keys = await CryptUtils.generateSecretKeys(response.data, org_id);

              this.request("PATCH", this.API_HOST + "/admin/organization/keys", JSON.stringify({secret_keys: secret_keys}));
            }
          });

          this.modal.hide();
        }
      });
    }
  }

  protected edit() {
    let id = Number(this.contextMenu.nativeElement.dataset["id"]);
    let index = this.organizations.data.findIndex(org => org.org_id === id);
    this.organization = structuredClone(this.organizations.data[index]) as Organization;

    this.formGroup.patchValue(this.organization);
    this.modal.show();
  }

  protected delete() {
    let id = Number(this.contextMenu.nativeElement.dataset["id"]);
    this.request("DELETE", this.API_HOST + "/admin/organization/" + id).then(response => {
      if (response.status === "success") {
        this.loadData();
      }
    });
  }
}
