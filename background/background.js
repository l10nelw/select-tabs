import * as GetTabs from './get.js'; // Tab getters (menu commands)
import selectTabs from './select.js'; // Selects tabs returned by getter
import { getCommandMap, cleanDescription, isOS } from '../common.js';

(async function init() {
    const commandMap = getCommandMap();
    const preferences = await browser.storage.sync.get();
    cleanShortcutDescriptions(commandMap);
    buildMenu(commandMap, new Set(preferences.disabledCommands));
})();

browser.contextMenus.onClicked.addListener(({ menuItemId }, targetTab) => {
    selectTabs(GetTabs[menuItemId], targetTab);
});

browser.commands.onCommand.addListener(async command => {
    selectTabs(GetTabs[command], (await GetTabs.focused())[0]);
});

function cleanShortcutDescriptions(commandMap) {
    for (const [name, description] of commandMap)
        browser.commands.update({ name, description: cleanDescription(description) });
}

function buildMenu(commandMap, disabledItemSet) {
    const contexts = ['tab'];
    const parentId = 'selecttabs';
    const parentTitle = '&Select Tabs';

    const addRoot = ()          => browser.contextMenus.create({ contexts, id: parentId, title: parentTitle });
    const addItem = (id, title) => browser.contextMenus.create({ contexts, parentId, id, title });
    const addSeparator = ()     => browser.contextMenus.create({ contexts, parentId, type: 'separator' });

    addRoot();

    // If on MacOS, remove unsupported hotkeys
    const format = isOS('Mac OS') ?
        cleanDescription :
        title => title;

    let currentCategory = '';
    for (const [id, description] of commandMap) {
        if (disabledItemSet.has(id))
            continue;
        const [category, title] = description.split(': ');
        // Add seperator at every change of category
        if (category !== currentCategory) {
            if (currentCategory)
                addSeparator();
            currentCategory = category;
        }
        addItem(id, format(title));
    }
}
