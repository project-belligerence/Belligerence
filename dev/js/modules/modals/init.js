(function() {
	'use strict';

	var moduleName = 'Modals';

	angular.module((moduleName + 'Module'), [])
		.controller(('ModalGenericYesNo' + 'Controller'), require("./controller").ModalGenericYesNo)
		.controller(('ModalSendMessage' + 'Controller'), require("./controller").ModalSendMessage)
		.controller(('ModalSendReport' + 'Controller'), require("./controller").ModalSendReport)
	;
})();