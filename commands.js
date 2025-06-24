/*
To add a command:
- manifest.json
    - If command is shortcut-able, add entry in "commands" object. `description` format is "<category>: <title>".
        - If command has alternate title for vertical tabs, `description` format is "<category>: <title> | <alt title>".
- commands.js (this file)
    - Mandatory: Add command's base properties as entry in BASE_DICT. If command has no manifest.json entry, include `category` and `title` properties.
        - If command has alternate title for vertical tabs, `title` format is "<title> | <alt title>".
    - Add command's default user-definable properties as entries in DEFAULT_ACCESSKEYS and DEFAULT_SHOWN_TAB_MENUITEMS dicts.
- get.js
    - Mandatory: Add command implementation.
- select.js
    - Add command's `includePinned` condition if required.
*/

/** @typedef {import('./common.js').StoredData} StoredData */
/** @typedef {import('./common.js').CommandId} CommandId */
/** @typedef {import('./common.js').CommandInfo} CommandInfo */
/** @typedef {import('./common.js').CommandDict} CommandDict */

/** @type {string} */ const APP_NAME = browser.runtime.getManifest().name;
/** @type {string} */ const parentId = 'menuRoot';

/**
 * Base dict of commands. Each entry requires a `context` property at minimum. See CommandInfo definition.
 * @type {CommandDict}
 */
const BASE_DICT = {
    [parentId]: { contexts: ['tab', 'link'], title: APP_NAME },
    // Text search
    matchLinkText: { parentId, contexts: ['link'], category: 'Text search', title: `With Link Text` },
    matchSelectionText: { contexts: ['selection'], category: 'Text search', title: `${APP_NAME} With "%s"` },
    // URL-based
    duplicates: { parentId, contexts: ['tab', 'link'] },
    sameSite: { parentId, contexts: ['tab', 'link'] },
    sameSite__cluster: { parentId, contexts: ['tab'] },
    sameSite__descendants: { parentId, contexts: ['tab'] },
    // Tab tree
    descendants: { parentId, contexts: ['tab'] },
    parent: { parentId, contexts: ['tab'] },
    parent__descendants: { parentId, contexts: ['tab'] },
    siblings: { parentId, contexts: ['tab'] },
    siblings__descendants: { parentId, contexts: ['tab'] },
    // Directional
    toStart: { parentId, contexts: ['tab'] },
    toEnd: { parentId, contexts: ['tab'] },
    addLeft: { parentId, contexts: ['tab'] },
    addRight: { parentId, contexts: ['tab'] },
    trailLeft: { parentId, contexts: ['tab'] },
    trailRight: { parentId, contexts: ['tab'] },
    // Temporal
    pastHour: { parentId, contexts: ['tab'] },
    past24Hours: { parentId, contexts: ['tab'] },
    today: { parentId, contexts: ['tab'] },
    yesterday: { parentId, contexts: ['tab'] },
    // Miscellaneous
    all: { parentId, contexts: ['tab'] },
    focused: { parentId, contexts: ['tab'] },
    unselected: { parentId, contexts: ['tab'] },
    cluster: { parentId, contexts: ['tab'] },
    // Switch within selection
    switchToHere: { parentId, contexts: ['tab'], category: 'Switch within selection', title: 'Switch to Here' },
    cycleForward: { parentId, contexts: ['tab'] },
    cycleBackward: { parentId, contexts: ['tab'] },
}

/**
 * Dict of default access keys (optional).
 * Not required, especially for commands expected to be 1) used via keyboard shortcuts and 2) excluded from context menus.
 * @type {object.<CommandId, string>}
 */
const DEFAULT_ACCESSKEYS = {
    menuRoot: 's',
    // Text search
    matchLinkText: 'w',
    matchSelectionText: 'w',
    // URL-based
    duplicates: 'u',
    sameSite: 's',
    sameSite__cluster: 'c',
    sameSite__descendants: 'm',
    // Tab tree
    descendants: 'd',
    parent: 'p',
    parent__descendants: 'n',
    siblings: 'i',
    siblings__descendants: 'b',
    // Directional
    toStart: 'a',
    toEnd: 'e',
    // Temporal
    pastHour: '1',
    past24Hours: '2',
    today: 'o',
    yesterday: 'y',
    // Miscellaneous
    all: 'l',
    unselected: 'v', // "Invert"
    // Switch focus
    switchToHere: 'f',
}

/**
 * Dict of command names to be shown in the tab context menu by default, in appropriate order grouped by category.
 * @type {CommandId[]}
 */
const DEFAULT_SHOWN_TAB_MENUITEMS = [
    // URL-based
    'duplicates',
    'sameSite',
    'sameSite__cluster',
    'sameSite__descendants',
    // Tab tree
    'descendants',
    'parent',
    'parent__descendants',
    // Directional
    'toStart',
    'toEnd',
    // Temporal
    'pastHour',
    'past24Hours',
    'today',
    'yesterday',
    // Miscellaneous
    'all',
    'unselected',
    // Switch focus
    'switchToHere',
]

/**
 * @returns {Promise<{ general: object.<string, any>, commands: CommandDict, shownTabMenuItems: Set<CommandId> }>}
 */
export async function getData() {
    /** @type {StoredData | {}} */
    const storedData = await browser.storage.sync.get();
    /** @type {object.<string, any>} */
    const general = storedData.general ?? {};
    /** @type {object.<CommandId, string>} */
    const accessKeys = storedData.accessKeys ?? DEFAULT_ACCESSKEYS;
    /** @type {Set<CommandId>} */
    const shownTabMenuItems = new Set(storedData.shownTabMenuItems ?? DEFAULT_SHOWN_TAB_MENUITEMS);

    // Handle legacy storage and convert to new format
    // Remove after 2025?
    /** @type {boolean} */
    const hasLegacyStorage = 'duplicates' in storedData; // Before v4, storedData was an object.<CommandId, boolean>
    if (hasLegacyStorage) {
        await browser.storage.sync.clear();
        for (const commandId in BASE_DICT)
            shownTabMenuItems[storedData[commandId] ? 'add' : 'delete'](commandId);
        browser.storage.sync.set({ accessKeys, shownTabMenuItems: [...shownTabMenuItems] });
    }

    // Populate commands object

    /** @type {CommandDict} */
    const commands = {};
    /** @type {object.<CommandId, { description: string }>} */
    const MANIFEST_DICT = browser.runtime.getManifest().commands;
    /** @type {{ vertical: boolean }} */
    const { vertical } = general;

    for (const [commandId, commandInfo] of Object.entries(BASE_DICT)) {
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
            const description = `${commandInfo.category}: ${commandInfo.title}`;
            browser.commands.update({ name: commandId, description });
        }

        commandInfo.accessKey = accessKeys[commandId] || '';
        commands[commandId] = commandInfo;
    }

    shownTabMenuItems.add(parentId);
    return { general, commands, shownTabMenuItems };
}
