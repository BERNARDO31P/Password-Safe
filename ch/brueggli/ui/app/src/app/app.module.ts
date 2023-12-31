import {NgModule} from "@angular/core";
import {NgxPaginationModule} from "ngx-pagination";

import {BrowserModule} from "@angular/platform-browser";
import {HttpClientModule} from "@angular/common/http";
import {ReactiveFormsModule} from "@angular/forms";

import {AppRoutingModule} from "./app-routing.module";
import {YesNoPipe} from "../assets/js/pipe/yesNo";

import {AppComponent} from "./app.component";
import {HomeComponent} from "./home/home.component";

import {LoginComponent} from "./auth/login/login.component";
import {RegisterComponent} from "./auth/register/register.component";
import {AccountComponent} from "./auth/account/account.component";

import {AdminComponent} from "./admin/admin.component";
import {AdminHomeComponent} from "./admin/home/home.component";
import {UsersComponent} from "./admin/users/users.component";
import {UserOrganizationsComponent} from "./admin/users/organizations/organizations.component";

import {OrganizationsComponent} from "./admin/organizations/organizations.component";

import {SafeComponent} from "./safe/safe.component";
import {SafeHomeComponent} from "./safe/home/home.component";
import {SafeOrganizationComponent} from "./safe/organization/organization.component";
import { ImportComponent } from './admin/import/import.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,

    LoginComponent,
    RegisterComponent,
    AccountComponent,

    UsersComponent,
    UserOrganizationsComponent,

    OrganizationsComponent,

    AdminComponent,
    AdminHomeComponent,

    SafeComponent,
    SafeHomeComponent,
    SafeOrganizationComponent,

    YesNoPipe,
     ImportComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgxPaginationModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
