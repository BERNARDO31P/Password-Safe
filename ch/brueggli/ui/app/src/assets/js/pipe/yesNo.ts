import { Pipe, PipeTransform } from "@angular/core";

/**
 * Transformiert einen booleschen Wert in eine Zeichenkette.
 * Gibt "Ja" zurück, falls der Wert true ist, "Nein" zurück, falls der Wert false ist.
 * @param {any} value Der boolesche Wert, der transformiert werden soll.
 * @param {any[]} args Ein optionales Argument, das ignoriert werden kann.
 * @returns Eine Zeichenkette ("Ja", falls der Wert true ist, "Nein", falls der Wert false ist).
 */
@Pipe({
  name: "yesNo"
})
export class YesNoPipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    return value ? "Ja" : "Nein";
  }
}
