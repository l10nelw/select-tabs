import { SETTINGS } from '../common.js';
import COMMAND_DICT from '../commands.js';
import * as Menu from './menu.js';
import * as Badge from './badge.js';
import selectTabs from './select.js';

/** @import { CommandDict, CommandId, MenuClickInfo, LoadedData, StoredData, Tab } from '../common.js' */

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
 * Retrieve stored user-editable data from sync-storage.
 * Command data is populated and hydrated from these sources: StoredData, commands.js (COMMAND_DICT), manifest.json (MANIFEST_DICT)
 * @returns {Promise<LoadedData>}
 */
export async function loadData() {
    /** @type {object.<CommandId, { description: string }>} */
    const MANIFEST_DICT = browser.runtime.getManifest().commands; // Shortcut-able commands

    /** @type {[StoredData, { value: boolean }]} */
    const [storedData, { value: isVertical }] = await Promise.all([
        browser.storage.sync.get(),
        browser.browserSettings.verticalTabs.get({}),
    ]);

    const commands = /** @type {CommandDict} */ ({});
    const settings = { ...SETTINGS, ...storedData.settings };

    for (const commandId in COMMAND_DICT) {
        commands[commandId] = { ...COMMAND_DICT[commandId], ...storedData.commands?.[commandId] };

        if (!(commandId in MANIFEST_DICT))
            continue; // This command doesn't get category and title from manifest.json

        /** @type {[string, string]} */
        let [category, title] = MANIFEST_DICT[commandId].description.split(': ');

        // Get alternate title for vertical tabs
        const [defaultTitle, altTitle] = title.split(' | ');
        title = (isVertical && altTitle) ? altTitle : defaultTitle;

        // Update every shortcut description to ensure any changes in a new release - or in tab orientation - takes hold
        browser.commands.update({ name: commandId, description: `${category}: ${title}` });

        Object.assign(commands[commandId], { category, title });
    }

    return { commands, settings };
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
