<?php

namespace controller;

use Exception;

use JetBrains\PhpStorm\NoReturn;

use lib\DataRepo\DataRepo;

use model\Password;

use trait\getter;
use model\Member;
use model\Organization;
use model\SecretKey;

class SafeController extends AdminController
{
	use getter;

	// TODO: Implement and comment
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

	// TODO: Comment
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
	 * // TODO: Comment
	 * @throws Exception
	 */
	#[NoReturn] public function setPasswords(): void
	{
		$this->checkPostArguments(["passwords"]);

		foreach ($_POST["passwords"] as $password) {
			$password = Password::fromObj($password);

			$this->checkSafeAllowance($password->org_id);

			if (!DataRepo::update($password)) {
				$this->sendResponse("error", null, "Beim Aktualisieren der Passwörter ist ein Fehler aufgetreten", null, 500);
			}
		}
		$this->sendResponse("success");
	}

	/**
	 * TODO: Comment
	 * @throws Exception
	 */
	#[NoReturn] public function addPassword(): void
	{
		$this->checkPostArguments(["name", "org_id"]);
		$this->checkSafeAllowance($_POST["org_id"]);

		$password = Password::fromObj($_POST);

		if (!DataRepo::insert($password)) {
			$this->sendResponse("error", null, "Beim Hinzufügen des Passworts ist ein Fehler aufgetreten", null, 500);
		}
		$this->sendResponse("success", null, "Das Passwort wurde erfolgreich hinzugefügt");
	}

	/**
	 * TODO: Comment
	 * @throws Exception
	 */
	#[NoReturn] public function updatePassword(): void
	{
		$this->checkPostArguments(["name", "org_id", "pass_id"]);
		$this->checkSafeAllowance($_POST["org_id"]);

		$password = Password::fromObj($_POST);

		if (!DataRepo::update($password)) {
			$this->sendResponse("error", null, "Beim Aktualisieren des Passworts ist ein Fehler aufgetreten", null, 500);
		}
		$this->sendResponse("success", null, "Das Passwort wurde erfolgreich aktualisiert");
	}

	// TODO: Comment
	#[NoReturn] public function deletePassword()
	{
		$this->checkPostArguments(["org_id", "pass_id"]);
		$this->checkSafeAllowance($_POST["org_id"]);

		$password = Password::fromObj($_POST);

		if (!DataRepo::delete($password)) {
			$this->sendResponse("error", null, "Beim Entfernen des Passworts ist ein Fehler aufgetreten", null, 500);
		}
		$this->sendResponse("success", null, "Das Passwort wurde erfolgreich gelöscht");
	}

	// TODO: Comment
	#[NoReturn] public function getOrganizations()
	{
		$entries = DataRepo::of(Member::class)->getByField("user_id", $_SESSION["user_id"]);

		$organizations = [];
		foreach ($entries as $entry) {
			$organization = DataRepo::of(Organization::class)->getById($entry->org_id);
			$organizations[] = $organization;
		}

		$this->sendResponse("success", $organizations);
	}

	// TODO: Comment
	#[NoReturn] public function getSecretKey(int $id)
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