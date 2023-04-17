import {Router} from "@angular/router";
import {SharedService} from "./shared.service";
import {Observable, of} from "rxjs";
import {Injectable} from "@angular/core";

/**
 * Ein Angular Guard, der überprüft, ob der Benutzer angemeldet ist.
 * Wenn der Benutzer nicht angemeldet ist, wird er zur Login-Seite weitergeleitet und die Navigation wird blockiert.
 * @param {SharedService} shared, beinhaltet die gemeinsam genutzten Variablen
 * @param {Router} router Ein Angular Service, der die Navigation innerhalb der Anwendung ermöglicht
 * @return {boolean} Gibt true zurück, wenn der Benutzer angemeldet ist, andernfalls false
 */
@Injectable({
  providedIn: 'root',
})
export class LoginGuard {
  constructor(private shared: SharedService, private router: Router) {}

  canActivate(): Observable<boolean> {
    if (this.shared.user.user_id === undefined) {
      this.router.navigateByUrl('/auth/login');
      return of(false);
    }
    return of(true);
  }
}

/**
 * Ein Angular Guard, der überprüft, ob der Benutzer ein Administrator ist.
 * Wenn der Benutzer kein Administrator ist, wird er zur Startseite weitergeleitet und die Navigation wird blockiert.
 * @param {SharedService} shared Die VariableService-Instanz zur gemeinsamen Nutzung von Variablen.
 * @param {Router} router Die Router-Instanz zur Navigation zu anderen Routen.
 * @return {boolean} Gibt true zurück, wenn der Benutzer ein Administrator ist, andernfalls false
 */
@Injectable({
  providedIn: 'root',
})
export class AdminGuard {
  constructor(private shared: SharedService, private router: Router) {}

  canActivate(): Observable<boolean> {
    if (!this.shared.user.is_admin) {
      this.router.navigateByUrl('/');
      return of(false);
    }
    return of(true);
  }
}


export function canActivateFnAdmin(shared: SharedService, router: Router): boolean {
  if (!shared.user.is_admin) {
    router.navigateByUrl("/");
    return false;
  }
  return true;
}

export function canActivateFnLogin(shared: SharedService, router: Router): boolean {
  if (shared.user.user_id === undefined) {
    router.navigateByUrl("/auth/login");
    return false;
  }
  return true;
}
