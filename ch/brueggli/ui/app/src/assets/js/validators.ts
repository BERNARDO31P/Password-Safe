import {AbstractControl, ValidationErrors, ValidatorFn} from "@angular/forms";

export class CustomValidators {
  public static patternGenerate = `^((?=.*[A-Z])(?=.*[a-z])(?=.*[\\d])|(?=.*[a-z])(?=.*[A-Z])(?=.*[!-\\/:-@[-\`{-~])|(?=.*[A-Z])(?=.*[\\d])(?=.*[!-\\/:-@[-\`{-~])|(?=.*[a-z])(?=.*[\\d])(?=.*[!-\\/:-@[-\`{-~])|(?=.*[A-Z])(?=.*[a-z])(?=.*[\\d])(?=.*[!-\\/:-@[-\`{-~])).[^ \\t\\r\\n\\v\\f]{11,11}$`;
  public static patternCheck = `^((?=.*[A-Z])(?=.*[a-z])(?=.*[\\d])|(?=.*[a-z])(?=.*[A-Z])(?=.*[!-\\/:-@[-\`{-~])|(?=.*[A-Z])(?=.*[\\d])(?=.*[!-\\/:-@[-\`{-~])|(?=.*[a-z])(?=.*[\\d])(?=.*[!-\\/:-@[-\`{-~])|(?=.*[A-Z])(?=.*[a-z])(?=.*[\\d])(?=.*[!-\\/:-@[-\`{-~])).[^ \\t\\r\\n\\v\\f]{1,}$`;

  /**
   * Validiert, ob die Eingabe eines Formularfeldes mit der Eingabe eines anderen Formularfelds übereinstimmt.
   * Setzt sonst einen Fehler beim zweiten Formularfeld.
   * @param {string} controlName Der Name des Formularfelds, dessen Eingabe validiert werden soll
   * @param {string} matchControlName Der Name des Formularfelds, mit dem das Eingabefeld übereinstimmen soll
   * @return {ValidatorFn} Die Validator-Funktion, die das Formularfeld validiert
   */
  static match(controlName: string, matchControlName: string): ValidatorFn {
    return (controls: AbstractControl) => {
      const control = controls.get(controlName);
      const matchControl = controls.get(matchControlName);

      if (!matchControl?.errors && control?.value !== matchControl?.value) {
        matchControl?.setErrors({
          matching: {
            actualValue: matchControl?.value,
            requiredValue: control?.value
          }
        });
        return {matching: true};
      }
      return null;
    };
  }

  /**
   * Validiert, ob die Eingabe eines Formularfeldes den Wert von einem anderen Formularfeld enthält.
   * Dafür da, damit man personenbezogene Daten nicht als Passwort verwenden kann.
   * @param {string} controlName Der Name des Formularfelds, dessen Eingabe validiert werden soll
   * @param {string} containsControlName Der Name des Formularfelds, das die Zeichenkette enthält, nach der gesucht werden soll
   * @return {ValidatorFn} Die Validator-Funktion, die das Formularfeld validiert
   */
  static contains(controlName: string, containsControlName: string): ValidatorFn {
    return (controls: AbstractControl) => {
      const control = controls.get(controlName);
      const containsControl = controls.get(containsControlName);

      if (!control?.value.toString().length || !containsControl?.value.toString().length) {
        return null;
      }

      if (control?.value.toString().toLowerCase().includes(containsControl?.value.toString().toLowerCase())) {
        control?.setErrors({
          contains: true
        });
        return {contains: true};
      }
      return null;
    }
  }

  /**
   * Validiert, ob das Passwort den Anforderungen entspricht, die in einem regulären Ausdruck definiert sind.
   * @param {ValidationErrors} error Ein Fehlerobjekt, das zurückgegeben wird, wenn das Passwort nicht den Anforderungen entspricht
   * @return {ValidatorFn} Die Validator-Funktion, die das Passwort validiert
   */
  static password(error: ValidationErrors): ValidatorFn {
    return (control: AbstractControl): { [p: string]: any } | null => {
      if (!control.value) {
        return null;
      }

      let regex = new RegExp(this.patternCheck);

      const valid = regex.test(control.value);
      return valid ? null : error;
    }
  }
}
