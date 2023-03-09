<?php

namespace controller;

use Exception;

use JetBrains\PhpStorm\NoReturn;
use lib\DataRepo\DataRepo;

use model\User;

use trait\getter;

use function util\removeArrayKeys;

class AuthController extends IOController
{
	use getter;

	public function __construct()
	{
		parent::__construct("auth");
	}

	/**
	 * Überprüft die Anmeldeinformationen des Benutzers, um eine Sitzung zu starten.
	 * Wenn die Anmeldeinformationen gültig sind und das Konto nicht gesperrt ist, wird eine Sitzung gestartet und eine Erfolgsmeldung zurückgegeben.
	 * Wenn die Anmeldeinformationen ungültig sind oder das Konto gesperrt ist, wird eine Fehlermeldung zurückgegeben.
	 * @return void
	 * @throws Exception Siehe DataRepo
	 */
	#[NoReturn] public function login(): void
	{
		$this->checkPostArguments(["email", "password"]);

		$user = DataRepo::of(User::class)->getByField("email", $_POST["email"]);

		if (count($user) && $user[0]->password == $_POST["password"]) {
			if (boolval($user[0]->is_suspended) === true) {
				$this->sendResponse("error", null, "Dieses Konto {email} ist gesperrt", ["email" => $_POST["email"]], 403);
			}

			$user[0]->last_login = time();

			DataRepo::update($user[0]);
			$_SESSION = $user[0]->toArray();

			$this->sendResponse("success", removeArrayKeys($_SESSION, ["is_suspended", "password", "last_login"]), "Erfolgreich angemeldet");
		}
		$this->writeLog("Anmeldung für den Benutzer {email} fehlgeschlagen", ["email" => $_POST["email"]], 401);
		$this->sendResponse("error", null, "E-Mail oder Passwort falsch", null, 401);
	}

	/**
	 * Registriert einen neuen Benutzer und startet eine Sitzung.
	 * Wenn die E-Mail-Adresse bereits in der Datenbank vorhanden ist oder ungültig ist, wird eine Fehlermeldung zurückgegeben.
	 * Wenn die Registrierung erfolgreich ist, wird eine Sitzung gestartet und eine Erfolgsmeldung zurückgegeben.
	 * @return void
	 * @throws Exception Siehe DataRepo
	 */
	#[NoReturn] public function register(): void
	{
		$this->checkPostArguments(["email", "first_name", "last_name", "password", "public_key", "private_key", "salt"]);

		$user = DataRepo::of(User::class)->getByField("email", $_POST["email"]);
		if (count($user)) {
			$this->writeLog("Registrierung für den Benutzer {first_name} {last_name} / {email} fehlgeschlagen: Email wird bereits verwendet", [
				"first_name" => $_POST["first_name"],
				"last_name" => $_POST["last_name"],
				"email" => $_POST["email"]
			], 409);
			$this->sendResponse("error", null, "Diese E-Mail Adresse wird bereits verwendet", null, 409);
		} elseif (!filter_var($_POST["email"], FILTER_VALIDATE_EMAIL)) {
			$this->writeLog("Registrierung für den Benutzer {first_name} {last_name} / {email} fehlgeschlagen: E-Mail Adresse ist ungültig", [
				"first_name" => $_POST["first_name"],
				"last_name" => $_POST["last_name"],
				"email" => $_POST["email"]
			], 400);
			$this->sendResponse("error", null, "Die E-Mail Adresse ist ungültig", null, 400);
		}

		$user = User::fromObj($_POST);
		if (DataRepo::insert($user)) {
			$_SESSION = $user->toArray();

			$this->sendResponse("success", removeArrayKeys($_SESSION, ["is_suspended", "password", "last_login"]), "Erfolgreich registriert");
		}
		$this->writeLog("Bei der Registrierung vom Benutzer {first_name} {last_name} / {email} ist ein Fehler aufgetreten", [
			"first_name" => $_POST["first_name"],
			"last_name" => $_POST["last_name"],
			"email" => $_POST["email"]
		], 500);
		$this->sendResponse("error", null, "Es ist ein Fehler aufgetreten", null, 500);
	}

	/**
	 * Aktualisiert die Benutzerdaten des aktuell angemeldeten Benutzers.
	 * Wenn das aktuelle Passwort ungültig ist, wird eine Fehlermeldung zurückgegeben.
	 * Wenn die Aktualisierung erfolgreich ist, wird eine Erfolgsmeldung zurückgegeben und die Sitzung wird aktualisiert.
	 * @return void
	 * @throws Exception Siehe DataRepo
	 */
	#[NoReturn] public function updateAccount(): void
	{
		$this->checkPostArguments(["password", "password_old", "private_key", "salt"]);

		$user = $this->_getUser($_SESSION["user_id"]);

		if ($user->password !== $_POST["password_old"]) {
			$this->sendResponse("error", null, "Das derzeitige Passwort ist ungültig", null, 401);
		}

		$user = User::fromObj(array_merge($user->toArray(), $_POST));
		if (!DataRepo::update($user)) {
			$this->sendResponse("error", null, "Beim Bearbeiten der Benutzerdaten ist ein Fehler aufgetreten", null, 500);
		}

		$_SESSION = $user->toArray();

		$this->sendResponse("success", removeArrayKeys($_SESSION, ["is_suspended", "password", "last_login"]), "Die Benutzerdaten wurden angepasst");
	}

	/**
	 * Beendet die aktuelle Sitzung und gibt eine Erfolgsmeldung zurück, wenn $respond auf true gesetzt ist.
	 * @param bool $respond Gibt an, ob eine Erfolgsmeldung zurückgegeben werden soll.
	 * @return void
	 */
	public function logout(bool $respond = true): void
	{
		session_unset();

		if ($respond) {
			$this->sendResponse("success", null, "Erfolgreich abgemeldet");
		}
	}

	/**
	 * Überprüft, ob der aktuell angemeldete Benutzer Administratorrechte hat und gibt eine Fehlermeldung zurück, wenn er keine Administratorrechte hat.
	 * Wenn der Benutzer nicht richtig angemeldet ist, wird dieser korrekt und vollständig abgemeldet.
	 * @return void
	 */
	public function checkAdmin(): void
	{
		if (isset($_SESSION) && boolval($_SESSION["is_admin"] ?? false) !== true) {
			if (!isset($_SESSION["user_id"])) $this->logout(false);

			$this->sendResponse("error", null, "Sie haben keine Berechtigung", null, 403);
		}
	}

	/**
	 * Überprüft, ob der Benutzer angemeldet ist und gibt eine Fehlermeldung zurück, wenn der Benutzer nicht angemeldet ist.
	 * Wenn der Benutzer nicht richtig angemeldet ist, wird dieser korrekt und vollständig abgemeldet.
	 * @return void
	 */
	public function checkLogin(): void
	{
		if (isset($_SESSION) && !isset($_SESSION["email"])) {
			if (!isset($_SESSION["user_id"])) $this->logout(false);

			$this->sendResponse("error", null, "Sie sind nicht angemeldet", null, 403);
		}
	}
}