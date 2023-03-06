<?php

namespace model;

use JsonSerializable;

use lib\DataRepo\feature\db_column;
use lib\DataRepo\feature\db_foreign_key;
use lib\DataRepo\trait\model;

class Member implements JsonSerializable
{
	use model;

	public const TABLE_NAME = "members";
	public const PRIMARY_KEY = "entry_id";

	#[db_column]
	public ?int $entry_id = null;

	#[db_column, db_foreign_key(User::class)]
	public int $user_id = 0;
	#[db_column, db_foreign_key(Organization::class)]
	public int $org_id = 0;
}