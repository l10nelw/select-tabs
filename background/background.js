import { active } from './get.js';
import selectTabs from './select.js';
import * as Menu from './menu.js';

/** @import { CommandId, MenuClickInfo, Tab } from './common.js' */

browser.runtime.onInstalled.addListener(onAppInstalled);
browser.menus.onClicked.addListener(onMenuClicked);
browser.commands.onCommand.addListener(onKeyboardShortcut);
browser.action.onClicked.addListener(onButtonClicked);
browser.browserSettings.verticalTabs.onChange.addListener(onVerticalTabsToggled);

/**
 * @listens browser.runtime.onInstalled
 */
function onAppInstalled() {
    Menu.populate();
}

/**
 * @listens browser.menus.onClicked
 * @param {MenuClickInfo} menuClickInfo
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
 * @listens browser.action.onClicked
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
