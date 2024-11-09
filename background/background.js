import * as GetTabs from './get.js'; // Tab getters (menu commands)
import selectTabs from './select.js'; // Selects tabs returned by getter
import * as Menu from './menu.js';

/** @typedef {import('../common.js').Tab} Tab */
/** @typedef {import('../common.js').CommandId} CommandId */

Menu.populate();
browser.menus.onClicked.addListener(onMenuClicked);
browser.commands.onCommand.addListener(onKeyboardShortcut);

/**
 * @param {Object} info
 * @param {CommandId} info.menuItemId
 * @param {string[]} info.modifiers
 * @listens browser.menus.onClicked
 * @param {Tab} targetTab
 */
function onMenuClicked({ menuItemId, modifiers }, targetTab) {
    selectTabs(GetTabs[menuItemId], targetTab, modifiers.includes('Shift'));
}

/**
 * @listens browser.commands.onCommand
 * @param {CommandId} commandId
 */
async function onKeyboardShortcut(commandId) {
    selectTabs(GetTabs[commandId], (await GetTabs.focused())[0]);
}
