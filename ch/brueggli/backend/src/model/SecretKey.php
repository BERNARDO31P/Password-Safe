<?php

namespace model;

use JsonSerializable;

use lib\DataRepo\trait\model;
use lib\DataRepo\feature\db_column;
use lib\DataRepo\feature\db_foreign_key;

class SecretKey implements JsonSerializable
{
	use model;

	public const TABLE_NAME = "secret_keys";
	public const PRIMARY_KEY = "secret_id";

	#[db_column]
	public ?int $secret_id = null;
	#[db_column]
	public string $data = "";

	public string $sign = "";

	#[db_column, db_foreign_key(User::class)]
	public int $user_id = 0;
	#[db_column, db_foreign_key(Organization::class)]
	public int $org_id = 0;
}