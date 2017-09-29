<?php
declare(strict_types=1);

namespace App\Router;

use Kdyby\Translation\Translator;
use Nette;
use Nette\Application\Routers\Route;
use Nette\Application\Routers\RouteList;


class RouterFactory
{
	use Nette\StaticClass;

	public static function createRouter(Translator $translator): RouteList
	{
		$routes = new RouteList();

		// Front module
		$routes[] = new Route('[<locale>/]<presenter>/<action>',
			[
				'module' => 'Front',
				'presenter' => 'Homepage',
				'action' => 'default',
				'locale' => [
					// default locale, eg. "cs"
					Route::VALUE => $translator->getDefaultLocale(),
					// pattern from on available locales, eg. "cs|sk|en"
					Route::PATTERN => implode('|', $translator->getAvailableLocales()),
				],
			]
		);

		return $routes;
	}
}
