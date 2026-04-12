import * as Storage from './storage.js';
import * as Menu from './menu.js';
import selectTabs from './select.js';

/** @import { CommandId, MenuClickInfo, StoredData, Tab } from '../common.js' */

browser.runtime.onInstalled.addListener(onAppInstalled);
browser.menus.onClicked.addListener(onMenuClicked);
browser.commands.onCommand.addListener(onKeyboardShortcut);
browser.runtime.onMessage.addListener(onMessage);
browser.browserSettings.verticalTabs.onChange.addListener(onVerticalTabsToggled);

/**
 * @listens browser.runtime.onInstalled
 */
async function onAppInstalled() {
    const { commands } = await Storage.load();
    browser.storage.session.set({ commands }); // For popup to access
    Menu.populate(commands);
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
 * @param {Tab} activeTab
 */
async function onKeyboardShortcut(commandId, activeTab) {
    selectTabs(commandId, activeTab);
}

/**
 * @listens browser.runtime.onMessage
 * @param {object} message
 * @param {string} message.type
 * @param {string} [message.commandId]
 * @param {StoredData} [message.data]
 */
function onMessage(message) {
    switch (message.type) {
        case 'selectTabs': return selectTabs(message.commandId);
        case 'loadOptions': return Storage.load();
        case 'saveOptions': return Storage.save(message.data);
    }
}

/**
 * @listens browser.browserSettings.verticalTabs.onChange
 */
function onVerticalTabsToggled() {
    browser.runtime.reload();
}
