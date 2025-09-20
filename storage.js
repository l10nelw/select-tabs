import COMMAND_DICT from '../commands.js';

/** @import { StoredData, CommandId, CommandDict } from './common.js' */

/**
 * Retrieve stored user-editable data. Command data is processed to be throughly complete, pulling from commands.js and manifest.json.
 * @returns {Promise<{ commands: CommandDict }>}
 */
export async function load() {
    /** @type {[StoredData, { value: boolean }]} */
    const [storedData, { value: isVertical }] = await Promise.all([
        browser.storage.sync.get(),
        browser.browserSettings.verticalTabs.get({}),
    ]);

    /** @type {CommandDict} */
    const commands = {};
    for (const commandId in COMMAND_DICT)
        commands[commandId] = { ...COMMAND_DICT[commandId], ...storedData.commands?.[commandId] };

    /** @type {object.<CommandId, { description: string }>} */
    const MANIFEST_DICT = browser.runtime.getManifest().commands;

    // For shortcut-able commands, parse description for category and title
    for (const name in MANIFEST_DICT) {
        const commandInfo = commands[name];
        const [category, title] = MANIFEST_DICT[name].description.split(': ');
        commandInfo.category = category;

        // Parse title for any alternate title (for vertical tabs)
        const [defaultTitle, altTitle] = title.split(' | ');
        commandInfo.title = (isVertical && altTitle) ? altTitle : defaultTitle;

        // Update all descriptions (not just ones with alternate titles) to ensure any changes made for a new release will take hold
        browser.commands.update({ name, description: `${commandInfo.category}: ${commandInfo.title}` });
    }

    return { commands };
}

/**
 * Store used-editable data.
 * @param {StoredData} data
 * @return {Promise}
 */
export function save(data) {
    // Save only user-editable properties: `accessKey`, `showInTabMenu` (for tab context commands)
    for (const commandId in data.commands) {
        const minCommandInfo = {};
        minCommandInfo.accessKey = data.commands[commandId].accessKey;
        if (COMMAND_DICT[commandId].contexts.includes('tab'))
            minCommandInfo.showInTabMenu = data.commands[commandId].showInTabMenu;
        data.commands[commandId] = minCommandInfo;
    }
    return browser.storage.sync.set(data);
}
