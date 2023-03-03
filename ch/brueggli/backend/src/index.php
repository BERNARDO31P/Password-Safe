<?php declare(strict_types=1);

session_start();

ini_set("memory_limit", "512M");
ini_set("post_max_size", "256M");
ini_set("upload_max_filesize", "256M");

$request_body = file_get_contents("php://input");
if (!empty($request_body)) $_POST = json_decode($request_body, true, 512,  JSON_BIGINT_AS_STRING);

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

DataRepo::$callback = function () {};
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

$router->get("/health", "IOController@health");

$router->run();