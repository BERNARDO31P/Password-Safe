<?php declare(strict_types=1);

namespace lib\DataRepo\trait;

use lib\DataRepo\feature\db_column;
use lib\DataRepo\feature\db_foreign_key;
use lib\DataRepo\DataRepo;

use ReflectionClass;
use TypeError;

trait model
{
	/**
	 * A method which returns the model as a JSON-serializable array.
	 * @return array The resulting array.
	 */
	public function jsonSerialize(): array
	{
		return $this->toArray();
	}

	/**
	 * Returns the model's database ID.
	 *
	 * @return int|null The ID on success, `null` otherwise.
	 */
	public function id(): ?int
	{
		return $this->{self::class::PRIMARY_KEY};
	}

	/**
	 * Constructs a model instance from an array of objects.
	 *
	 * @param array $obj The array of objects supplying properties.
	 * @return self Returns itself to allow for chaining.
	 */
	public static function fromObj(array $obj): self
	{
		$class = get_class();
		$model = new $class();

		foreach ($obj as $key => $value) {
			if (property_exists($model, $key)) {
				try {
					if (gettype($value) === "string" && !intval($value)) {
						$json = json_decode($value, true);

						if (is_array($json)) {
							$model->$key = $json;
						} else {
							$model->$key = $value;
						}
					} elseif (gettype($model->$key) === "integer" && gettype($value) === "boolean") {
						$model->$key = intval($value);
					} else {
						$model->$key = $value;
					}
				} catch (TypeError) {
				}
			}
		}

		return $model;
	}

	/**
	 * Sets the model's database ID to a value.
	 *
	 * @param int $id The desired ID to be changed to.
	 */
	public function setId(int $id): void
	{
		$this->{self::class::PRIMARY_KEY} = $id;
	}

	/** Clears the model's database ID, setting it to zero. */
	public function clearId(): void
	{
		$this->{self::class::PRIMARY_KEY} = 0;
	}

	/**
	 * Collects all database fields as an array.
	 * Fields are returned if they're marked as a `db_column`.
	 *
	 * @return array The array of database fields.
	 */
	public static function getDbFields(): array
	{
		$fields = [];

		$reflection = new ReflectionClass(static::class);
		foreach ($reflection->getProperties() as $property) {
			$attributes = $property->getAttributes(db_column::class);
			if (count($attributes)) {
				$fields[] = $property->getName();
			}
		}
		return $fields;
	}

	/**
	 * Collects the foreign key field which is connected to a specific model.
	 * Field is returned if it's marked as a `db_foreign_key` and when it matches the defined second model.
	 *
	 * @param string $model The model name which should be found
	 * @return string | null The name of the foreign key
	 */
	public static function getForeignKey(string $model): string|null
	{
		$foreignKey = null;
		$reflection = new ReflectionClass(static::class);
		foreach ($reflection->getProperties() as $property) {
			$attributes = $property->getAttributes(db_foreign_key::class);
			if (!count($attributes)) continue;

			foreach ($attributes as $attribute) {
				$arguments = $attribute->getArguments();
				if (!count($arguments)) continue;

				if ($arguments[0] === $model) {
					$foreignKey = $property->getName();
					break;
				}
			}
		}
		return $foreignKey;
	}

	/**
	 * Joins two models at the defined foreign key.
	 * A model is joined if it's marked as a `db_foreign_key` and when it matches the defined second model.
	 *
	 * @param string $model The model name which should be joined
	 * @return object The joined model
	 */
	public function join(string $model): object
	{
		$foreignKey = static::getForeignKey($model);

		if ($foreignKey)
			$this->{$foreignKey} = DataRepo::of($model)->getByIds($this->{$foreignKey});

		return $this;
	}

	/**
	 * Returns the model as an associative array.
	 *
	 * @return array The resulting array.
	 */
	public function toArray(): array
	{
		$keyVal = [];
		foreach (static::getDbFields() as $field) {
			$keyVal[$field] = $this->{$field};
		}

		return $keyVal;
	}

	/**
	 * Returns the model as an object mapping.
	 *
	 * @return object The resulting object.
	 */
	public function toObj(): object
	{
		return (object)$this->toArray();
	}
}
