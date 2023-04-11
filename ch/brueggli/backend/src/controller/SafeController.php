<?php

namespace controller;

use Exception;

use JetBrains\PhpStorm\NoReturn;
use lib\DataRepo\DataRepo;

use model\Member;
use model\Organization;
use model\SecretKey;
use model\Password;

use trait\getter;

class SafeController extends AdminController
{
	use getter;

	/**
	 * Sucht nach Passwörtern innerhalb einer Organisation.
	 * @param int $id - Die ID der Organisation, in der nach Passwörtern gesucht werden soll.
	 * @param string $search - Der Suchbegriff für die Passwortsuche.
	 * @return void
	 */
	#[NoReturn] public function search(int $id, string $search): void
	{
		$this->checkSafeAllowance($id);

		$page = intval($_GET["page"] ?? 1);
		$passwords = DataRepo::of(Password::class)->searchPaged($page - 1, $search, ["org_id" => $id]);

		$org = $this->_getOrganization($id);

		$this->writeLog("Suchanfrage in Passwörter von der Organisation {org_name}: {search}", [
			"search" => $search,
			"org_name" => $org->name
		]);
		$this->sendResponse("success", $passwords);
	}

	/**
	 * Ruft die Passwörter einer Organisation ab.
	 * @param int $id - Die ID der Organisation, deren Passwörter abgerufen werden sollen.
	 * @return void
	 */
	#[NoReturn] public function getPasswords(int $id): void
	{
		$this->checkSafeAllowance($id);

		$page = intval($_GET["page"] ?? 1);
		$passwords = DataRepo::of(Password::class)->getByFieldPaged($page - 1, "org_id", $id);

		$org = $this->_getOrganization($id);
		$this->writeLog("Auslesen der {page}. Seite von allen Passwörtern der Organisation {org_name}", [
			"page" => $page,
			"org_name" => $org->name
		]);

		$this->sendResponse("success", $passwords);
	}

	/**
	 * Aktualisiert die Passwörter von Organisationen.
	 * @return void
	 * @throws Exception Siehe DataRepo.
	 */
	#[NoReturn] public function setPasswords(): void
	{
		$this->checkPostArguments(["passwords"]);

		foreach ($_POST["passwords"] as $password) {
			$password = Password::fromObj($password);

			$this->checkSafeAllowance($password->org_id);
			$this->checkSignature($password->data, $password->sign);

			if (!DataRepo::update($password)) {
				$this->sendResponse("error", null, "Beim Aktualisieren der Passwörter ist ein Fehler aufgetreten", null, 500);
			}
		}
		$this->sendResponse("success");
	}

	/**
	 * Fügt ein neues Passwort hinzu.
	 * @return void
	 * @throws Exception Siehe DataRepo.
	 */
	#[NoReturn] public function addPassword(): void
	{
		$this->checkPostArguments(["name", "org_id", "data", "sign"]);
		$this->checkSafeAllowance($_POST["org_id"]);

		$password = Password::fromObj($_POST);
		$this->checkSignature($password->data, $password->sign);

		if (!DataRepo::insert($password)) {
			$this->sendResponse("error", null, "Beim Hinzufügen des Passworts ist ein Fehler aufgetreten", null, 500);
		}
		$this->sendResponse("success", array("pass_id" => $password->pass_id), "Das Passwort wurde erfolgreich hinzugefügt");
	}

	/**
	 * Aktualisiert ein bestehendes Passwort.
	 * @return void
	 * @throws Exception Siehe DataRepo.
	 */
	#[NoReturn] public function updatePassword(): void
	{
		$this->checkPostArguments(["name", "org_id", "pass_id", "data", "sign"]);
		$this->checkSafeAllowance($_POST["org_id"]);

		$password = Password::fromObj($_POST);
		$this->checkSignature($password->data, $password->sign);

		if (!DataRepo::update($password)) {
			$this->sendResponse("error", null, "Beim Aktualisieren des Passworts ist ein Fehler aufgetreten", null, 500);
		}
		$this->sendResponse("success", null, "Das Passwort wurde erfolgreich aktualisiert");
	}

	/**
	 * Entfernt ein Passwort aus der Datenbank.
	 * @return void
	 * @throws Exception Siehe DataRepo.
	 */
	#[NoReturn] public function deletePassword(): void
	{
		$this->checkPostArguments(["org_id", "pass_id"]);
		$this->checkSafeAllowance($_POST["org_id"]);

		$password = Password::fromObj($_POST);

		if (!DataRepo::delete($password)) {
			$this->sendResponse("error", null, "Beim Entfernen des Passworts ist ein Fehler aufgetreten", null, 500);
		}
		$this->sendResponse("success", null, "Das Passwort wurde erfolgreich gelöscht");
	}

	/**
	 * Lädt alle Organisationen eines Benutzers und sendet diese zurück.
	 *
	 * Ruft die Member-Einträge für den Benutzer aus der Datenbank ab und lädt dann für jeden Member-Eintrag die dazugehörige Organisation.
	 * Die Informationen der Organisationen werden in einem Array gespeichert und an den Client gesendet.
	 * @return void
	 * @throws Exception Siehe DataRepo.
	 */
	#[NoReturn] public function getOrganizations(): void
	{
		$entries = DataRepo::of(Member::class)->getByField("user_id", $_SESSION["user_id"]);

		$organizations = [];
		foreach ($entries as $entry) {
			$organization = DataRepo::of(Organization::class)->getById($entry->org_id);
			$organizations[] = $organization;
		}

		$this->sendResponse("success", $organizations);
	}

	/**
	 * Gibt den verschlüsselten symmetrischen Schlüssel für die angegebene Organisation und den aktuellen Benutzer zurück.
	 * Überprüft zunächst, ob der Benutzer die Berechtigung hat, den Schlüssel abzurufen, indem es sicherstellt, dass der Benutzer ein Mitglied der Organisation ist.
	 * Wenn der Benutzer keinen Schlüssel besitzt, wird eine DELETE-Anforderung an den Server gesendet, um den Benutzer aus der Organisation zu entfernen.
	 * @param int $id Die ID der Organisation, für die der Schlüssel abgerufen werden soll.
	 * @throws Exception Siehe DataRepo.
	 */
	#[NoReturn] public function getSecretKey(int $id): void
	{
		$this->checkSafeAllowance($id);

		$secret_key = DataRepo::of(SecretKey::class)->getByFields([
			"org_id" => $id,
			"user_id" => $_SESSION["user_id"]
		]);

		if (!count($secret_key)) {
			$members = DataRepo::of(Member::class)->getByFields([
				"org_id" => $id,
				"user_id" => $_SESSION["user_id"]
			]);
			if (count($members)) DataRepo::delete($members[0]);

			$this->sendResponse("error", null, "Sie besitzen keinen Schlüssel für diese Organisation", null, 401);
		}

		$this->sendResponse("success", $secret_key[0]);
	}
}