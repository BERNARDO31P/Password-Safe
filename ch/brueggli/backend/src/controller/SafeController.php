<?php

namespace controller;

use Exception;

use JetBrains\PhpStorm\NoReturn;

use lib\DataRepo\DataRepo;

use model\Password;

use trait\getter;

class SafeController extends AdminController
{
	use getter;

	// TODO: Comment
	#[NoReturn] public function getData(int $id): void
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
	public function setData()
	{
		$this->checkPostArguments(["passwords"]);

		if (count($_POST["passwords"])) {
			$org_id = $_POST["passwords"][0]->org_id;

			$this->checkSafeAllowance($org_id);

			foreach ($_POST["passwords"] as $password) {
				DataRepo::update($password);
			}
		}
	}
}