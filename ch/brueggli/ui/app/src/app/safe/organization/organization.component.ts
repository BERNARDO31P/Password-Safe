import {Component, ElementRef, OnDestroy, ViewChild} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";

import RandExp from "randexp";
import Modal from "bootstrap/js/dist/modal";

import {SafeComponent} from "src/app/safe/safe.component";

import {CustomValidators} from "src/assets/js/validators";
import {CryptUtils} from "src/assets/js/crypt_utils";

import {Password} from "src/assets/js/model/Password";
import {Organization} from "src/assets/js/model/Organization";
import {Credentials} from "src/assets/js/model/Credentials";


@Component({
  selector: "safe-organization",
  templateUrl: "./organization.component.html",
  styleUrls: ["./organization.component.scss"]
})
export class SafeOrganizationComponent extends SafeComponent implements OnDestroy {
  translation: Record<string, string> = {
    pass_id: "Passwort ID",
    name: "Name",
    description: "Beschreibung",
    account: "Benutzername/E-Mail",
    password: "Passwort",
  };

  formGroup = new FormGroup(
    {
      name: new FormControl("", [
        Validators.required,
        Validators.minLength(4)
      ]),
      description: new FormControl("", [
        Validators.maxLength(256)
      ]),
      url: new FormControl("", [
        Validators.pattern(/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&\/=]*$/)
      ]),
      data: new FormGroup({
          account: new FormControl("", [
            Validators.required,
            Validators.minLength(4)
          ]),
          password: new FormControl("", [
            Validators.required,
            CustomValidators.password({"password": true})
          ]),
          password_repeat: new FormControl("", [
            Validators.required,
          ]),
        },
        {
          validators: [
            CustomValidators.match("password", "password_repeat"),
          ],
          updateOn: "change"
        }
      ),
    },
    {
      updateOn: "change"
    }
  );

  passwords!: { data: Array<Password>, count?: number };
  password: Password = {} as Password;
  organization!: Organization;
  secret_key!: CryptoKey;

  @ViewChild("context") declare private contextMenu: ElementRef;
  @ViewChild("modal") declare private modalRef: ElementRef;

  declare private modal: Modal;

  /**
   * Lädt die benötigten Daten für die Darstellung des Tresors.
   * Entschlüsselt die Daten mit dem Schlüssel vom Benutzer.
   * @param {function} callback Die Funktion, die aufgerufen wird, wenn die Daten vollständig geladen sind.
   */
  protected loadData(callback = () => {
  }) {
    let id = Number(this.route.snapshot.params["id"]);
    let index = this.shared.organizations.findIndex(org => org.org_id === id);

    if (index !== -1) {
      this.request("GET", this.API_HOST + "/safe/" + id, null, {page: this.shared.page, ...this.shared.sorting}).then(response => {
        if (response.status === "success") {
          this.passwords = response.data;
          this.organization = this.shared.organizations[index];

          this.request("GET", this.API_HOST + "/safe/" + id + "/key").then(async response => {
            if (response.status === "success") {
              this.secret_key = await CryptUtils.decryptSecretKey(response.data.data, this.shared.user.private_key as CryptoKey);

              for (let password of this.passwords.data) {
                password.data = await CryptUtils.decryptData(password.data as string, this.secret_key);
              }

              callback();
            }
          });
        }
      });
    } else {
      this.router.navigateByUrl("/safe");
    }
  }

  /**
   * Funktion, die nach der Initialisierung der Komponente aufgerufen wird.
   * Ruft die Elternklasse mit einer Callback-Funktion auf.
   * Lädt die Daten und verarbeitet diese.
   * Die Daten werden jeweils neu geladen, sobald die Organisation gewechselt wird.
   */
  override ngAfterViewInit() {
    super.ngAfterViewInit(() => {
      this.route.params.subscribe(params => {
        if (typeof params["id"] !== undefined) this.loadData();
      });
    }, true);

    if (this.modalRef !== undefined) {
      this.modal = new Modal(this.modalRef.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.modal !== undefined) this.modal.hide();
  }

  /**
   * Führt die Methode auf der Basisklasse aus.
   * Zeigt den Knopf zum Öffnen der URL nur an, wenn eine URL vorhanden ist.
   * @param {MouseEvent} event Das Auslöser-Event.
   */
  protected override updateContext(event: MouseEvent) {
    super.updateContext(event, (id, context) => {
      let index = this.passwords.data.findIndex(password => password.pass_id === id);
      let password = this.passwords.data[index];

      let openURL = context.querySelector("#openURL") as HTMLButtonElement;

      if (password.url === "") {
        openURL.classList.add("hidden");
      } else {
        openURL.classList.remove("hidden");
      }
    });
  }

  /**
   * Führt eine Suche nach Passwörtern auf dem Server durch und speichert das Ergebnis in die Passwortliste.
   * @param {Event} event Das Auslöser-Event.
   */
  protected override search(event: Event) {
    if (this.organization) {
      super.search(event, this.API_HOST + "/safe/" + this.organization.org_id + "/", async (response) => {
        if (response.status === "success") {
          this.passwords = response.data;

          for (let password of this.passwords.data) {
            password.data = await CryptUtils.decryptData(password.data as string, this.secret_key);
          }
        }
      });
    }
  }

  /**
   * Setzt das Formular auf die Standardwerte zurück und öffnet das Modal zum Hinzufügen eines neuen Passworts.
   */
  protected add() {
    this.formGroup.reset();
    this.password = {} as Password;

    this.modal.show();
  }

  /**
   * Fügt alle bekannten Informationen des ausgewählten Passworts ein.
   * Öffnet das Modal zum Bearbeiten der Informationen.
   */
  protected edit() {
    let id = Number(this.contextMenu.nativeElement.dataset["id"]);
    let index = this.passwords.data.findIndex(password => password.pass_id === id);
    this.password = this.passwords.data[index];

    this.formGroup.patchValue(this.password as any);
    this.changeDetectorRef.detectChanges();

    this.modal.show();
  }

  /**
   * Löscht das ausgewählte Passwort aus dem System.
   */
  protected delete() {
    let id = Number(this.contextMenu.nativeElement.dataset["id"]);
    let index = this.passwords.data.findIndex(password => password.pass_id === id);
    let password = this.passwords.data[index];

    this.request("DELETE", this.API_HOST + "/safe", JSON.stringify(password)).then(async response => {
      if (response.status === "success") {
        this.loadData();
      }
    });
  }

  /**
   * Speichert das Passwort im Tresor.
   * Wenn die ID des Passworts bekannt ist, wird dieses angepasst.
   * Sonst wird ein neues erstellt.
   */
  protected async save() {
    if (this.hasErrors(this.formGroup.controls, "password")) {
      this.showMessage("Programmmanipulation festgestellt", "error");
      return;
    }

    let org_id = Number(this.route.snapshot.params["id"]);
    let id = Number(this.modalRef.nativeElement.dataset["id"]);

    let password = {...this.formGroup.value, ...{org_id: org_id, pass_id: id} as Password};
    let encrypted = structuredClone(password);
    let data = await CryptUtils.encryptData(password.data as Credentials, this.secret_key);

    encrypted.data = data;
    encrypted.sign = await CryptUtils.signData(data, this.shared.user.sign_private_key as CryptoKey);

    if (password.pass_id) {
      this.request("PATCH", this.API_HOST + "/safe", JSON.stringify(encrypted)).then(response => {
        if (response.status === "success") {
          this.password = password;

          let index = this.passwords.data.findIndex(password => password.pass_id === id);
          this.passwords.data[index] = this.password;

          this.modal.hide();
        }
      });
    } else {
      this.request("POST", this.API_HOST + "/safe", JSON.stringify(encrypted)).then(response => {
        if (response.status === "success") {
          this.password = response.data;

          this.passwords.data.push(this.password);
          this.passwords.count!++;

          this.modal.hide();
        }
      });
    }
  }

  /**
   * Kopiert das Passwort des entsprechenden Eintrags in die Zwischenablage.
   */
  protected copyPassword() {
    let id = Number(this.contextMenu.nativeElement.dataset["id"]);

    let index = this.passwords.data.findIndex(password => password.pass_id === id);
    let credentials = this.passwords.data[index].data as Credentials;

    navigator.clipboard.writeText(credentials.password).finally(() => {
      this.showMessage("Erfolgreich das Passwort kopiert", "success");
    })
  }

  /**
   * Öffnet die URL des entsprechenden Eintrags in einem neuen Tab.
   */
  protected openURL() {
    let id = Number(this.contextMenu.nativeElement.dataset["id"]);

    let index = this.passwords.data.findIndex(password => password.pass_id === id);
    let password = this.passwords.data[index];

    if (password.url === "") {
      this.showMessage("Bei diesem Passwort wurde keine URL hinterlegt", "error");
      return;
    }

    window.open(password.url, "_blank");
  }

  /**
   * Generiert ein Passwort nach dem angegebenen Muster und setzt es in beide Formularfelder.
   */
  protected async generatePassword() {
    const password = new RandExp(CustomValidators.patternGenerate).gen();

    this.formGroup.patchValue({data: {password: password, password_repeat: password}});
  }

  /**
   * Überprüft, ob mindestens ein Steuerelement Fehler enthält.
   * Dafür da, damit die Passwortrichtlinien nicht Pflichtig sind.
   * @param controls Ein Objekt mit Steuerelementen
   * @param allowed Erlaubte Fehler
   * @returns {boolean} Gibt zurück, ob mindestens ein Steuerelement Fehler enthält, die nicht zugelassen sind
   */
  protected hasErrors(controls: any, allowed: string = ""): boolean {
    for (let control of Object.values(controls) as any) {
      if (typeof control === "object" && control !== null) {
        if (control.hasOwnProperty("controls"))
          return this.hasErrors(control.controls, allowed);

        let errors = Object.keys(control.errors ?? {});

        if (errors.length) {
          for (let error of errors) {
            if (error !== allowed) return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Aktualisiert die Sortierung der Tabelle und lädt die Daten neu.
   * @param {Event} event Das Event, welches die Sortierung ausgelöst hat
   */
  protected override updateSorting(event: Event) {
    super.updateSorting(event, () => {
      this.loadData();
    });
  }

  /**
   * Dafür da um die Anmeldedaten im Frontend korrekt anzuzeigen.
   * Dies wird benötigt, da die Anmeldedaten verschlüsselt im "data" Objekt gespeichert werden.
   */
  protected getAccount(data: any) {
    return data.account;
  }
}
