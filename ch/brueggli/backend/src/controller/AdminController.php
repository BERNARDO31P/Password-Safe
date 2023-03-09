<?php

namespace controller;

use lib\DataRepo\DataRepo;

use model\SecretKey;

class AdminController extends IOController
{
	/**
	 * Prüft, ob der Benutzer Berechtigung hat, diese Aktion durchzuführen.
	 * z.B. darf dieser sich nicht selbst oder das Root-Konto verändern.
	 * @param int $id Die Benutzer-ID.
	 * @return void
	 */
	protected function checkUserAllowance(int $id): void
	{
		if ($_SESSION["user_id"] === $id || $id === 1) {
			$this->sendResponse("error", null, "Sie dürfen keine Aktion auf diesen Benutzer tätigen", null, 401);
		}
	}

	/**
	 * Prüft, ob der Benutzer Berechtigung hat, diese Aktion im Tresor durchzuführen.
	 * Dies wird entschieden, ob der Benutzer einen Schlüssel besitzt oder nicht.
	 * @param int $id Die Tresor-ID
	 * @return void
	 */
	protected function checkSafeAllowance(int $id): void
	{
		$secret_key = DataRepo::of(SecretKey::class)->getByFields([
			"user_id" => $_SESSION["user_id"],
			"org_id" => $id
		]);

		if (!count($secret_key)) {
			$this->sendResponse("error", null, "Sie dürfen keine Aktion auf diesen Tresor tätigen", null, 401);
		}
	}

}