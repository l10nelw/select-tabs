import * as Getters from './get.js'; // Tab getters (menu commands)
import selectTabs from './select.js'; // Selects tabs returned by getter
import * as Menu from './menu.js';

/** @typedef {import('../common.js').Tab} Tab */
/** @typedef {import('../common.js').CommandId} CommandId */

Menu.populate();
browser.menus.onClicked.addListener(onMenuClicked);
browser.commands.onCommand.addListener(onKeyboardShortcut);
browser.browserAction.onClicked.addListener(onButtonClicked);

/**
 * @listens browser.menus.onClicked
 * @param {object} menuClickInfo
 * @param {Tab} targetTab
 */
function onMenuClicked(menuClickInfo, targetTab) {
    selectTabs(Getters[menuClickInfo.menuItemId], targetTab, menuClickInfo);
}

/**
 * @listens browser.commands.onCommand
 * @param {CommandId} commandId
 */
async function onKeyboardShortcut(commandId) {
    selectTabs(Getters[commandId], (await Getters.focused())[0]);
}

/**
 * @listens browser.browserAction.onClicked
 */
async function onButtonClicked() {
    browser.runtime.openOptionsPage();
}
