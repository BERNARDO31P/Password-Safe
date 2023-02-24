<?php declare(strict_types = 1);

namespace lib\DataRepo\feature;

use Attribute;

/**
 * The db_foreign_key attribute is used to specify the foreign key name in the database for a given property in a model class.
 * This attribute is applied to the target property of a class using the #[Attribute(Attribute::TARGET_PROPERTY)] syntax.
 * When instantiating an object of the model, the db_foreign_key attribute is used to map the property name to its corresponding
 * foreign key name in the database. This is particularly useful when the property name differs from the foreign key name in the database.
 * @property string $foreign_key The name of the column in the database that corresponds to the target property.
 */

#[Attribute(Attribute::TARGET_PROPERTY)]
final class db_foreign_key {
	public string $foreign_key = "";

	public function __construct(string $foreign_key = ""){
		$this->foreign_key = $foreign_key;
	}
}
