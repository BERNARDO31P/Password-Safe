<?php declare(strict_types=1);

session_start();

ini_set("memory_limit", "512M");
ini_set("post_max_size", "256M");
ini_set("upload_max_filesize", "256M");

$request_body = file_get_contents("php://input");
if (!empty($request_body)) $_POST = json_decode($request_body, true, 512, JSON_BIGINT_AS_STRING);

header("Content-Type: application/json");
date_default_timezone_set("Europe/Zurich");

require_once __DIR__ . "/autoload.php";
require_once __DIR__ . "/vendor/autoload.php";

require_once __DIR__ . "/util/utils.php";

use Bramus\Router\Router;

use lib\DataRepo\DataRepo;
use controller\IOController;

set_exception_handler(function (Throwable $error) {
	(new IOController())->writeLog($error->getMessage(), null, 500);
});

DataRepo::$callback = function () {
};
DataRepo::$callbackError = function () {
	(new IOController)->sendResponse("error", null, "Datenbank Server nicht erreichbar", null, 503);
};

$router = new Router();
$router->setNamespace("controller");
$router->setBasePath("/api");

$router->set404("IOController@show404");

$router->before("GET|POST|PUT|DELETE", "/admin.*", "AuthController@checkAdmin");
$router->before("GET|POST|PUT|DELETE", "/safe.*", "AuthController@checkLogin");

$router->mount("/auth", function () use ($router) {
	$router->post("/login", "AuthController@login");
	$router->post("/register", "AuthController@register");
	$router->get("/logout", "AuthController@logout");
});

$router->mount("/safe", function () use ($router) {
	$router->post("/", "SafeController@addPassword");
	$router->patch("/", "SafeController@updatePassword");
	$router->delete("/", "SafeController@deletePassword");

	$router->mount("/{id}", function () use ($router) {
		$router->get("/{search}", "SafeController@search");
		$router->get("/key", "SafeController@getSecretKey");

		$router->get("/", "SafeController@getPasswords");
		$router->patch("/", "SafeController@setPasswords");
	});

	$router->get("/", "SafeController@getOrganizations");
});

$router->mount("/admin", function () use ($router) {
	$router->mount("/users", function () use ($router) {
		$router->get("/admins", "UserController@getAdmins");

		$router->get("/{search}", "UserController@search");

		$router->get("/", "UserController@getUsers");
	});

	$router->mount("/user/{id}", function () use ($router) {
		$router->get("/key", "UserController@getUserKey");
		$router->get("/organizations", "UserController@getUserOrganizations");

		$router->delete("/admin", "UserController@removeAdmin");

		$router->get("/", "UserController@getUser");
		$router->patch("/", "UserController@editUser");
		$router->delete("/", "UserController@deleteUser");
	});

	$router->mount("/organization", function () use ($router) {
		$router->post("/keys", "OrganizationController@setOrganizationKeys");
		$router->patch("/keys", "OrganizationController@updateOrganizationKeys");

		$router->post("/key", "OrganizationController@setOrganizationKey");

		$router->post("/member", "OrganizationController@setOrganizationMember");
		$router->delete("/member", "OrganizationController@deleteOrganizationMember");

		$router->mount("/{id}", function () use ($router) {
			$router->get("/key", "OrganizationController@getOrganizationKey");
			$router->get("/members", "OrganizationController@getOrganizationMembers");

			$router->patch("/", "OrganizationController@editOrganization");

			$router->delete("/", "OrganizationController@deleteOrganization");
		});
	});

	$router->mount("/organizations", function () use ($router) {
		$router->get("/", "OrganizationController@getOrganizations");

		$router->get("/key", "OrganizationController@getOrganizationsKey");
		$router->post("/key", "OrganizationController@setOrganizationsKey");

		$router->get("/{search}", "OrganizationController@search");

		$router->post("/", "OrganizationController@addOrganization");
	});


});

$router->get("/health", "IOController@health");

$router->run();