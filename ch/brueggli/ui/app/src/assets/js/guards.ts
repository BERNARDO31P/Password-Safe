import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from "@angular/router";
import {Injectable} from "@angular/core";

import {SharedService} from "./shared.service";

/**
 * Ein Angular Guard, der überprüft, ob der Benutzer ein Administrator ist.
 * Wenn der Benutzer kein Administrator ist, wird er zur Startseite weitergeleitet und die Navigation wird blockiert.
 * @param {SharedService} shared Die VariableService-Instanz zur gemeinsamen Nutzung von Variablen.
 * @param {Router} router Die Router-Instanz zur Navigation zu anderen Routen.
 * @return {boolean} Gibt true zurück, wenn der Benutzer ein Administrator ist, andernfalls false
 */
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private shared: SharedService, private router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (!this.shared.user.is_admin) {
      this.router.navigateByUrl('/');
      return false;
    }
    return true;
  }
}

/**
 * Ein Angular Guard, der überprüft, ob der Benutzer angemeldet ist.
 * Wenn der Benutzer nicht angemeldet ist, wird er zur Login-Seite weitergeleitet und die Navigation wird blockiert.
 * @param {SharedService} shared, beinhaltet die gemeinsam genutzten Variablen
 * @param {Router} router Ein Angular Service, der die Navigation innerhalb der Anwendung ermöglicht
 * @return {boolean} Gibt true zurück, wenn der Benutzer angemeldet ist, andernfalls false
 */
@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  constructor(private shared: SharedService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.shared.user.user_id === undefined) {
      this.router.navigateByUrl('/auth/login');
      return false;
    }
    return true;
  }
}
