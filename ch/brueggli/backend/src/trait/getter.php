<?php

namespace trait;

use lib\DataRepo\DataRepo;

use model\Organization;
use model\User;

use controller\AuthController;

trait getter
{
	/**
	 * Gibt den Benutzer mit der angegebenen ID zurück.
	 * Wenn kein Benutzer mit der angegebenen ID gefunden wird, wird eine Fehlermeldung zurückgegeben.
	 * Wenn die Benutzer-ID der aktuellen Sitzung entspricht und kein Benutzer gefunden wird, wird der Benutzer abgemeldet und eine Fehlermeldung zurückgegeben.
	 * @param int $id Die ID des Benutzers
	 * @return object Das Benutzerobjekt mit der angegebenen ID
	 */
	private function _getUser(int $id): object
	{
		$user = DataRepo::of(User::class)->getById($id);

		if (!$user) {
			if ($id === $_SESSION["user_id"]) {
				(new AuthController())->logout(false);
				$this->sendResponse("error", null, "Dieses Konto ist ungültig", null, 403);
			}
			$this->sendResponse("error", null, "BenutzerID {id} nicht bekannt", ["id" => $id], 400);
		}

		return $user;
	}

	/**
	 * Gibt die Organisation mit der angegebenen ID zurück.
	 * Wenn keine Organisation mit der angegebenen ID gefunden wird, wird eine Fehlermeldung zurückgegeben.
	 * @param int $id Die ID der Organisation
	 * @return object Die Organisation mit der angegebenen ID
	 */
	private function _getOrganization(int $id): object
	{
		$org = DataRepo::of(Organization::class)->getById($id);

		if (!$org) {
			$this->sendResponse("error", null, "OrganisationID {id} nicht bekannt", ["id" => $id], 400);
		}

		return $org;
	}
}