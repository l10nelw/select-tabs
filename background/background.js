import * as GetTabs from './get.js'; // Tab getters (menu commands)
import selectTabs from './select.js'; // Selects tabs returned by getter
import menuData from '../menudata.js';

(async function init() {
    const preferences = await browser.storage.sync.get();

    hydrateCommandDescriptions(menuData);

    browser.commands.onCommand.addListener(async (command) => {
        const currentTab = await browser.tabs.query({ currentWindow: true, active: true });

        if (Array.isArray(currentTab) && currentTab.length) {
            selectTabs(GetTabs[command], currentTab[0]);
        }
    });

    buildMenu(menuData, new Set(preferences.disabledCommands));

    browser.contextMenus.onClicked.addListener(
        ({ menuItemId }, tab) => selectTabs(GetTabs[menuItemId], tab)
    );

    browser.runtime.onMessage.addListener(async request => {
        // May be requested by the options frame
        if (request === 'preferences')
            return preferences;
    });
})();

// menuGroupDict is an dict of { group titles : { getter names : getter titles } }
function buildMenu(menuGroupDict, disabledItemSet) {
    const contexts = ['tab'];
    const parentId = 'selecttabs';
    const parentTitle = '&Select Tabs';

    const addRoot = ()          => browser.contextMenus.create({ contexts, id: parentId, title: parentTitle });
    const addItem = (id, title) => browser.contextMenus.create({ contexts, parentId, id, title });
    const addSeparator = ()     => browser.contextMenus.create({ contexts, parentId, type: 'separator' });

    // If there are disabled items, set removeDisabledItem as a function, otherwise set to null
    const removeDisabledItem = disabledItemSet.size ?
        (_, id, itemMap) => {
            if (disabledItemSet.has(id))
                itemMap.delete(id);
        } : null;

    addRoot();

    const menuGroups = Object.values(menuGroupDict);
    let first = true;
    for (let group of menuGroups) {
        group = new Map(Object.entries(group));

        // Filter out disabled items to get correct group size
        if (removeDisabledItem)
            group.forEach(removeDisabledItem);

        // A separator prefaces each non-first, non-empty group
        if (!first && group.size)
            addSeparator();

        for (const [id, title] of group.entries())
            addItem(id, title);

        first = false;
    }
}

function hydrateCommandDescriptions(groups) {
    for (const [group, commands] of Object.entries(groups)) {
        for (const [name, title] of Object.entries(commands)) {
            browser.commands.update({ name, description: `${group}: ${title.replace('&', '')}` });
        }
    }
}
