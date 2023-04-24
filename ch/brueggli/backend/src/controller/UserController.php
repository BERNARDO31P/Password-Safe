<?php

namespace controller;

use Exception;
use ReflectionException;

use JetBrains\PhpStorm\NoReturn;
use lib\DataRepo\DataRepo;

use model\User;
use model\Member;
use model\SecretKey;

use function util\getArrayKeys;
use function util\removeArrayKeys;

class UserController extends AdminController
{
	public function __construct()
	{
		parent::__construct("user");
	}

	/**
	 * Sucht Benutzer anhand des Suchstrings und gibt sie in paginierter Form zurück.
	 * @param string $search Der Suchstring.
	 * @return void
	 * @throws ReflectionException Siehe removeArrayKeys()
	 */
	#[NoReturn] public function search(string $search): void
	{
		$page = intval($_GET["page"] ?? 1);
		$users = DataRepo::of(User::class)->searchPaged($page - 1, $search);
		$users["data"] = removeArrayKeys($users["data"], ["password"]);

		$this->writeLog("Suchanfrage in Benutzer: {search}", ["search" => $search]);
		$this->sendResponse("success", $users);
	}

	/**
	 * Gibt den öffentlichen Schlüssel eines Benutzers anhand seiner ID zurück.
	 * @param int $id Die ID des Benutzers.
	 * @return void
	 */
	#[NoReturn] public function getUserKey(int $id): void
	{
		$user = $this->_getUser($id);

		$this->writeLog("Auslesen vom öffentlichen Schlüssel vom Benutzer {user_first_name} {user_last_name}", [
			"user_first_name" => $user->first_name,
			"user_last_name" => $user->last_name,
		]);
		$this->sendResponse("success", array("public_key" => $user->public_key));
	}

	/**
	 * Gibt alle Verbindungen zu Organisationen zurück, in welchen der Benutzer Mitglied ist.
	 * @param int $id Die ID des Benutzers.
	 * @return void
	 */
	#[NoReturn] public function getUserOrganizations(int $id): void
	{
		$member_entries = DataRepo::of(Member::class)->getByField("user_id", $id);

		$user = $this->_getUser($id);
		$this->writeLog("Auslesen von der Benutzermitgliedschaft aller Organisationen vom Benutzer {user_first_name} {user_last_name}", [
			"user_first_name" => $user->first_name,
			"user_last_name" => $user->last_name
		]);
		$this->sendResponse("success", $member_entries);
	}

	/**
	 * Gibt alle Benutzer mit Administratorrechten zurück.
	 * @return void
	 * @throws ReflectionException Siehe getArrayKeys()
	 */
	#[NoReturn] public function getAdmins(): void
	{
		$admins = DataRepo::of(User::class)->getByField("is_admin", 1);
		$admins = getArrayKeys($admins, ["user_id", "public_key"]);

		$this->writeLog("Auslesen von allen Administratoren");
		$this->sendResponse("success", $admins);
	}

	/**
	 * Entfernt die Administratorrechte eines Benutzers, indem der symmetrische Schlüssel des Benutzers in allen Organisationen entfernt wird.
	 * Sollte der Benutzer Mitglied einer Organisation sein, wird diese übersprungen.
	 * @param int $id Die ID des Benutzers.
	 * @return void
	 */
	#[NoReturn] public function removeAdmin(int $id): void
	{
		$this->checkUserAllowance($id);

		$secret_keys = DataRepo::of(SecretKey::class)->getByField("user_id", $id);
		$member = DataRepo::of(Member::class)->getByField("user_id", $id);

		foreach ($secret_keys as $secret_key) {
			if (!in_array($secret_key->org_id, array_column($member, "org_id"))) {
				if (!DataRepo::delete($secret_key)) {
					$user = $this->_getUser($secret_key->user_id);
					$this->sendResponse("error", null, "Beim Entfernen des Administrators {user_first_name} {user_last_name} ist ein Fehler aufgetreten", [
						"user_first_name" => $user->first_name,
						"user_last_name" => $user->last_name
					], 500);
				}
			}
		}

		$this->sendResponse("success");
	}

	/**
	 * Gibt alle Benutzer in paginierter Form zurück.
	 * @return void
	 * @throws ReflectionException Siehe getArrayKeys()
	 */
	#[NoReturn] public function getUsers(): void
	{
		$page = intval($_GET["page"] ?? 1);
		$users = DataRepo::of(User::class)->getAllPaged($page - 1);

		$users["data"] = getArrayKeys($users["data"], ["user_id", "email", "first_name", "last_name", "is_admin", "is_suspended", "last_login"]);

		$this->writeLog("Auslesen der {page}. Seite von allen Benutzern", ["page" => $page]);
		$this->sendResponse("success", $users);
	}

	/**
	 * Gibt die Daten eines Benutzers anhand seiner ID zurück.
	 * @param int $id Die ID des Benutzers.
	 * @return void
	 * @throws ReflectionException Siehe getArrayKeys()
	 */
	#[NoReturn] public function getUser(int $id): void
	{
		$user = $this->_getUser($id);
		$user = getArrayKeys($user, ["user_id", "email", "first_name", "last_name", "is_admin", "is_suspended", "public_key"]);

		$this->writeLog("Auslesen vom Benutzer {user_first_name} {user_last_name}", [
			"user_first_name" => $user->first_name,
			"user_last_name" => $user->last_name,
		]);
		$this->sendResponse("success", $user);
	}

	/**
	 * Aktualisiert die Daten des Benutzers mit der angegebenen ID.
	 * @param int $id Die ID des Benutzers.
	 * @return void
	 * @throws Exception Siehe DataRepo
	 */
	#[NoReturn] public function editUser(int $id): void
	{
		$this->checkUserAllowance($id);
		$this->checkPostArguments(["email", "first_name", "last_name", "is_admin", "is_suspended"]);

		$user = User::fromObj($_POST);
		$user->user_id = $id;

		if (!DataRepo::update($user)) {
			$this->sendResponse("error", null, "Beim Bearbeiten vom Benutzer {user_first_name} {user_last_name} ist ein Fehler aufgetreten", [
				"user_first_name" => $user->first_name,
				"user_last_name" => $user->last_name,
			], 500);
		}
		$this->sendResponse("success", null, "Der Benutzer {user_first_name} {user_last_name} wurde angepasst", [
			"user_first_name" => $user->first_name,
			"user_last_name" => $user->last_name,
		]);
	}

	/**
	 * Löscht einen Benutzer aus der Datenbank, sowie aus allen zugehörigen Organisationen, falls er kein Administrator ist.
	 * Wenn der Benutzer ein Administrator ist, wird er aus allen Organisationen entfernt und seine symmetrischen Schlüssel werden gelöscht.
	 * @param int $id Die ID des Benutzers
	 * @return void
	 * @throws Exception Siehe DataRepo
	 */
	#[NoReturn] public function deleteUser(int $id): void
	{
		$this->checkUserAllowance($id);

		$member = DataRepo::of(Member::class)->getByField("user_id", $id);
		array_map(fn ($entry) => DataRepo::delete($entry), $member);

		$secret_keys = DataRepo::of(SecretKey::class)->getByField("user_id", $id);
		array_map(fn ($entry) => DataRepo::delete($entry), $secret_keys);

		$user = $this->_getUser($id);
		if (!DataRepo::delete($user)) {
			$this->sendResponse("error", null, "Beim Entfernen vom Benutzer {user_first_name} {user_last_name} ist ein Fehler aufgetreten", [
				"user_first_name" => $user->first_name,
				"user_last_name" => $user->last_name,
			], 500);
		}
		$this->sendResponse("success", null, "Der Benutzer {user_first_name} {user_last_name} wurde entfernt", [
			"user_first_name" => $user->first_name,
			"user_last_name" => $user->last_name,
		]);
	}
}