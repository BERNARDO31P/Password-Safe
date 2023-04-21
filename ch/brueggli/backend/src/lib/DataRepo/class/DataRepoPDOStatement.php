<?php

namespace lib\DataRepo\class;

use PDOStatement;

class DataRepoPDOStatement extends PDOStatement
{
	protected function __construct()
	{
		// Leerer Konstruktor, um die PDOStatement-Klasse zu erweitern, da sonst der Standardkonstruktor verwendet wird.
	}

	/**
	 * Erweitert die PDOStatement um die Möglichkeit, mehrere Parameter gleichzeitig zu binden.
	 * @param array $params Ein Array mit den Parametern, die gebunden werden sollen.
	 * @return bool True bei Erfolg, false sonst.
	 */
	public function bindParams(array $params): bool
	{
		foreach ($params as $key => $value) {
			if (!$this->bindValue($key, $value))
				return false;
		}
		return true;
	}
}