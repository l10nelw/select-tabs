const COMMANDS = [
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
    // Temporal
    'pastHour',
    'past24Hours',
    'today',
    'yesterday',
    // Other
    'focused',
    'unselected',
];

export function getPreferenceDict() {
    let defaultDict = {};
    for (const command of COMMANDS)
        defaultDict[command] = true;
    return browser.storage.sync.get(defaultDict);
}

export function getCommandMap() {
    const commandsManifest = browser.runtime.getManifest().commands;
    const map = new Map();
    for (const id of COMMANDS)
        map.set(id, commandsManifest[id].description);
    return map;
}

// Remove `&` character and parentheses text
export function cleanDescription(text) {
    const parenIndex = text.indexOf(' (');
    return parenIndex !== -1 ?
        text.slice(0, parenIndex) :
        text.replace('&', '');
}

export const isOS = osName => navigator.userAgent.indexOf(osName) !== -1;
