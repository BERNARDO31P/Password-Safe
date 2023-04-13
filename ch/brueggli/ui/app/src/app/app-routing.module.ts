import {NgModule} from "@angular/core";
import {Router, RouterModule, Routes} from "@angular/router";

import {HomeComponent} from "./home/home.component";

import {RegisterComponent} from "./auth/register/register.component";
import {LoginComponent} from "./auth/login/login.component";
import {AccountComponent} from "./auth/account/account.component";

import {AdminComponent} from "./admin/admin.component";
import {AdminHomeComponent} from "./admin/home/home.component";

import {OrganizationsComponent} from "./admin/organizations/organizations.component";

import {UsersComponent} from "./admin/users/users.component";
import {UserOrganizationsComponent} from "./admin/users/organizations/organizations.component";

import {SafeComponent} from "./safe/safe.component";
import {SafeHomeComponent} from "./safe/home/home.component";
import {SafeOrganizationComponent} from "./safe/organization/organization.component";

import {canActivateFnAdmin, canActivateFnLogin} from "src/assets/js/guards";
import {SharedService} from "../assets/js/shared.service";


const routes: Routes = [
  {path: "", redirectTo: "home", pathMatch: "full"},
  {
    component: undefined, path: "", children:
      [
        {component: HomeComponent, path: "home"},
      ]
  },
  {
    component: undefined, path: "auth", children:
      [
        {component: LoginComponent, path: "login"},
        {component: RegisterComponent, path: "register"},
        {component: AccountComponent, path: "account", canActivate: ['LoginGuard']}
      ]
  },
  {
    component: AdminComponent, path: "admin", canActivate: ['AdminGuard'], children:
      [
        {component: AdminHomeComponent, path: ""},

        {component: UserOrganizationsComponent, path: "users/orgs/:id"},
        {component: UsersComponent, path: "users"},

        {component: OrganizationsComponent, path: "organizations"},
      ]
  },
  {
    component: SafeComponent, path: "safe", canActivate: ['LoginGuard'], children:
      [
        {component: SafeHomeComponent, path: ""},
        {component: SafeOrganizationComponent, path: ":id"}
      ]
  },
  {path: "**", redirectTo: "home"},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    {
      provide: "LoginGuard",
      useFactory: canActivateFnLogin,
      deps: [SharedService, Router],
    },
    {
      provide: "AdminGuard",
      useFactory: canActivateFnAdmin,
      deps: [SharedService, Router],
    }
  ],
})
export class AppRoutingModule {
}
