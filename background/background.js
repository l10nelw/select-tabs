import * as GetTabs from './get.js'; // Tab getters (menu commands)
import selectTabs from './select.js'; // Selects tabs returned by getter
import { getPreferenceDict, getCommandMap, cleanCommandDescription, isOS } from '../common.js';

/** @typedef {import('../common.js').Tab} Tab */
/** @typedef {import('../common.js').CommandId} CommandId */
/** @typedef {import('../common.js').CommandDescription} CommandDescription */


const commandMap = getCommandMap();
const preferenceDict = await getPreferenceDict();
buildMenu(commandMap, preferenceDict);
cleanShortcutDescriptions(commandMap);

browser.contextMenus.onClicked.addListener(onMenuClicked);
browser.commands.onCommand.addListener(onCommandInvoked);


/**
 * @listens browser.contextMenus.onClicked
 * @param {Object} info
 * @param {CommandId} info.menuItemId
 * @param {string[]} info.modifiers
 * @param {Tab} targetTab
 */
function onMenuClicked({ menuItemId, modifiers }, targetTab) {
    selectTabs(GetTabs[menuItemId], targetTab, modifiers.includes('Shift'));
}

/**
 * @listens browser.commands.onCommand
 * @param {CommandId} command
 */
async function onCommandInvoked(command) {
    selectTabs(GetTabs[command], (await GetTabs.focused())[0]);
}

/**
 * @param {Map<CommandId, CommandDescription>} commandMap
 */
function cleanShortcutDescriptions(commandMap) {
    for (const [name, description] of commandMap)
        browser.commands.update({ name, description: cleanCommandDescription(description) });
}

/**
 * @param {Map<CommandId, CommandDescription>} commandMap
 * @param {Object<CommandId, boolean>} preferenceDict
 */
function buildMenu(commandMap, preferenceDict) {
    const contexts = ['tab'];
    const parentId = 'selecttabs';
    const parentTitle = '&Select Tabs';

    const addRoot = ()          => browser.contextMenus.create({ contexts, id: parentId, title: parentTitle });
    const addItem = (id, title) => browser.contextMenus.create({ contexts, parentId, id, title });
    const addSeparator = ()     => browser.contextMenus.create({ contexts, parentId, type: 'separator' });

    addRoot();

    // If on MacOS, access keys are not supported so remove their markers
    const formatTitle = isOS('Mac OS') ? cleanCommandDescription
        : title => title;

    let currentCategory = '';
    for (const [id, description] of commandMap) {
        // Skip disabled commands
        if (!preferenceDict[id])
            continue;

        const [category, title] = description.split(': ');

        // Add seperator at every change of category
        if (category !== currentCategory) {
            if (currentCategory)
                addSeparator();
            currentCategory = category;
        }

        addItem(id, formatTitle(title));
    }
}
