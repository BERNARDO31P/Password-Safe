<?php

namespace controller;

class AdminController extends IOController
{
	/**
	 * Prüft, ob der Benutzer Berechtigung hat, diese Aktion durchzuführen
	 * z.B. darf dieser sich nicht selbst oder das Root-Konto verändern
	 * @param int $id Die Benutzer-ID.
	 * @return void
	 */
	protected function checkUserAllowance(int $id): void
	{
		if ($_SESSION["user_id"] === $id || $id === 1) {
			$this->sendResponse("error", null, "Sie dürfen keine Aktion auf diesen Benutzer tätigen", null, 400);
		}
	}
}