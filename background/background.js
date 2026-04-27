import loadData from '../load.js';
import * as Menu from './menu.js';
import * as Badge from './badge.js';
import selectTabs from './select.js';

/** @import { CommandId, MenuClickInfo, Tab } from '../common.js' */

browser.runtime.onInstalled.addListener(onAppInstalled);
browser.menus.onClicked.addListener(onMenuClicked);
browser.commands.onCommand.addListener(onKeyboardShortcut);
browser.runtime.onMessage.addListener(onMessage);
browser.tabs.onHighlighted.addListener(onTabsSelected);
browser.browserSettings.verticalTabs.onChange.addListener(onVerticalTabsToggled);

/**
 * @listens browser.runtime.onInstalled
 */
async function onAppInstalled() {
    const loadedData = await loadData();
    browser.storage.session.set(loadedData); // For popup and options to access
    Menu.populate(loadedData.commands);
}

/**
 * @listens browser.menus.onClicked
 * @param {MenuClickInfo} menuClickInfo
 * @param {Tab} targetTab
 */
function onMenuClicked(menuClickInfo, targetTab) {
    execute(menuClickInfo.menuItemId, targetTab, menuClickInfo);
}

/**
 * @listens browser.commands.onCommand
 * @param {CommandId} commandId
 * @param {Tab} activeTab
 */
async function onKeyboardShortcut(commandId, activeTab) {
    execute(commandId, activeTab);
}

/**
 * @listens browser.runtime.onMessage
 * @param {object} message
 * @param {string} message.type
 * @param {string} [message.commandId]
 */
async function onMessage(message) {
    if (message.type === 'selectTabs')
        execute(message.commandId);
}

/**
 * @listens browser.tabs.onHighlighted
 */
function onTabsSelected() {
    Badge.clear();
}

/**
 * @listens browser.browserSettings.verticalTabs.onChange
 */
function onVerticalTabsToggled() {
    browser.runtime.reload();
}

/**
 * @type {typeof selectTabs}
 */
async function execute(/* Same arguments as selectTabs() */) {
    Badge.clear();
    const selectedTabs = await selectTabs(...arguments);
    Badge.update(selectedTabs);
    return selectedTabs;
}
