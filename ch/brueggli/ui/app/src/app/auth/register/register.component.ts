import {Component} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";

import {AppComponent} from "src/app/app.component";

import {CustomValidators} from "src/assets/js/validators";
import {CryptUtils} from "src/assets/js/crypt_utils";

import {User} from "src/assets/js/model/User";

@Component({
  selector: "app-register",
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
    let salt = crypto.getRandomValues(new Uint8Array(16));
    let secretKey = await CryptUtils.passwordToSecretKey(this.formGroup.value.password!, salt);

    let keyPair = await CryptUtils.generateKeyPair();

    let privateKey = await CryptUtils.encryptPrivateKey(keyPair.privateKey, secretKey);
    let publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    let hashedPassword = await CryptUtils.hashString(this.formGroup.value.password!);

    let formData = structuredClone(this.formGroup.value) as Record<string, any>;
    delete formData["password_repeat"];

    formData["password"] = hashedPassword;
    formData["private_key"] = privateKey;
    formData["public_key"] = CryptUtils.arrayToBase64(publicKey);
    formData["salt"] = CryptUtils.arrayToBase64(salt);

    this.request("post", this.API_HOST + "/auth/register", JSON.stringify(formData)).then(response => {
      if (response.status == "success") {
        this.shared.user = structuredClone(response.data) as User;
        this.shared.user.password = this.formGroup.value.password!;

        localStorage.setItem("user", JSON.stringify(this.shared.user));

        this.shared.user.private_key = keyPair.privateKey;
        this.shared.user.public_key = keyPair.publicKey;
        this.shared.user.salt = salt;

        this.router.navigateByUrl("/");
      }
    });
  }

  override ngAfterViewInit() {
    super.ngAfterViewInit();

    this.setLocation("Registrierung");
  }
}
