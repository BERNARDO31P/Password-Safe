<?php

namespace model;

use JsonSerializable;

use lib\DataRepo\trait\model;
use lib\DataRepo\feature\db_column;
use lib\DataRepo\feature\db_foreign_key;

class Password implements JsonSerializable
{
	use model;

	public const TABLE_NAME = "passwords";
	public const PRIMARY_KEY = "pass_id";

	#[db_column]
	public ?int $secret_id = null;
	#[db_column]
	public string $name = "";
	#[db_column]
	public string $description = "";
	#[db_column]
	public string $url = "";
	#[db_column]
	public string $data = "";

	#[db_column, db_foreign_key(Organization::class)]
	public int $org_id = 0;
}