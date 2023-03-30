<?php

namespace controller;

use lib\DataRepo\DataRepo;

use model\SecretKey;

use trait\getter;

class AdminController extends IOController
{
	use getter;
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

	/**
	 * Prüft, ob die Signatur mit den Daten und dem öffentlichen Schlüssel des Benutzers übereinstimmt.
	 * @param string $data Die Daten, die signiert wurden.
	 * @param string $signature Die Signatur.
	 * @return void
	 */
	protected function checkSignature(string $data, string $signature): void
	{
		$data = base64_decode($data);
		$signature = base64_decode($signature);

		$user = $this->_getUser($_SESSION["user_id"]);
		$public_key = openssl_pkey_get_public($user->sign_public_key);

		if (!openssl_verify($data, $signature, $public_key, OPENSSL_ALGO_SHA256)) {
			$this->sendResponse("error", null, "Manipulation der Daten festgestellt, ändern Sie Ihr Passwort schnellstmöglich", null, 403);
		}
	}

}