<?php
declare(strict_types=1);

namespace App\FrontModule\Presenters;


class HomepagePresenter extends BasePresenter
{
	public function renderDefault(): void
	{
		$this->template->anyVariable = 'any value';
	}


	public function handleFlashesTest(): void
	{
		$this->flashMessage('This is an information message.');
		$this->flashMessage('Success.', 'success');
		$this->flashMessage('Warning, problems may occur.', 'warning');
		$this->flashMessage('An error has occurred!', 'error');
		$this->flashMessage('Custom message type.', 'x');

		$this->postGet('this');
		$this->sendPayload(); // or $this->redrawControl('...');
	}
}
