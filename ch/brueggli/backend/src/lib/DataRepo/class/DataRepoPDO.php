<?php

namespace lib\DataRepo\class;

use PDO;

class DataRepoPDO extends PDO
{
	public function __construct(string $dsn, string $username = null, string $password = null, array $options = [])
	{
		parent::__construct($dsn, $username, $password, $options);

		// Setzt die Option, um die DataRepoPDOStatement-Klasse zu verwenden.
		$this->setAttribute(PDO::ATTR_STATEMENT_CLASS, [DataRepoPDOStatement::class, []]);
	}

	/**
	 * Erweitert die PDO um die Möglichkeit, DataRepoPDOStatement zu verwenden.
	 * @param string $query Die SQL-Abfrage, die vorbereitet werden soll.
	 * @param array $options Die Optionen, die an die PDOStatement weitergegeben werden sollen.
	 * @return false|DataRepoPDOStatement Das vorbereitete PDOStatement bei Erfolg, false sonst.
	 */
	public function prepare(string $query, array $options = []): false|DataRepoPDOStatement
	{
		return parent::prepare($query, $options);
	}
}

