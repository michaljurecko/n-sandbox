<?php
declare(strict_types=1);

namespace App\FrontModule\Presenters;

use Carrooi\Menu\UI\MenuComponent;


/**
 * Base presenter for front module.
 */
abstract class BasePresenter extends \App\BaseModule\Presenters\BasePresenter
{
	protected function createComponentFrontMenu(): MenuComponent
	{
		return $this->menuFactory->create('front');
	}
}
