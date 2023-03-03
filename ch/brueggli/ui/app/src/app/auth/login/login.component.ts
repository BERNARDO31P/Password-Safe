import { Component} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";

import {CryptUtils} from "src/assets/js/crypt_utils";

import {AppComponent} from "src/app/app.component";

import {User} from "src/assets/js/model/User";


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
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
  async login() {
    let formData = structuredClone(this.formGroup.value) as Record<string, any>;
    formData["password"] = await CryptUtils.hashString(this.formGroup.value.password!);

    this.request("post", this.API_HOST + "/auth/login", JSON.stringify(formData)).then(async response => {
      if (response.status === "success") {
        this.shared.user = structuredClone(response.data) as User;
        this.shared.user.password = this.formGroup.value.password!;

        localStorage.setItem("user", JSON.stringify(this.shared.user));

        await CryptUtils.decryptUser(this.shared.user, this.formGroup.value.password!);

        this.router.navigateByUrl("/");
      }
    });
  }
}
