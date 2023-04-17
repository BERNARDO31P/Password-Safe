<?php

namespace lib\DataRepo\util;

use PDO;
use Exception;

/**
 * Attempts to create and return a PDO connection to the MySQL database.
 * @param callable $callback A callable to be executed before creating the PDO instance.
 * @param callable $callbackError A callable to be executed if creating the PDO instance fails.
 * @return PDO|null The created PDO instance on success, null otherwise.
 */
function getDbh(callable $callback, callable $callbackError): PDO|null
{
	try {
		$callback();
		return new PDO(
			"mysql:host=" . getenv("MYSQL_HOST") . ";dbname=" . getenv("MYSQL_DB_NAME") . ";charset=utf8",
			getenv("MYSQL_USER"),
			getenv("MYSQL_PW"),
			[
				PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
				PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
				PDO::ATTR_EMULATE_PREPARES => true,
			]
		);
	} catch (Exception $e) {
		error_log($e->getMessage());
		$callbackError();
	}
	return null;
}