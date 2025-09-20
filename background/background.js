import { active } from './get.js';
import selectTabs from './select.js';
import * as Menu from './menu.js';

/** @import { CommandId, Tab } from './common.js' */

Menu.populate();
browser.menus.onClicked.addListener(onMenuClicked);
browser.commands.onCommand.addListener(onKeyboardShortcut);
browser.browserAction.onClicked.addListener(onButtonClicked);
browser.browserSettings.verticalTabs.onChange.addListener(onVerticalTabsToggled);

/**
 * @listens browser.menus.onClicked
 * @param {object} menuClickInfo
 * @param {CommandId} menuClickInfo.menuItemId
 * @param {string[]} menuClickInfo.modifiers
 * @param {Tab} targetTab
 */
function onMenuClicked(menuClickInfo, targetTab) {
    selectTabs(menuClickInfo.menuItemId, targetTab, menuClickInfo);
}

/**
 * @listens browser.commands.onCommand
 * @param {CommandId} commandId
 */
async function onKeyboardShortcut(commandId) {
    const activeTab = (await active())[0];
    selectTabs(commandId, activeTab);
}

/**
 * @listens browser.browserAction.onClicked
 */
async function onButtonClicked() {
    browser.runtime.openOptionsPage();
}

/**
 * @listens browser.browserSettings.verticalTabs.onChange
 */
function onVerticalTabsToggled() {
    browser.runtime.reload();
}
