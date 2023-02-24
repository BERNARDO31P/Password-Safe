<?php declare(strict_types=1);

namespace controller;

use JetBrains\PhpStorm\NoReturn;
use Monolog\Formatter\LineFormatter;
use Monolog\Handler\StreamHandler;
use Monolog\Level;
use Monolog\Logger;
use Psr\Log\LogLevel;

use function util\replace;

class IOController
{
	protected Logger $logger;

	/**
	 * Konstruktor der Klasse. Initialisiert einen Logger, um Log-Einträge in eine Datei zu schreiben.
	 *
	 * @param string $channel Der Name des Logger-Kanals. Standardmäßig "default".
	 * @return void
	 */
	public function __construct(string $channel = "default")
	{
		$timestamp = time();
		$monthName = date("F", $timestamp);
		$logFile = __DIR__ . "/../logs/" . strtolower($monthName) . ".log";

		$formatter = new LineFormatter("%datetime% %channel%.%level_name%: %message%" . PHP_EOL);
		$handler = new StreamHandler($logFile, LogLevel::INFO);
		$handler->setFormatter($formatter);

		$this->logger = new Logger($channel);
		$this->logger->pushHandler($handler);
	}

	/**
	 * Überprüft, ob alle erforderlichen POST-Argumente vorhanden sind und ob diese leer sind.
	 * Wenn ein Argument fehlt oder leer ist, wird eine Fehlermeldung zurückgegeben.
	 *
	 * @param array $args Ein Array mit allen erforderlichen Argumenten.
	 * @return void
	 */
	protected function checkPostArguments(array $args): void
	{
		$error = false;
		$arguments = array();
		foreach ($args as $arg) {
			if (
				!array_key_exists($arg, $_POST) ||
				$_POST[$arg] === null ||
				$_POST[$arg] === ""
			) {
				$error = true;
				$arguments[] = $arg;
			} elseif (is_string($_POST[$arg])) {
				$_POST[$arg] = htmlspecialchars(addslashes($_POST[$arg]));
			}
		}

		if ($error) {
			$this->sendResponse("error", array("arguments" => $arguments), "Sie haben nicht alle Felder ausgefüllt", null, 400);
		}
	}

	/**
	 * Gibt ein Level-Objekt auf Basis des angegebenen HTTP-Statuscodes zurück.
	 *
	 * @param int $code Der HTTP-Statuscode.
	 * @return Level Das Level-Objekt, das zum angegebenen Statuscode gehört.
	 */
	private function getLevel(int $code): Level
	{
		if ($code >= 200 && $code < 300) {
			return Level::Info;
		} elseif ($code >= 400 && $code < 500) {
			return Level::Warning;
		} elseif ($code >= 500 && $code < 600) {
			return Level::Error;
		}

		return Level::Critical;
	}

	/**
	 * Sendet eine HTTP-Antwort als JSON-Objekt und schreibt den entsprechenden Log-Eintrag.
	 *
	 * @param string $status Der Status der Antwort ("success" oder "error").
	 * @param array|object|null $data Ein assoziatives Array oder Objekt, das die Daten enthält, die in der Antwort zurückgegeben werden sollen.
	 * @param string $message Eine Nachricht, die in der Antwort zurückgegeben werden soll.
	 * @param array|null $context Ein assoziatives Array, das Platzhalter in der Nachricht ersetzt.
	 * @param int $code Der HTTP-Statuscode der Antwort.
	 * @return void
	 */
	#[NoReturn] public function sendResponse(string $status, array|object $data = null, string $message = "", ?array $context = [], int $code = 200): void
	{
		$response = array(
			"status" => $status,
			"data" => $data
		);

		if ($message) {
			$message = replace($message, $context);
			$response["message"] = $message;
		}

		if (strlen($message) && isset($_SESSION["first_name"])) {
			$message = "Benutzer: " . $_SESSION["first_name"] . " " . $_SESSION["last_name"] . " - " . $message;
			$this->logger->addRecord($this->getLevel($code), $message);
		}

		http_response_code($code);
		echo json_encode($response);
		exit();
	}

	/**
	 * Schreibt eine Log-Nachricht mit dem angegebenen Code und der Nachricht in das Log-File.
	 * Die optionale Context-Variable ermöglicht es Platzhalter in der Nachricht durch den tatsächlichen Wert zu ersetzen.
	 *
	 * @param string $message Die Nachricht, die geschrieben werden soll
	 * @param array|null $context Ein optionales assoziatives Array mit Schlüssel-Wert-Paaren, die als Platzhalter in der Nachricht dienen sollen
	 * @param int $code Der Code der Log-Nachricht, um den Schweregrad der Nachricht anzugeben
	 * @return void
	 */
	public function writeLog(string $message, array|null $context = [], int $code = 200): void
	{
		$message = replace($message, $context);

		if (isset($_SESSION["first_name"])) {
			$message = "Benutzer: " . $_SESSION["first_name"] . " " . $_SESSION["last_name"] . " - " . $message;
		}

		$this->logger->addRecord($this->getLevel($code), $message);
	}

	/**
	 * Gibt eine Fehlermeldung zurück, dass die angeforderte Ressource nicht gefunden wurde.
	 *
	 * @return void
	 */
	#[NoReturn] public function show404(): void
	{
		header("Refresh: 3");

		$this->sendResponse("error", null, "Ich glaube Sie haben sich verlaufen", [], 404);
	}

	/**
	 * Gibt eine Erfolgsmeldung zurück, dass der Dienst einsatzbereit ist.
	 *
	 * @return void
	 */
	#[NoReturn] public function health(): void
	{
		$this->sendResponse("success", ["message" => "Dieser Dienst ist einsatzbereit"]);
	}
}
