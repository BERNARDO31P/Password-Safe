<?php declare(strict_types=1);

namespace lib\DataRepo\feature;

use Attribute;

/**
 * The db_column attribute is used to specify the column name in the database for a given property in a model class.
 * This attribute is applied to the target property of a class using the #[Attribute(Attribute::TARGET_PROPERTY)] syntax.
 * When instantiating an object of the model, the db_column attribute is used to map the property name to its corresponding
 * column name in the database. This is particularly useful when the property name differs from the column name in the database.
 * @property string $column_name The name of the column in the database that corresponds to the target property.
 */
#[Attribute(Attribute::TARGET_PROPERTY)]
final class db_column
{
	public string $column_name = "";

	public function __construct(string $column_name = "")
	{
		$this->column_name = $column_name;
	}
}
