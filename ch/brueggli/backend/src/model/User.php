<?php

declare(strict_types=1);

namespace model;

use lib\DataRepo\feature\db_column;
use lib\DataRepo\trait\model;

use JsonSerializable;

class User implements JsonSerializable
{
	use model;

	public const TABLE_NAME = "users";
	public const PRIMARY_KEY = "user_id";

	#[db_column]
	public ?int $user_id = null;
	#[db_column]
	public string $email = "";
	#[db_column]
	public string $password = "";
	#[db_column]
	public string $first_name = "";
	#[db_column]
	public string $last_name = "";
	#[db_column]
	public int $is_admin = 0;
	#[db_column]
	public int $is_suspended = 0;
	#[db_column]
	public ?int $last_login = null;
	#[db_column]
	public string $public_key = "";
	#[db_column]
	public string $private_key = "";
	#[db_column]
	public string $salt = "";
}