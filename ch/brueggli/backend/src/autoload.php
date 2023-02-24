<?php
/**
 * Registers a function that loads classes from file paths.
 * This function uses the class name to determine the file path where the class is defined,
 * and requires that file. It replaces all underscores in the class name with namespace separators.
 * @param callable $autoloadFunction The function to be registered as the __autoload function.
 * @return void
 */
spl_autoload_register(
	function($className)
	{
		$className = str_replace("_", "\\", $className);
		$className = ltrim($className, '\\');
		$fileName = '';
		$namespace = '';
		if ($lastNsPos = strripos($className, '\\'))
		{
			$namespace = substr($className, 0, $lastNsPos);
			$className = substr($className, $lastNsPos + 1);
			$fileName = str_replace('\\', DIRECTORY_SEPARATOR, $namespace) . DIRECTORY_SEPARATOR;
		}
		$fileName .= str_replace('_', DIRECTORY_SEPARATOR, $className) . '.php';

		require $fileName;
	}
);