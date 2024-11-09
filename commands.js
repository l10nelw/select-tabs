/** @typedef {import('../common.js').CommandId} CommandId */
/** @typedef {import('../common.js').CommandInfo} CommandInfo */
/** @typedef {import('../common.js').CommandDict} CommandDict */

/** @type {string} */ const APP_NAME = browser.runtime.getManifest().name;
/** @type {string} */ const parentId = 'menuRoot';

/** @enum {CommandDict} */
const BASE_DICT = {
    [parentId]: { contexts: ['tab', 'link'], title: APP_NAME },
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
}

/** @type {Object<CommandId, string>} */
const DEFAULT_ACCESSKEYS = {
    menuRoot: 's',
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
    toStart: 't',
    toEnd: 'e',
    // Temporal
    pastHour: '1',
    past24Hours: '2',
    today: 'o',
    yesterday: 'y',
    // Miscellaneous
    all: 'a',
    unselected: 'v', // "Invert"
}

/** @type {CommandId[]} */
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
]

/**
 * @returns {Promise<{ commands: CommandDict, shownTabMenuItems: Set<CommandId> }>}
 */
export async function getData() {
    const storedContent = await browser.storage.sync.get();
    let { accessKeys = DEFAULT_ACCESSKEYS, shownTabMenuItems = DEFAULT_SHOWN_TAB_MENUITEMS } = storedContent;
    shownTabMenuItems = new Set(shownTabMenuItems);

    // Handle legacy storage and convert to new format
    /** @type {boolean} */
    const hasLegacyStorage = 'duplicates' in storedContent; // Before v4, storedContent was an Object<CommandId, boolean>
    if (hasLegacyStorage) {
        await browser.storage.sync.clear();
        for (const commandId in BASE_DICT)
            shownTabMenuItems[storedContent[commandId] ? 'add' : 'delete'](commandId);
        browser.storage.sync.set({ accessKeys, shownTabMenuItems: [...shownTabMenuItems] });
    }

    /** @type {Object<CommandId, { description: string }>} */
    const MANIFEST_DICT = browser.runtime.getManifest().commands;
    /** @type {CommandDict} */
    const commands = {};
    for (const [commandId, commandInfo] of Object.entries(BASE_DICT)) {
        // If command is shortcut-able (defined in manifest), use shortcut description to add category and title
        if (commandId in MANIFEST_DICT) {
            const [category, title] = MANIFEST_DICT[commandId].description.split(': ');
            commandInfo.category = category;
            commandInfo.title = title;
        }
        commandInfo.accessKey = accessKeys[commandId] || '';
        commands[commandId] = commandInfo;
    }

    shownTabMenuItems.add(parentId);
    return { commands, shownTabMenuItems };
}
