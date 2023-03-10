import { Component} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";

import {AppComponent} from "src/app/app.component";

import {CryptUtils} from "src/assets/js/crypt_utils";


@Component({
  selector: "auth-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"]
})
export class LoginComponent extends AppComponent {
  formGroup = new FormGroup({
    email: new FormControl("", [
      Validators.required,
      Validators.minLength(8)
    ]),
    password: new FormControl("", [
      Validators.required,
      Validators.minLength(11)
    ])
  });

  override ngAfterViewInit() {
    super.ngAfterViewInit();

    this.setLocation("Anmeldung");
  }

  /**
   * Führt einen Login-Vorgang mit den eingegebenen Benutzerdaten durch.
   * Wenn die Anmeldung erfolgreich ist, wird der Benutzer weitergeleitet.
   * Seine Daten werden entschlüsselt und lokal gespeichert.
   */
  login() {
    this.request("POST", this.API_HOST + "/auth/salt", JSON.stringify({email: this.formGroup.value.email})).then(async response => {
      if (response.status === "success") {
        let salt = CryptUtils.base64ToArray(response.data.salt);
        let secret_key = await CryptUtils.passwordToSecretKey(this.formGroup.value.password!, salt);

        let formData = structuredClone(this.formGroup.value) as Record<string, any>;
        formData["password"] = await CryptUtils.hashSecretKey(secret_key);

        this.request("POST", this.API_HOST + "/auth/login", JSON.stringify(formData)).then(async response => {
          if (response.status === "success") {
            this.shared.user = response.data;
            this.shared.user.password = this.formGroup.value.password!;

            localStorage.setItem("user", JSON.stringify(this.shared.user));

            await CryptUtils.decryptUser(this.shared.user);

            this.router.navigateByUrl("/");
          }
        });
      }
    });
  }
}
