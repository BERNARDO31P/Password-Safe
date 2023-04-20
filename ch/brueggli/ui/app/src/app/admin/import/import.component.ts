import {Component} from '@angular/core';
import {AdminComponent} from "../admin.component";
import {OrganizationsComponent} from "../organizations/organizations.component";
import {SafeOrganizationComponent} from "../../safe/organization/organization.component";
import {CryptUtils} from "../../../assets/js/crypt_utils";
import {UserOrganizationsComponent} from "../users/organizations/organizations.component";

type Entry = {
  entry_id: number,
  group: string,
  title: string,
  username: string | null,
  password: string,
  url: string | null,
  notes: string | null,
}

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss']
})
export class ImportComponent extends AdminComponent {
  translation: Record<string, string> = {
    entry_id: "Eintrags ID",
    group: "Gruppe",
    title: "Titel",
    username: "Benutzername",
    password: "Passwort",
    url: "URL",
    notes: "Notizen",
  }

  protected fileName = "Keine Datei ausgewählt";
  protected entries: { data: Array<Entry>, count: number } = {data: [], count: 0};

  protected loadFile(event: Event) {
    let target = event.target as HTMLInputElement;
    let file = target.files![0] as File;

    this.fileName = file.name;

    let reader = new FileReader();
    reader.onload = (event) => {
      let content = event.target!.result as string;
      this.parseFile(content);
    }

    reader.readAsText(file);
  }

  protected parseFile(content: string) {
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(content, "text/xml");

    let xmlEntries = xmlDoc.querySelectorAll("entry") as NodeListOf<HTMLElement>;
    xmlEntries.forEach((xmlEntry) => {
      let group = xmlEntry.querySelector("group")?.textContent;
      let title = xmlEntry.querySelector("title")?.textContent;
      let username = xmlEntry.querySelector("username")?.textContent;
      let password = xmlEntry.querySelector("password")?.textContent;
      let url = xmlEntry.querySelector("url")?.textContent;
      let notes = xmlEntry.querySelector("notes")?.textContent;

      let groupParts = group!.split(".");

      this.entries.data.push({
        entry_id: this.entries.count,
        group: groupParts[1],
        title: title!,
        username: username,
        password: password!,
        url: url,
        notes: notes,
      } as Entry);

      this.entries.count++;
    });
  }

  protected async importData() {
    const organizations = Array.from(new Set(this.entries.data.map(entry => entry.group)));

    const organizationsComponent = new OrganizationsComponent(this.shared, this.titleService, this.router, this.route, this.changeDetectorRef);
    const safeOrganizationComponent = new SafeOrganizationComponent(this.shared, this.titleService, this.router, this.route, this.changeDetectorRef);
    const userOrganizationsComponent = new UserOrganizationsComponent(this.shared, this.titleService, this.router, this.route, this.changeDetectorRef, null!);

    userOrganizationsComponent.user = this.shared.user;

    this.shared.bypass = true;
    this.showLoading();
    await new Promise<void>(async (resolve) => {
      const promises = organizations.map(async (organization) => {
        organizationsComponent.formGroup.patchValue({name: organization});

        let org_id = await organizationsComponent.save();
        this.shared.organizations.push({name: organization, org_id: org_id});
      });

      await Promise.all(promises);
      resolve();
    });

    for (const org of this.shared.organizations) {
      safeOrganizationComponent.organization = org;

      const response = await this.request("GET", this.API_HOST + "/safe/" + org.org_id + "/key");
      if (response.status === "success") {
        safeOrganizationComponent.secret_key = await CryptUtils.decryptSecretKey(response.data.data, this.shared.user.private_key as CryptoKey);

        for (const entry of this.entries.data) {
          if (entry.group === org.name) {
            safeOrganizationComponent.formGroup.patchValue({
              name: entry.title,
              description: entry.notes,
              url: entry.url,
              data: {account: entry.username, password: entry.password, password_repeat: entry.password},
            });
            await safeOrganizationComponent.save();
          }
        }
      }
    }

    setTimeout(() => {
      this.entries = {data: [], count: 0};
      this.fileName = "Keine Datei ausgewählt";
      this.shared.bypass = false;

      this.showMessage("Die Daten wurden erfolgreich importiert", "success");
    }, 1000);
  }
}
