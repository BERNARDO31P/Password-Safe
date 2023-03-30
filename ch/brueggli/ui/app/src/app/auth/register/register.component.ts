import {Component} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";

import {AppComponent} from "src/app/app.component";

import {CustomValidators} from "src/assets/js/validators";
import {CryptUtils} from "src/assets/js/crypt_utils";

@Component({
  selector: "auth-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"]
})
export class RegisterComponent extends AppComponent {
  formGroup = new FormGroup(
    {
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
      password: new FormControl("", [
        Validators.required,
        Validators.minLength(14),
        CustomValidators.password({"password": true})
      ]),
      password_repeat: new FormControl("", [
        Validators.required,
      ]),
    },
    {
      validators: [
        CustomValidators.match("password", "password_repeat"),
        CustomValidators.contains("password", "first_name"),
        CustomValidators.contains("password", "last_name")
      ],
      updateOn: "change"
    }
  );

  /**
   * Registriert einen neuen Benutzer und speichert die Benutzerdaten auf dem Server.
   * Generiert einen symmetrischen Schlüssel aus dem Passwort des Benutzers.
   * Generiert ein Schlüsselpaar, verschlüsselt den privaten Schlüssel mit dem symmetrischen Schlüssel des Benutzers.
   * Speichert die Daten, verschlüsselt auf dem Server.
   */
  async register() {
    if (!this.formGroup.valid) {
      this.showMessage("Programmmanipulation festgestellt", "error");
      return;
    }

    let salt = crypto.getRandomValues(new Uint8Array(16));
    let secret_key = await CryptUtils.passwordToSecretKey(this.formGroup.value.password!, salt);
    let password = await CryptUtils.hashSecretKey(secret_key);

    let keyPair = await CryptUtils.generateKeyPair();
    let keySignPair = await CryptUtils.generateSignKeyPair();

    let private_key = await CryptUtils.encryptPrivateKey(keyPair.privateKey, secret_key);
    let sign_private_key = await CryptUtils.encryptPrivateKey(keySignPair.privateKey, secret_key);

    let formData = structuredClone(this.formGroup.value) as Record<string, any>;
    delete formData["password_repeat"];

    formData["password"] = password;
    formData["salt"] = CryptUtils.arrayToBase64(salt);

    formData["private_key"] = private_key;
    formData["public_key"] = await CryptUtils.exportPublicKey(keyPair.publicKey);

    formData["sign_private_key"] = sign_private_key;
    formData["sign_public_key"] = await CryptUtils.exportSignPublicKey(keySignPair.publicKey);

    this.request("post", this.API_HOST + "/auth/register", JSON.stringify(formData)).then(async response => {
      if (response.status == "success") {
        this.shared.user = response.data;
        this.shared.user.password = this.formGroup.value.password!;

        localStorage.setItem("user", JSON.stringify(this.shared.user));

        await CryptUtils.decryptUser(this.shared.user);

        this.router.navigateByUrl("/");
      }
    });
  }

  override ngAfterViewInit() {
    super.ngAfterViewInit();

    this.setLocation("Registrierung");
  }
}
