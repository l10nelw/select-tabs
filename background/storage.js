import COMMAND_DICT from '../commands.js';

/** @import { StoredData, CommandId, CommandDict } from '../common.js' */

/**
 * Retrieve stored user-editable data.
 * Command data is populated to be complete and thorough, synthesising from stored data, commands.js (COMMAND_DICT) and manifest.json (MANIFEST_DICT) as sources.
 * @returns {Promise<{ commands: CommandDict }>}
 */
export async function load() {
    /** @type {[StoredData, { value: boolean }]} */
    const [storedData, { value: isVertical }] = await Promise.all([
        browser.storage.sync.get(),
        browser.browserSettings.verticalTabs.get({}),
    ]);

    /**
     * Shortcut-able commands.
     * @type {object.<CommandId, { description: string }>}
     */
    const MANIFEST_DICT = browser.runtime.getManifest().commands;

    /** @type {CommandDict} */
    const commands = {};

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

    return { commands };
}

/**
 * Store user-defined data.
 * @param {StoredData} data
 * @return {Promise<void>}
 */
export function save(data) {
    // Save only user-editable properties: `accessKey`, `showInTabMenu` (for tab context commands)
    for (const commandId in data.commands) {
        const minimalCommandInfo = {};
        minimalCommandInfo.accessKey = data.commands[commandId].accessKey;
        if (COMMAND_DICT[commandId].contexts.includes('tab'))
            minimalCommandInfo.showInTabMenu = data.commands[commandId].showInTabMenu;
        data.commands[commandId] = minimalCommandInfo;
    }
    return browser.storage.sync.set(data);
}
