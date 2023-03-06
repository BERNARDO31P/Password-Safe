/**
 Die URLSearchParamsPlus-Klasse ist eine erweiterte Version der URLSearchParams-Klasse.
 Diese stellt eine überschriebene toString()-Methode bereit, die eine URL-Parameterzeichenfolge mit einem Fragezeichen davor zurückgibt, wenn Parameter verfügbar sind.
 Sonst wird ein leerer String zurückgegeben. Somit kann anschliessend eine gültige URL erzeugt werden.
 */
export class URLSearchParamsPlus extends URLSearchParams {
  constructor(init: Record<string, any>) {
    for (const key in init) {
      let value = init[key];
      if (value === undefined) delete init[key];
    }

    super(init);
  }


  override toString(): string {
    let params: string = super.toString();
    return (params) ? "?" + params : "";
  }
}
