import COMMAND_DICT from '../commands.js';

/** @typedef {import('./common.js').StoredData} StoredData */
/** @typedef {import('./common.js').CommandId} CommandId */
/** @typedef {import('./common.js').CommandInfo} CommandInfo */
/** @typedef {import('./common.js').CommandDict} CommandDict */


/**
 * Retrieve stored user-editable data. Command data is processed to be throughly complete, pulling from commands.js and manifest.json.
 * @returns {Promise<{ commands: CommandDict, general: object.<string, any> }>}
 */
export async function load() {
    /** @type {StoredData} */ const storedData = await browser.storage.sync.get();
    /** @type {object.<string, any>} */ const general = storedData.general ?? {};
    /** @type {CommandDict} */ const commands = {};

    for (const commandId in COMMAND_DICT)
        commands[commandId] = { ...COMMAND_DICT[commandId], ...storedData.commands?.[commandId] };

    // Handle older v4.0.x storage format and convert to new format
    if ('accessKeys' in storedData) {
        /** @type {{ accessKeys: object.<CommandId, string>, shownTabMenuItems: CommandId[] }} */
        const { accessKeys, shownTabMenuItems } = storedData;

        for (const commandId in accessKeys)
            commands[commandId].accessKey = accessKeys[commandId];
        for (const commandId of shownTabMenuItems)
            commands[commandId].showInTabMenu = true;

        await browser.storage.sync.clear();
        save({ commands, general });
    }

    /** @type {object.<CommandId, { description: string }>} */
    const MANIFEST_DICT = browser.runtime.getManifest().commands;

    /** @type {{ vertical: boolean }} */
    const { vertical } = general;

    for (const [commandId, commandInfo] of Object.entries(commands)) {
        // If shortcut-able command, parse description for category and title
        if (commandId in MANIFEST_DICT) {
            const [category, title] = MANIFEST_DICT[commandId].description.split(': ');
            commandInfo.category = category;
            commandInfo.title = title;
        }

        // Parse title for any alternate title
        const [title, altTitle] = commandInfo.title.split(' | ');
        if (altTitle) {
            commandInfo.title = vertical ? altTitle : title;
            browser.commands.update({ name: commandId, description: `${commandInfo.category}: ${commandInfo.title}` });
        }
    }

    return { commands, general };
}

/**
 * Store used-editable data.
 * @param {StoredData} data
 * @return {Promise<>}
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
