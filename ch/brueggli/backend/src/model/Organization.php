<?php

namespace model;

use JsonSerializable;

use lib\DataRepo\trait\model;
use lib\DataRepo\feature\db_column;

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