
const menu = {
    parent: {
        title: `Go to &parent`,
        onclick: goto_parent,
    },
    family: {
        title: `Select tab &family`,
        onclick: select_family,
    },
    plus_siblings: {
        title: `Select tab and &siblings`,
        onclick: select_plus_siblings,
    },
    plus_children: {
        title: `Select &tab and children`,
        onclick: select_plus_children,
    },
    children: {
        title: `Select &children`,
        onclick: select_children,
    },
}

for (const id in menu) {
    const item = menu[id];
    browser.contextMenus.create({
        id,
        title: item.title,
        onclick: item.onclick,
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
