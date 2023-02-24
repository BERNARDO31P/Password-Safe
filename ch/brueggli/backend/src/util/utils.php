<?php declare(strict_types=1);

namespace util;

use ReflectionClass;
use ReflectionException;

/**
 * Entfernt alle Schlüssel in dem angegebenen Array, die nicht in der Liste der erlaubten Schlüssel enthalten sind.
 * Sollten die Werte im Array Objekte sein, werden diese wieder zurückgewandelt.
 *
 * @param array|object $modify Das Array oder Objekt, dessen Schlüssel entfernt werden sollen.
 * @param array $keys Ein Array von Schlüsseln, die beibehalten werden sollen.
 * @return array|object Das Array oder Objekt mit nur den erlaubten Schlüsseln.
 * @throws ReflectionException Wird ausgelöst, wenn der Konstruktor der Klasse nicht ohne Parameter aufgerufen werden kann.
 */
function removeArrayKeys(array|object $modify, array $keys): array|object
{
	$object = false;
	$class = null;
	if (is_object($modify)) {
		$object = true;
		$class = $modify::class;

		$modify = $modify->toArray();
	}

	if (!array_is_list($modify)) {
		foreach (array_keys($modify) as $key) {
			if (in_array($key, $keys)) unset($modify[$key]);
		}
	} else {
		foreach ($modify as $key => $value) {
			$modify[$key] = removeArrayKeys(!is_object($value) ? $value : $value->toArray(), $keys);
		}
	}

	if ($object && $class) {
		$reflectionClass = new ReflectionClass($class);
		$instance = $reflectionClass->newInstanceWithoutConstructor();
		return $instance::fromObj($modify);
	}

	return $modify;
}

/**
 * Gibt ein Array oder Objekt zurück, das nur die angegebenen Schlüssel enthält.
 * Sollten die Werte im Array Objekte sein, werden diese wieder zurückgewandelt.
 *
 * @param array|object|null $modify Das Array oder Objekt, dessen Schlüssel zurückgegeben werden sollen.
 * @param array $keys Ein Array von Schlüsseln, die zurückgegeben werden sollen.
 * @return array|object|null Das Array oder Objekt mit nur den angegebenen Schlüsseln, ansonsten null.
 * @throws ReflectionException Wird ausgelöst, wenn der Konstruktor der Klasse nicht ohne Parameter aufgerufen werden kann.
 */
function getArrayKeys(array|object|null $modify, array $keys): array|object|null
{
	if ($modify === null) return null;

	$object = false;
	$class = null;
	if (is_object($modify)) {
		$object = true;
		$class = $modify::class;

		$modify = $modify->toArray();
	}

	if (!array_is_list($modify)) {
		foreach (array_keys($modify) as $key) {
			if (!in_array($key, $keys)) {
				unset($modify[$key]);
			}
		}
	} else {
		foreach ($modify as $key => $value) {
			$modify[$key] = getArrayKeys(!is_object($value) ? $value : $value->toArray(), $keys);
		}
	}

	if ($object && $class) {
		$reflectionClass = new ReflectionClass($class);
		$instance = $reflectionClass->newInstanceWithoutConstructor();
		return $instance::fromObj($modify);
	}

	return $modify;
}

/**
 * Entfernt alle Vorkommen des angegebenen Werts aus dem Array.
 *
 * @param array $array Das Array, aus dem der Wert entfernt werden soll.
 * @param mixed $value Der Wert, der entfernt werden soll.
 * @return array Das Array ohne den entfernten Wert.
 */
function arrayRemove(array $array, mixed $value): array
{
	return array_values(array_filter($array, fn($entry) => $entry !== $value));
}

/**
 * Wendet eine Callback-Funktion auf die Schlüssel eines assoziativen Arrays an.
 *
 * @param array $array Das assoziative Array, dessen Schlüssel bearbeitet werden sollen
 * @param callable $callback Die Callback-Funktion, die auf jeden Schlüssel angewendet werden soll
 * @return void
 */
function array_walk_keys(array &$array, callable $callback): void
{
	foreach ($array as $key => $value) {
		$new_key = $callback($key);
		if ($new_key !== $key) {
			unset($array[$key]);
			$array[$new_key] = $value;
		}
	}
}

/**
 * Ersetzt Platzhalter in der Nachricht durch den tatsächlichen Wert.
 *
 * @param string $message Die Nachricht, in der Platzhalter ersetzt werden sollen
 * @param array|null $context Ein assoziatives Array mit Schlüssel-Wert-Paaren, die als Platzhalter in der Nachricht dienen sollen
 * @return string Die neue Nachricht mit ersetzen Platzhaltern
 */
function replace(string $message, array|null $context = []): string
{
	if (!empty($context)) {
		array_walk_keys($context, function ($key) {
			return "{" . $key . "}";
		});
		$message = strtr($message, $context);
	}

	return $message;
}