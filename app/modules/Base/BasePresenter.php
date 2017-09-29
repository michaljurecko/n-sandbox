<?php
declare(strict_types=1);

namespace App\BaseModule\Presenters;

use Carrooi\Menu\UI\IMenuComponentFactory;
use Kdyby\Translation\Translator;
use Nette;
use Nette\Bridges\ApplicationLatte\Template;
use Nittro\Bridges\NittroUI\PresenterUtils;
use Tracy\Debugger;


/**
 * Base presenter for all application presenters.
 */
abstract class BasePresenter extends Nette\Application\UI\Presenter
{
	use PresenterUtils;

	/** string @persistent */
	public $locale;

	/** @var IMenuComponentFactory @inject */
	public $menuFactory;

	/** @var Translator @inject */
	public $translator;


	protected function startup(): void
	{
		parent::startup();

		// Set default snippet
		$this->setDefaultSnippets(['navigation', 'content']);
		// Only redraw default snippets if nobody is receiving a signal
		$this->setRedrawDefault($this->getSignal() === null);
	}


	protected function beforeRender(): void
	{
		parent::beforeRender();

		/** @var Template $template */
		$template = $this->getTemplate();
		$template->add('debugMode', Debugger::isEnabled());
		$template->add('locale', $this->translator->getLocale());
		$template->add('availableLocales', $this->translator->getAvailableLocales());
	}


	protected function afterRender()
	{
		parent::afterRender();

		if ($this->isAjax()) {
			// Redraw default snippets if enabled
			$this->redrawDefault();
		} else {
			$this->template->flashSession = $this->exportFlashSession();
		}
	}


	public function sendPayload()
	{
		// Send flash messages in payload
		$this->payload->flashes = $this->exportFlashSession();

		parent::sendPayload();
	}
}
