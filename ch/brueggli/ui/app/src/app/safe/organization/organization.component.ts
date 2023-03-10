import {Component, ElementRef, ViewChild} from "@angular/core";
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
export class SafeOrganizationComponent extends SafeComponent {
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
      data: new FormGroup({
          account: new FormControl("", [
            Validators.required,
            Validators.minLength(4)
          ]),
          password: new FormControl("", [
            Validators.required,
            Validators.minLength(11),
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
      this.request("GET", this.API_HOST + "/safe/" + id, null, {page: this.shared.page}).then(response => {
        if (response.status === "success") {
          this.passwords = response.data;
          this.organization = this.shared.organizations[index];

          this.request("GET", this.API_HOST + "/safe/" + id + "/key").then(async response => {
            if (response.status === "success") {
              let encrypted = response.data.secret_key;

              this.secret_key = await CryptUtils.decryptSecretKey(encrypted, this.shared.user.private_key as CryptoKey);

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
   * Setzt das Formular auf die Standardwerte zurück und öffnet das Modal zum Hinzufügen eines neuen Passworts
   */
  protected add() {
    this.formGroup.reset();
    this.password = {} as Password;

    this.modal.show();
  }

  // TODO: Comment
  protected edit() {
    let id = Number(this.contextMenu.nativeElement.dataset["id"]);
    let index = this.passwords.data.findIndex(password => password.pass_id === id);
    this.password = this.passwords.data[index];

    this.formGroup.patchValue(this.password as any);
    this.changeDetectorRef.detectChanges();

    this.modal.show();
  }

  // TODO: Comment
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

  // TODO: Comment
  protected async save() {
    let org_id = Number(this.route.snapshot.params["id"]);
    let id = Number(this.modalRef.nativeElement.dataset["id"]);

    let password = structuredClone(this.formGroup.value) as Password;
    password.org_id = org_id;
    password.pass_id = id;

    let encrypted = structuredClone(password);
    encrypted.data = await CryptUtils.encryptData(password.data as Credentials, this.secret_key);

    if (password.pass_id) {
      this.request("PATCH", this.API_HOST + "/safe", JSON.stringify(encrypted)).then(response => {
        if (response.status === "success") {
          this.password = password;

          let index = this.passwords.data.findIndex(password => password.pass_id === id);
          this.passwords.data[index] = password;

          this.modal.hide();
        }
      });
    } else {
      this.request("POST", this.API_HOST + "/safe", JSON.stringify(encrypted)).then(response => {
        if (response.status === "success") {
          this.password = password;
          this.passwords.data.push(password);

          this.modal.hide();
        }
      });
      // TODO: Create
    }
  }

  /**
   * Schaltet das Anzeigen des Passworts um, wenn der dazugehörige Knopf angeklickt wird.
   * @param {Event} event Das auslösende Ereignis.
   * @return {void}
   */
  protected togglePassword(event: Event) {
    let button = event.currentTarget as HTMLButtonElement;
    let icon = button.querySelector("i") as HTMLImageElement;
    let input = this.previousElementSibling(button, "input") as HTMLInputElement;

    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("bi-eye");
      icon.classList.add("bi-eye-slash");
    } else {
      input.type = "password";
      icon.classList.remove("bi-eye-slash");
      icon.classList.add("bi-eye");
    }
  }

  /**
   * Kopiert das Passwort des entsprechenden Eintrags in die Zwischenablage
   */
  protected copyPassword() {
    let id = Number(this.contextMenu.nativeElement.dataset["id"]);

    let passwords = this.passwords.data as Array<Password>;
    let index = passwords.findIndex(password => password.pass_id === id);

    let password = passwords[index].data as Credentials;

    navigator.clipboard.writeText(password.password).finally(() => {
      this.showMessage("Erfolgreich das Passwort kopiert", "success");
    })
  }

  /**
   * Generiert ein Passwort nach dem angegebenen Muster und setzt es in die beiden Formularfelder
   */
  protected async generatePassword() {
    const password = new RandExp(CustomValidators.patternGenerate).gen();

    this.formGroup.patchValue({data: {password: password, password_repeat: password}});
  }

  /**
   * Gibt das vorherige Element im DOM zurück, das dem gegebenen Selektor entspricht.
   * Wenn kein passendes Element gefunden wird, wird null zurückgegeben.
   * @param {HTMLElement} element Das Ausgangselement.
   * @param {string} selector Der Selektor des gesuchten Elements.
   * @return {HTMLElement|null} Das gefundene Element oder null.
   */
  protected previousElementSibling(element: HTMLElement, selector: string): HTMLElement | null {
    let previousSibling = element.previousElementSibling;

    if (previousSibling !== null) {
      if (!previousSibling.matches(selector))
        previousSibling = this.previousElementSibling(previousSibling as HTMLElement, selector);

      return previousSibling as HTMLElement;
    }
    return null;
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
      let errors = Object.keys(control.errors ?? {});

      if (errors.length) {
        for (let error of errors) {
          if (error !== allowed) return true;
        }
      }
    }
    return false;
  }

  // TODO: Comment
  protected getAccount(data: any) {
    return data.account;
  }
}
