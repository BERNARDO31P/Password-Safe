<?php declare(strict_types=1);

namespace model;

use lib\DataRepo\trait\model;
use lib\DataRepo\feature\db_column;

use JsonSerializable;

class Organization implements JsonSerializable
{
	use model;

	public const TABLE_NAME = "organizations";
	public const PRIMARY_KEY = "org_id";

	#[db_column]
	public ?int $org_id = null;
	#[db_column]
	public string $name = "";
	#[db_column]
	public ?string $description = "";
}