export async function parent(tab) {
    const openerTabId = tab.openerTabId;
    if (openerTabId) return [await browser.tabs.get(openerTabId)];
}

export async function parent__descendants(tab) {
    const openerTabId = tab.openerTabId;
    if (openerTabId) {
        const tabPromises = [browser.tabs.get(openerTabId), descendants(openerTabId)];
        return (await Promise.all(tabPromises)).flat();
    } else {
        return target__descendants(tab);
    }
}

export async function target__descendants(tab) {
    return [tab, ...await descendants(tab)];
}

export async function descendants(tab_or_tabId) {
    const tabId = tab_or_tabId?.id || tab_or_tabId;
    const descendantTabs = await browser.tabs.query({ currentWindow: true, openerTabId: tabId });
    for (const tab of descendantTabs) {
        descendantTabs.push(...await descendants(tab));
    }
    return descendantTabs;
}

export async function sameHost(tab) {
    const host = (new URL(tab.url)).hostname;
    if (host) return await browser.tabs.query({ currentWindow: true, url: `*://${host}/*` });
}

export async function sameHost__descendants(tab) {
    const siteTabs = await sameHost(tab);
    if (!siteTabs) return;
    for (const tab of siteTabs) {
        siteTabs.push(...await descendants(tab));
    }
    return siteTabs;
}
