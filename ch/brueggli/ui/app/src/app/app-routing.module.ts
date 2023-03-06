import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {HomeComponent} from "./home/home.component";

import {RegisterComponent} from "./auth/register/register.component";
import {LoginComponent} from "./auth/login/login.component";

import {AdminComponent} from "./admin/admin.component";
import {AdminHomeComponent} from "./admin/home/home.component";
import {UsersComponent} from "./admin/users/users.component";
import {OrganizationsComponent} from "./admin/organizations/organizations.component";
import {UserOrganizationsComponent} from "./admin/users/organizations/organizations.component";

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
      ]
  },
  {
    component: AdminComponent, path: "admin", children:
      [
        {component: AdminHomeComponent, path: ""},

        {component: UserOrganizationsComponent, path: "users/orgs/:id"},
        {component: UsersComponent, path: "users"},

        {component: OrganizationsComponent, path: "organizations"},
      ]
  },
  {path: "**", redirectTo: "home"},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
