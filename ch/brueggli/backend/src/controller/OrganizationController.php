<?php

namespace controller;

use Exception;
use ReflectionException;

use JetBrains\PhpStorm\NoReturn;
use lib\DataRepo\DataRepo;

use model\Organization;
use model\Member;
use model\SecretKey;
use model\Password;

use trait\getter;

use function util\getArrayKeys;

class OrganizationController extends AdminController
{
	use getter;

	/**
	 * Sucht Organisationen anhand des Suchstrings und gibt sie in paginierter Form zurück.
	 * @param string $search Der Suchstring.
	 * @return void
	 */
	#[NoReturn] public function search(string $search): void
	{
		$page = intval($_GET["page"] ?? 1);
		$orgs = DataRepo::of(Organization::class)->searchPaged($page - 1, $search);

		$this->writeLog("Suchanfrage in Organisationen: {search}", ["search" => $search]);
		$this->sendResponse("success", $orgs);
	}

	/**
	 * Setzt einen neuen symmetrischen Schlüssel für eine Organisation
	 * @return void
	 * @throws Exception Siehe DataRepo
	 */
	#[NoReturn] public function setOrganizationKey(): void
	{
		$this->checkPostArguments(["secret_key"]);

		$secret_key = SecretKey::fromObj($_POST["secret_key"]);

		$entries = DataRepo::of(SecretKey::class)->getByFields([
			"user_id" => $secret_key->user_id,
			"org_id" => $secret_key->org_id
		]);

		$org = $this->_getOrganization($secret_key->org_id);
		if (!count($entries) && !DataRepo::insert($secret_key)) {
			$this->sendResponse("error", null, "Beim Bearbeiten von der Organisation {org_name} ist ein Fehler aufgetreten", ["org_name" => $org->name], 500);
		}
		$this->sendResponse("success");
	}

	/**
	 * Setzt mehrere neue symmetrische Schlüssel für eine Organisation
	 * @return void
	 * @throws Exception Siehe DataRepo
	 */
	#[NoReturn] public function setOrganizationKeys(): void
	{
		$this->checkPostArguments(["secret_keys"]);

		foreach ($_POST["secret_keys"] as $secret_key) {
			$secret_key = SecretKey::fromObj($secret_key);
			$org = $this->_getOrganization($secret_key->org_id);
			if (!DataRepo::insert($secret_key)) {
				$this->sendResponse("error", null, "Beim Bearbeiten von der Organisation {org_name} ist ein Fehler aufgetreten", ["org_name" => $org->name], 500);
			}
		}
		$this->sendResponse("success");
	}

	/**
	 * Aktualisiert bestehende symmetrische Schlüssel für eine Organisation
	 * @return void
	 * @throws Exception Siehe DataRepo
	 */
	#[NoReturn] public function updateOrganizationKeys(): void
	{
		$this->checkPostArguments(["secret_keys"]);

		foreach ($_POST["secret_keys"] as $secret_key) {
			$secret_key = SecretKey::fromObj($secret_key);

			$secret_key_old = DataRepo::of(SecretKey::class)->getByFields([
				"user_id" => $secret_key->user_id,
				"org_id" => $secret_key->org_id
			]);

			$org = $this->_getOrganization($secret_key->org_id);
			if (!count($secret_key_old)) {
				$this->sendResponse("error", null, "Beim Bearbeiten von der Organisation {org_name} ist ein Fehler aufgetreten", ["org_name" => $org->name], 500);
			}

			$secret_key->secret_id = $secret_key_old[0]->secret_id;

			if (!DataRepo::update($secret_key)) {
				$this->sendResponse("error", null, "Beim Bearbeiten von der Organisation {org_name} ist ein Fehler aufgetreten", ["org_name" => $org->name], 500);
			}
		}
		$this->sendResponse("success");
	}


	/**
	 * Gibt alle Mitglieder einer Organisation anhand ihrer ID zurück.
	 * @param int $id Die Organisations-ID
	 * @return void
	 * @throws Exception Siehe DataRepo
	 */
	#[NoReturn] public function getOrganizationMembers(int $id): void
	{
		$page = intval($_GET["page"] ?? 1);
		$members = DataRepo::of(Member::class)->getByFieldPaged($page - 1, "org_id", $id);

		$org = $this->_getOrganization($id);
		$this->writeLog("Auslesen aller Mitglieder der Organisation {org_name}", ["org_name" => $org->name]);
		$this->sendResponse("success", $members);
	}

	/**
	 * Setzt eine Verbindung zwischen einem Benutzer und einer Organisation.
	 * Fügt somit einen Benutzer zu einer Organisation hinzu.
	 * @return void
	 * @throws Exception Siehe DataRepo
	 */
	#[NoReturn] public function setOrganizationMember(): void
	{
		$this->checkPostArguments(["member"]);

		$member = Member::fromObj($_POST["member"]);

		$org = $this->_getOrganization($member->org_id);
		if (!DataRepo::insert($member)) {
			$this->sendResponse("error", null, "Beim Bearbeiten von der Organisation {org_name} ist ein Fehler aufgetreten", ["org_name" => $org->name], 500);
		}
		$this->sendResponse("success", null, "Der Benutzer wurde zur Organisation {org_name} hinzugefügt", ["org_name" => $org->name]);
	}

	/**
	 * Löscht die Verbindung zwischen einem Benutzer und einer Organisation.
	 * Entfernt somit einen Benutzer aus einer Organisation.
	 * @return void
	 * @throws Exception Siehe DataRepo
	 */
	#[NoReturn] public function deleteOrganizationMember(): void
	{
		$this->checkPostArguments(["member"]);

		$member = DataRepo::of(Member::class)->getByFields($_POST["member"]);
		$secret_key = DataRepo::of(SecretKey::class)->getByFields($_POST["member"]);

		if (!count($member) || !count($secret_key)) {
			$this->sendResponse("error", null, "Keine Daten gefunden", null, 400);
		}

		$org = $this->_getOrganization($member[0]->org_id);
		$user = $this->_getUser($member[0]->user_id);

		if (!$user->is_admin && !DataRepo::delete($secret_key[0])) {
			$this->sendResponse("error", null, "Beim Bearbeiten von der Organisation {org_name} ist ein Fehler aufgetreten", ["org_name" => $org->name], 500);
		}

		if (!DataRepo::delete($member[0])) {
			$this->sendResponse("error", null, "Beim Bearbeiten von der Organisation {org_name} ist ein Fehler aufgetreten", ["org_name" => $org->name], 500);
		}
		$this->sendResponse("success", null, "Der Benutzer wurde aus der Organisation {org_name} entfernt", ["org_name" => $org->name]);
	}

	/**
	 * Gibt den eigenen symmetrischen Schlüssel einer Organisation anhand ihrer ID zurück.
	 * @param int $id Die ID der Organisation.
	 * @return void
	 * @throws Exception Die Organisation konnte nicht gelöscht werden.
	 */
	#[NoReturn] public function getOrganizationKey(int $id): void
	{
		$secret_key = DataRepo::of(SecretKey::class)->getByFields([
			"org_id" => $id,
			"user_id" => $_SESSION["user_id"]
		]);

		if (!count($secret_key)) {
			$this->sendResponse("error", null, "Sie können diese Aktion nicht durchführen", null, 403);
		}

		$org = $this->_getOrganization($id);
		$this->writeLog("Auslesen vom eigenen symmetrischen Schlüssel der Organisation {org_name}", ["org_name" => $org->name]);
		$this->sendResponse("success", $secret_key[0]);
	}

	/**
	 * Gibt die symmetrischen Schlüssel des Benutzers für alle Organisationen zurück.
	 * @return void
	 */
	#[NoReturn] public function getOrganizationsKey(): void
	{
		$page = intval($_GET["page"] ?? 1);
		$secret_keys = DataRepo::of(SecretKey::class)->getByFieldPaged($page - 1, "user_id", $_SESSION["user_id"]);

		$this->sendResponse("success", $secret_keys);
	}

	/**
	 *
	 * Speichert die symmetrischen Schlüssel des Benutzers für Organisationen.
	 * @throws Exception Wenn beim Speichern eines symmetrischen Schlüssels ein Fehler auftritt.
	 * @return void
	 */
	#[NoReturn] public function setOrganizationsKey(): void
	{
		$this->checkPostArguments(["secret_keys"]);

		foreach ($_POST["secret_keys"] as $secret_key) {
			$secret_key = SecretKey::fromObj($secret_key);
			if (!DataRepo::insert($secret_key)) {
				$org = $this->_getOrganization($secret_key->org_id);
				$this->sendResponse("error", null, "Beim Bearbeiten von der Organisation {org_name} ist ein Fehler aufgetreten", ["org_name" => $org->name], 500);
			}
		}
		$this->sendResponse("success");
	}

	/**
	 * Gibt alle Organisationen in paginierter Form zurück.
	 * @return void
	 */
	#[NoReturn] public function getOrganizations(): void
	{
		$page = intval($_GET["page"] ?? 1);
		$orgs = DataRepo::of(Organization::class)->getAllPaged($page - 1);

		$this->writeLog("Auslesen der {page}. Seite von allen Organisationen", ["page" => $page]);
		$this->sendResponse("success", $orgs);
	}

	/**
	 * Fügt eine neue Organisation hinzu.
	 *
	 * @return void
	 * @throws Exception Siehe DataRepo
	 */
	#[NoReturn] public function addOrganization(): void
	{
		$this->checkPostArguments(["name"]);

		$org = Organization::fromObj($_POST);
		if (!DataRepo::insert($org)) {
			$this->sendResponse("error", null, "Beim Hinzufügen der Organisation {org_name} ist ein Fehler aufgetreten", ["org_name" => $org->name], 500);
		}
		$this->sendResponse("success", $org->toArray(), "Die Organisation {org_name} wurde erstellt", ["org_name" => $org->name]);
	}

	/**
	 * Aktualisiert die Daten einer Organisation.
	 *
	 * @param int $id Die ID der Organisation.
	 * @return void
	 * @throws Exception Siehe DataRepo
	 */
	#[NoReturn] public function editOrganization(int $id): void
	{
		$this->checkPostArguments(["name"]);

		$org = Organization::fromObj($_POST);
		$org->org_id = $id;

		if (!DataRepo::update($org)) {
			$this->sendResponse("error", null, "Beim Bearbeiten der Organisation {org_name} ist ein Fehler aufgetreten", ["org_name" => $org->name], 500);
		}
		$this->sendResponse("success", null, "Die Organisation {org_name} wurde angepasst", ["org_name" => $org->name]);
	}

	/**
	 * Löscht eine Organisation und entfernt alle Verweise auf sie aus den Benutzerobjekten.
	 * @param int $id Die ID der Organisation.
	 * @param bool $respond Definiert, ob eine Antwort gesendet werden soll
	 * @return void
	 * @throws Exception Siehe DataRepo
	 */
	public function deleteOrganization(int $id, bool $respond = true): bool
	{
		$member = DataRepo::of(Member::class)->getByField("org_id", $id);
		array_map(fn($entry) => DataRepo::delete($entry), $member);

		$secret_keys = DataRepo::of(SecretKey::class)->getByField("org_id", $id);
		array_map(fn($entry) => DataRepo::delete($entry), $secret_keys);

		$passwords = DataRepo::of(Password::class)->getByField("org_id", $id);
		array_map(fn($entry) => DataRepo::delete($entry), $passwords);

		$org = $this->_getOrganization($id);
		if (!DataRepo::delete($org)) {
			if ($respond) {
				$this->sendResponse("error", null, "Beim Entfernen der Organisation {org_name} ist ein Fehler aufgetreten", ["org_name" => $org->name], 500);
			} else {
				return false;
			}
		}

		if ($respond) {
			$this->sendResponse("success", null, "Die Organization {org_name} wurde entfernt", ["org_name" => $org->name]);
		} else {
			return true;
		}
	}
}