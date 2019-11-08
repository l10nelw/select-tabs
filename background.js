
const menu = {
    goto_parent: `Go to &parent`,
    select_family: `Select tab &family`,
    select_plus_siblings: `Select tab and &siblings`,
    select_plus_children: `Select &tab and children`,
    select_children: `Select &children`,
}

for (const id in menu) {
    browser.contextMenus.create({
        id,
        title: menu[id],
        onclick: window[id],
        contexts: ['tab'],
    });
}

function goto_parent(_, tab) {
    const openerTabId = tab.openerTabId;
    if (openerTabId) {
        browser.tabs.update(openerTabId, { active: true });
    }
}

async function select_family(_, tab) {
    const openerTabId = tab.openerTabId;
    if (openerTabId) {
        const [openerTab, descendantTabs] = await Promise.all([browser.tabs.get(openerTabId), get_descendants(openerTabId)]);
        select(descendantTabs.concat(openerTab));
    } else {
        select_plus_children(_, tab);
    }
}

async function select_plus_siblings(_, tab) {
    const descendantTabs = await get_descendants(tab.openerTabId);
    select(descendantTabs);
}

async function select_plus_children(_, tab) {
    const descendantTabs = (await get_descendants(tab.id)).concat(tab);
    select(descendantTabs);
}

async function select_children(_, tab) {
    const descendantTabs = await get_descendants(tab.id);
    if (descendantTabs.length) {
        select(descendantTabs);
    }
}

function select(tabs) {
    browser.tabs.highlight({ tabs: tabs.map(t => t.index) });
}

async function get_descendants(tabId) {
    const childTabs = await browser.tabs.query({ currentWindow: true, openerTabId: tabId });
    let descendantTabs = [].concat(childTabs);
    for (const tab of childTabs) {
        descendantTabs = descendantTabs.concat(await get_descendants(tab.id));
    }
    return descendantTabs;
}
