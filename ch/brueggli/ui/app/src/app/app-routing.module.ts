import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {HomeComponent} from "./home/home.component";

const routes: Routes = [
  {path: "", redirectTo: "home", pathMatch: "full"},
  {
    component: undefined, path: "", children:
      [
        {component: HomeComponent, path: "home"},
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
