/**
 Die URLSearchParamsPlus-Klasse ist eine erweiterte Version der URLSearchParams-Klasse.
 Diese stellt eine überschriebene toString()-Methode bereit, die eine URL-Parameterzeichenfolge mit einem Fragezeichen davor zurückgibt, wenn Parameter verfügbar sind.
 Sonst wird ein leerer String zurückgegeben. Somit kann anschliessend eine gültige URL erzeugt werden.
 */
export class URLSearchParamsPlus extends URLSearchParams {
  override toString(): string {
    let params: string = super.toString();
    return (params) ? "?" + params : "";
  }
}
