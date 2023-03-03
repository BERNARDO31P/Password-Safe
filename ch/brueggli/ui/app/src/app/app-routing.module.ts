import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {HomeComponent} from "./home/home.component";
import {RegisterComponent} from "./auth/register/register.component";
import {LoginComponent} from "./auth/login/login.component";

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
  {path: "**", redirectTo: "home"},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
