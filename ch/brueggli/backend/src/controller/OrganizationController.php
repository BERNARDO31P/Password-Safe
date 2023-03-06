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
	 * Setzt einen neuen symmetrischen Schlüssel für eine Organisation anhand ihrer ID.
	 * @param int $id Die ID der Organisation.
	 * @return void
	 * @throws Exception Siehe DataRepo
	 */
	#[NoReturn] public function setOrganizationKey(): void
	{
		$this->checkPostArguments(["secret_key"]);

		$secret_key = SecretKey::fromObj($_POST["secret_key"]);

		if (!DataRepo::insert($secret_key)) {
			$this->sendResponse("error", null, "Beim Bearbeiten von der Organisation mit der ID {org_id} ist ein Fehler aufgetreten", ["org_id" => $secret_key->org_id], 500);
		}
		$this->sendResponse("success", null, "Der neue Schlüssel wurde für die Organisation mit der ID {org_id} gesetzt", ["org_id" => $secret_key->org_id]);
	}

	// TODO: Comment
	/**
	 * @throws Exception
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

	// TODO: Comment
	#[NoReturn] public function deleteOrganizationMember(): void
	{
		$this->checkPostArguments(["member"]);

		$member = DataRepo::of(Member::class)->getByFields($_POST["member"])[0];

		$org = $this->_getOrganization($member->org_id);
		if (!DataRepo::delete($member)) {
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
		])[0];

		$org = $this->_getOrganization($id);
		$this->writeLog("Auslesen vom eigenen symmetrischen Schlüssel der Organisation {org_name}", ["org_name" => $org->name]);
		$this->sendResponse("success", array("secret_key" => $secret_key->secret_key));
	}

	/**
	 * Gibt alle Organisationen in paginierter Form zurück.
	 * @return void
	 * @throws ReflectionException Siehe getArrayKeys()
	 */
	#[NoReturn] public function getOrganizations(): void
	{
		$page = intval($_GET["page"] ?? 1);
		$orgs = DataRepo::of(Organization::class)->getAllPaged($page - 1);

		$orgs["data"] = getArrayKeys($orgs["data"], ["org_id", "name", "description", "members"]);

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
	 * @throws Exception
	 */
	public function setOrganizationKeys(): void
	{
		$this->checkPostArguments(["secret_keys"]);
		foreach ($_POST["secret_keys"] as $secret_key) {
			$secret_key = SecretKey::fromObj($secret_key);
			DataRepo::insert($secret_key);
		}
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
		array_map(fn ($entry) => DataRepo::delete($entry), $member);

		$secret_keys = DataRepo::of(SecretKey::class)->getByField("org_id", $id);
		array_map(fn ($entry) => DataRepo::delete($entry), $secret_keys);

		$passwords = DataRepo::of(Password::class)->getByField("org_id", $id);
		array_map(fn ($entry) => DataRepo::delete($entry), $passwords);

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