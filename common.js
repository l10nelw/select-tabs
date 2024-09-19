/**
 * @typedef {Object<string, any>} Tab
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab}
 */
/** @typedef {string} CommandId */
/** @typedef {string} CommandDescription */


/** @type {CommandId[]} */
const ORDERED_COMMANDS = [
    // URL-based
    'duplicates',
    'sameSite',
    'sameSite__cluster',
    'sameSite__descendants',
    // Tab tree
    'descendants',
    'parent',
    'parent__descendants',
    'siblings',
    'siblings__descendants',
    // Directional
    'toStart',
    'toEnd',
    'addLeft',
    'addRight',
    'trailLeft',
    'trailRight',
    // Temporal
    'pastHour',
    'past24Hours',
    'today',
    'yesterday',
    // Other
    'focused',
    'unselected',
];

/** @returns {Promise<Object<CommandId, boolean>>} */
export function getPreferenceDict() {
    const defaultDict = {};
    for (const command of ORDERED_COMMANDS)
        defaultDict[command] = true;
    return browser.storage.sync.get(defaultDict);
}

/** @returns {Map<CommandId, CommandDescription>} */
export function getCommandMap() {
    const commandsManifest = browser.runtime.getManifest().commands;
    const map = new Map();
    for (const id of ORDERED_COMMANDS)
        map.set(id, commandsManifest[id].description);
    return map;
}

/**
 * Remove `&` character and parentheses text.
 * @param {CommandDescription} text
 * @returns {string}
 */
export function cleanCommandDescription(text) {
    const parentIndex = text.indexOf(' (');
    return parentIndex !== -1 ?
        text.slice(0, parentIndex) :
        text.replace('&', '');
}

/**
 * Check for OS name in browser's user agent string.
 * @param {string} osName
 * @returns {boolean}
 */
export const isOS = osName => navigator.userAgent.indexOf(osName) !== -1;
