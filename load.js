import { SETTINGS } from './common.js';
import COMMAND_DICT from './commands.js';

/** @import { CommandDict, CommandId, LoadedData, StoredData } from './common.js' */

/**
 * Return user-editable data from (non-persistent) session-storage.
 * If datav not present, retrieve from (persistent) sync-storage to remedy.
 * @returns {Promise<LoadedData>}
 */
export default async function loadData() {
    /** @type {{} | LoadedData} */
    const loadedData = await browser.storage.session.get();
    if (loadedData.commands)
        return loadedData;

    Object.assign(loadedData, await retrieveAndConsolidateData());
    await browser.storage.session.set(loadedData);
    return loadedData;
}

/**
 * Command data from: StoredData, commands.js (COMMAND_DICT), manifest.json (MANIFEST_DICT).
 * Settings data from: StoredData, common.js (SETTINGS).
 * @returns {Promise<LoadedData>}
 */
async function retrieveAndConsolidateData() {
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
