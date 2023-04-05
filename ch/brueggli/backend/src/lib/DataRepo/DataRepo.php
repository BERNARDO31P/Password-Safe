<?php declare(strict_types=1);

namespace lib\DataRepo;

require_once("util/getDbh.php");

use PDO;
use Exception;
use PDOException;

use function lib\DataRepo\util\getDbh;

class DataRepo
{
	private mixed $class;
	private static int $page_count = 10;
	private static string $page_limit;

	public static mixed $callback;
	public static mixed $callbackError;

	/**
	 * Constructor for the DataRepo class.
	 *
	 * @param string $class The name of the model class to be used by this repo.
	 */
	public function __construct(string $class)
	{
		$this->class = $class;
	}

	/**
	 * A helper factory method for creating a new `DataRepo` instance
	 * that immediately sets the model type and sets up the repo for
	 * handy chaining calls.
	 *
	 * @param string $class The name of the class to be instantiated.
	 * @return static The resulting instance.
	 */
	public static function of(string $class): static
	{
		static::$page_limit = " LIMIT " . static::$page_count . " OFFSET :page";
		return new static($class);
	}

	/**
	 * The base SQL statement that can be appended to for other queries.
	 * It will select all entries of a table by default.
	 * The 'WHERE 1 = 1' clause is used as a placeholder to simplify the construction
	 * of SQL queries that add additional WHERE conditions.
	 *
	 * @return string The string containing the raw SQL statement.
	 */
	private function baseFetchSql(): string
	{
		return "SELECT * FROM " . $this->class::TABLE_NAME . " WHERE 1 = 1";
	}

	/**
	 * The base SQL statement that can be appended to for other queries.
	 * It will select the count of all entries of a table by default.
	 * The 'WHERE 1 = 1' clause is used as a placeholder to simplify the construction
	 * of SQL queries that add additional WHERE conditions.
	 *
	 * @return string The string containing the raw SQL statement.
	 */
	private function getCount(): string
	{
		return "SELECT COUNT(" . $this->class::PRIMARY_KEY . ") AS count FROM " . $this->class::TABLE_NAME . " WHERE 1 = 1";
	}

	/**
	 * Gets all entries in a table.
	 *
	 * @return array|null An array containing each entry or null if table is empty.
	 * @throws PDOException If the query fails.
	 */
	public function getAll(): array|null
	{
		$stmt = getDbh(self::$callback, self::$callbackError)->prepare($this->baseFetchSql());

		try {
			$stmt->execute();
			$result = $stmt->fetchAll();
		} catch (PDOException $e) {
			throw new PDOException("Error getting data: " . $e->getMessage());
		}

		if ($result === false) {
			return null;
		}

		return array_map(fn($row) => $this->class::fromObj($row), $result);
	}

	/**
	 * Gets all entries in a table paged by a certain number.
	 * This function uses the LIMIT and OFFSET clauses to implement pagination.
	 * The $page parameter specifies the current page number, and the page count
	 * is specified by the static $page_count property.
	 *
	 * @param int $page The current page number.
	 * @return array An array containing each entry for the current page and the total count of entries.
	 * @throws PDOException If any query fails.
	 */
	public function getAllPaged(int $page): array
	{
		$stmt = getDbh(self::$callback, self::$callbackError)->prepare($this->baseFetchSql() . static::$page_limit);

		$offset = static::$page_count * $page;
		$stmt->bindParam("page", $offset, PDO::PARAM_INT);

		try {
			$stmt->execute();
			$result = $stmt->fetchAll();
		} catch (PDOException $e) {
			throw new PDOException("Error getting data: " . $e->getMessage());
		}

		$stmt = getDbh(self::$callback, self::$callbackError)->prepare($this->getCount());

		try {
			$stmt->execute();
			$count = $stmt->fetch();
		} catch (PDOException $e) {
			throw new PDOException("Error getting count: " . $e->getMessage());
		}

		return ["data" => array_map(fn($row) => $this->class::fromObj($row), $result), ...$count];
	}

	/**
	 * Gets entries in a table by a certain field value paged.
	 *
	 * @param int $page The current page number.
	 * @param string $field The field whose value is filtered.
	 * @param mixed $value The value expected for the given field.
	 * @return array|null An array containing each entry on success,
	 *                    `null` otherwise.
	 * @throws PDOException If the query fails.
	 */
	public function getByFieldPaged(int $page, string $field, mixed $value): array|null
	{
		$sql = $this->baseFetchSql() . " AND " . $field . " = :" . $field;
		$stmt = getDbh(self::$callback, self::$callbackError)->prepare($sql . static::$page_limit);

		$offset = static::$page_count * $page;
		$stmt->bindParam("page", $offset, PDO::PARAM_INT);
		$stmt->bindParam($field, $value);

		try {
			$stmt->execute();
			$result = $stmt->fetchAll();
		} catch (PDOException $e) {
			throw new PDOException("Error getting data: " . $e->getMessage());
		}

		$stmt = getDbh(self::$callback, self::$callbackError)->prepare($this->getCount());

		try {
			$stmt->execute();
			$count = $stmt->fetch();
		} catch (PDOException $e) {
			throw new PDOException("Error getting count: " . $e->getMessage());
		}

		return ["data" => array_map(fn($row) => $this->class::fromObj($row), $result), ...$count];
	}

	/**
	 * Gets entries in a table that matches a search term paged by a certain number.
	 * This function uses the LIKE clause to match entries that contain the search term.
	 * The $page parameter specifies the current page number, and the page count
	 * is specified by the static $page_count property.
	 *
	 * @param int $page The current page number.
	 * @param string $search The search term to look for in the entries.
	 * @return array An array containing each matching entry for the current page and the total count of matching entries.
	 * @throws PDOException If the query fails.
	 */
	public function searchPaged(int $page, string $search, array $id = [1 => 1]): array
	{
		$mapFn = fn($key) => "LOWER(" . $key . ") LIKE :search";
		$search = "%$search%";

		$searchSQL = " AND " . implode(" OR ", array_map($mapFn, $this->class::getDbFields())) . " AND " . key($id) . " = :value";

		$sql = $this->baseFetchSql() . $searchSQL . static::$page_limit;
		$stmt = getDbh(self::$callback, self::$callbackError)->prepare($sql);

		$offset = static::$page_count * $page;
		$value = current($id);

		$stmt->bindParam("page", $offset, PDO::PARAM_INT);
		$stmt->bindParam("search", $search);
		$stmt->bindParam("value", $value);

		try {
			$stmt->execute();
			$result = $stmt->fetchAll();
		} catch (PDOException $e) {
			throw new PDOException("Error getting data: " . $e->getMessage());
		}

		if ($result === false) {
			return array();
		}

		$sql = $this->getCount() . $searchSQL . static::$page_limit;
		$stmt = getDbh(self::$callback, self::$callbackError)->prepare($sql);

		$stmt->bindParam("page", $offset, PDO::PARAM_INT);
		$stmt->bindParam("search", $search);
		$stmt->bindParam("value", $value);

		try {
			$stmt->execute();
			$count = $stmt->fetch();
		} catch (PDOException $e) {
			error_log($e->getMessage());
			throw new PDOException("Error getting count: " . $e->getMessage());
		}

		return ["data" => array_map(fn($row) => $this->class::fromObj($row), $result), ...$count];
	}

	/**
	 * Gets all entries in a table, but as objects.
	 *
	 * @return array An array containing each entry (as objects).
	 */
	public function getAllAsObjects(): array
	{
		return array_map(fn($e) => $e->toObj(), $this->getAll());
	}

	/**
	 * Gets an entry in a table by its numerical ID.
	 *
	 * @param int $id The numerical ID.
	 * @return object|null The entry on success,
	 *                      `null` otherwise.
	 * @throws PDOException If the query fails.
	 */
	public function getById(int $id): object|null
	{
		$sql = $this->baseFetchSql() . " AND " . $this->class::PRIMARY_KEY . " = :id";
		$stmt = getDbh(self::$callback, self::$callbackError)->prepare($sql);

		try {
			$stmt->execute(["id" => $id]);
			$result = $stmt->fetch();
		} catch (PDOException $e) {
			throw new PDOException("Error getting data: " . $e->getMessage());
		}

		if ($result === false) {
			return null;
		}

		return $this->class::fromObj($result);
	}

	/**
	 * Gets multiple entries in a table by their numerical IDs.
	 *
	 * @param array $ids The numerical IDs.
	 * @return array|null An array containing each entry on success,
	 *                    `null` otherwise.
	 * @throws PDOException If the query fails.
	 */
	public function getByIds(array $ids): array|null
	{
		if (count($ids) === 0 || !ctype_digit(implode("", $ids))) {
			return null;
		}

		$sql = $this->baseFetchSql() . " AND " . $this->class::PRIMARY_KEY . " IN (" . implode(",", $ids) . ")";
		$stmt = getDbh(self::$callback, self::$callbackError)->prepare($sql);

		try {
			$stmt->execute();
			$result = $stmt->fetchAll();
		} catch (PDOException $e) {
			throw new PDOException("Error inserting data: " . $e->getMessage());
		}

		if ($result === false) {
			return null;
		}

		return array_map(fn($row) => $this->class::fromObj($row), $result);
	}

	/**
	 * Inserts a model into the respective table.
	 * This function uses the serializeFields function to ensure that any object
	 * or array values in the model are properly serialized before insertion into the database.
	 *
	 * @param mixed &$model The model to be serialized and inserted.
	 * @return bool Returning the success state of the sql.
	 * @throws PDOException If the query fails.
	 * @throws Exception If any JSON field of the model can't be encoded.
	 */
	public static function insert(mixed &$model): bool
	{
		$keyVal = $model->toArray();
		self::serializeFields($keyVal);
		$sql = "INSERT INTO " . $model::TABLE_NAME . " (" . implode(", ", array_keys($keyVal))
			. ") VALUES (:" . implode(", :", array_keys($keyVal)) . ")";
		$dbh = getDbh(self::$callback, self::$callbackError);
		$stmt = $dbh->prepare($sql);

		try {
			$success = $stmt->execute($keyVal);
			$model->setId((int)$dbh->lastInsertId());
		} catch (PDOException $e) {
			throw new PDOException("Error inserting data: " . $e->getMessage());
		}

		return $success;
	}


	/**
	 * Deletes a model from the respective table.
	 *
	 * @param mixed $model The model to be deleted.
	 * @return bool Whether the deletion was successful or not.
	 * @throws PDOException If the query fails.
	 */
	public static function delete(mixed $model): bool
	{
		$sql = "DELETE FROM " . $model::TABLE_NAME . " WHERE " . $model::PRIMARY_KEY . " = :id";
		$stmt = getDbh(self::$callback, self::$callbackError)->prepare($sql);
		$stmt->bindValue(":id", $model->id(), PDO::PARAM_INT);

		try {
			$stmt->execute();
			return $stmt->rowCount() > 0;
		} catch (PDOException $e) {
			throw new PDOException("Error deleting data: " . $e->getMessage());
		}
	}

	/**
	 * Updates a model in the respective table.
	 * This function uses the serializeFields function to ensure that any object
	 * or array values in the model are properly serialized before updating the database.
	 * It also appends an artificial key with the value for the primary key, as there can be no multiple named
	 * parameters bound to the same array field.
	 *
	 * @param mixed $model The model to be updated.
	 * @return bool Whether the update was successful or not.
	 * @throws PDOException If the query fails.
	 * @throws Exception If any JSON field of the model can't be encoded.
	 */
	public static function update(mixed $model): bool
	{
		$keyVal = $model->toArray();
		self::serializeFields($keyVal);

		$mapFn = fn($key) => $key . " = :" . $key;
		$sql = "UPDATE " . $model::TABLE_NAME . " SET " . implode(", ", array_map($mapFn, array_keys($keyVal)))
			. " WHERE " . $model::PRIMARY_KEY . " = :__id";

		$stmt = getDbh(self::$callback, self::$callbackError)->prepare($sql);
		$keyVal["__id"] = $model->id();

		try {
			return $stmt->execute($keyVal);
		} catch (PDOException $e) {
			throw new PDOException("Error updating data: " . $e->getMessage());
		}
	}

	/**
	 * Gets all entries in a table by a certain field value.
	 *
	 * @param string $field The field whose value is filtered.
	 * @param mixed $value The value expected for the given field.
	 * @return array|null An array containing each entry on success,
	 *                    `null` otherwise.
	 * @throws PDOException If the query fails.
	 */
	public function getByField(string $field, mixed $value): array|null
	{
		$sql = $this->baseFetchSql() . " AND " . $field . " = :" . $field;
		$stmt = getDbh(self::$callback, self::$callbackError)->prepare($sql);

		try {
			$stmt->execute([$field => $value]);
			$result = $stmt->fetchAll();
		} catch (PDOException $e) {
			throw new PDOException("Error getting data: " . $e->getMessage());
		}

		if ($result === false) {
			return null;
		}

		return array_map(fn($row) => $this->class::fromObj($row), $result);
	}

	/**
	 * Gets all entries in a table by a certain field value, but as objects.
	 *
	 * @param string $field
	 * @param mixed $value
	 * @return array An array containing each entry on success.
	 * @throws PDOException If the query of getByField fails.
	 */
	public function getByFieldAsObjects(string $field, mixed $value): array
	{
		return array_map(fn($e) => $e->toObj(), $this->getByField($field, $value));
	}

	/**
	 * Gets all entries in a table by multiple field values.
	 *
	 * @param array $fields
	 * @return array|null An array containing each entry on success,
	 *                    `null` otherwise.
	 * @throws PDOException If the query fails.
	 */
	public function getByFields(array $fields): array|null
	{
		$mapFn = fn($field) => $field . " = :" . $field;
		$sql = $this->baseFetchSql() . " AND " . implode(" AND ", array_map($mapFn, array_keys($fields)));
		$stmt = getDbh(self::$callback, self::$callbackError)->prepare($sql);

		try {
			$stmt->execute($fields);
			$result = $stmt->fetchAll();
		} catch (PDOException $e) {
			throw new PDOException("Error getting data: " . $e->getMessage());
		}

		if ($result === false) {
			return null;
		}

		return array_map(fn($row) => $this->class::fromObj($row), $result);
	}

	/**
	 * Gets all entries in a table by multiple field values, but as objects.
	 *
	 * @param array $fields
	 * @return array An array containing each entry on success.
	 * @throws PDOException If the query of getByFields fails.
	 */
	public function getByFieldsAsObjects(array $fields): array
	{
		return array_map(fn($e) => $e->toObj(), $this->getByFields($fields));
	}

	/**
	 * Serializes fields of a model in case they are objects or arrays.
	 * This allows them to be stored in the database.
	 *
	 * @param array &$keyVal The associative array containing keys and their values.
	 * @throws Exception Thrown when a JSON value can't be encoded.
	 */
	private static function serializeFields(array &$keyVal): void
	{
		foreach ($keyVal as $key => $val) {
			if (is_object($val) || is_array($val)) {
				$encoded = json_encode($val);
				if (json_last_error() !== JSON_ERROR_NONE) {
					throw new Exception("Error encoding value for key " . $key);
				}
				$keyVal[$key] = $encoded;
			}
		}
	}
}