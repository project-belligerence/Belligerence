(function() {
	'use strict';

	var moduleName = 'Modals';

	angular.module((moduleName + 'Module'), [])
		.controller(('ModalGenericYesNo' + 'Controller'), require("./controller").ModalGenericYesNo)
		.controller(('ModalDisplayItem' + 'Controller'), require("./controller").ModalDisplayItem)
		.controller(('ModalSendMessage' + 'Controller'), require("./controller").ModalSendMessage)
		.controller(('ModalSendReport' + 'Controller'), require("./controller").ModalSendReport)
		.controller(('ModalSendInvite' + 'Controller'), require("./controller").ModalSendInvite)
		.controller(('ModalConfirmPassword' + 'Controller'), require("./controller").ModalConfirmPassword)
		.controller(('ModalBanPlayer' + 'Controller'), require("./controller").ModalBanPlayer)
		.controller(('ModalManageImages' + 'Controller'), require("./controller").ModalManageImages)
		.controller(('ModalSignContract' + 'Controller'), require("./controller").ModalSignContract)
		.controller(('ModalRedeemCode' + 'Controller'), require("./controller").ModalRedeemCode)
	;
})();