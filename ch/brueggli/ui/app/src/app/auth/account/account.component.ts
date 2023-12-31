import {Component} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";

import {AppComponent} from "src/app/app.component";

import {CustomValidators} from "src/assets/js/validators";
import {CryptUtils} from "src/assets/js/crypt_utils";

@Component({
  selector: "app-account",
  templateUrl: "./account.component.html",
  styleUrls: ["./account.component.scss"]
})
export class AccountComponent extends AppComponent {
  formGroup = new FormGroup({
    password_current: new FormControl("", [
      Validators.required,
    ]),
    password: new FormControl("", [
      Validators.required,
      Validators.minLength(14),
      CustomValidators.password({"password": true})
    ]),
    password_repeat: new FormControl("", [
      Validators.required,
    ])
  }, {
    validators: [
      CustomValidators.match("password", "password_repeat"),
    ],
    updateOn: "change"
  });

  /**
   * Speichert die geänderten Anmeldedaten auf dem Server.
   * Generiert einen neuen symmetrischen Schlüssel auf Grundlage des neuen Passworts und verschlüsselt damit den privaten Schlüssel des Benutzers.
   * Speichert die aktualisierten Daten auf dem Server.
   */
  protected async save() {
    if (!this.formGroup.valid) {
      this.showMessage("Programmmanipulation festgestellt", "error");
      return;
    }

    let salt = crypto.getRandomValues(new Uint8Array(16));
    let secret_key = await CryptUtils.passwordToSecretKey(this.formGroup.value.password!, salt);
    let secret_key_old = await CryptUtils.passwordToSecretKey(this.formGroup.value.password_current!, this.shared.user.salt as ArrayBuffer);

    let hashedPassword = await CryptUtils.hashSecretKey(secret_key);
    let hashedPasswordOld = await CryptUtils.hashSecretKey(secret_key_old);

    let private_key = await CryptUtils.encryptPrivateKey(this.shared.user.private_key as CryptoKey, secret_key);
    let sign_private_key = await CryptUtils.encryptPrivateKey(this.shared.user.sign_private_key as CryptoKey, secret_key);

    let data = {
      password_old: hashedPasswordOld,
      password: hashedPassword,
      private_key: private_key,
      sign_private_key: sign_private_key,
      salt: CryptUtils.arrayToBase64(salt)
    }

    this.request("PATCH", this.API_HOST + "/auth/account", JSON.stringify(data)).then(async response => {
      if (response.status === "success") {
        this.shared.user = response.data;
        this.shared.user.password = this.formGroup.value.password!;

        localStorage.setItem("user", JSON.stringify(this.shared.user));

        await CryptUtils.decryptUser(this.shared.user);

        this.router.navigateByUrl("/home");
      }
    })
  }
}
