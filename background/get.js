/*
 * Tab-getting functions a.k.a. commands.
 * Most require a target tab argument, some do not.
 * Returns an array of tabs to be selected, or undefined/null to abort selection.
 */

const get = properties => browser.tabs.query({ currentWindow: true, ...properties });


/* URL-based commands */

export async function duplicates({ url, isInReaderMode }) {
    if (isInReaderMode)
        url = getReaderUrl(url);
    const { protocol, hostname, pathname, search } = new URL(url); // Remove port and hash; they are not queryable
    url = (protocol === 'about:') ? protocol + pathname
        : `${protocol}//${hostname}${pathname}${search}`;
    return get({ url });
}

export async function sameSite({ url, isInReaderMode }) {
    if (isInReaderMode)
        url = getReaderUrl(url);
    const { protocol, hostname } = new URL(url);
    if (protocol === 'file:')
        return get({ url: 'file:///*' });
    if (protocol === 'moz-extension:')
        return get({ url: `moz-extension://${hostname}/*` });
    if (hostname)
        return (await Promise.all([
            get({ url: `*://${hostname}/*` }),
            getReaderTabsByHostname(hostname),
        ])).flat();
    return (await get({ url: `${protocol}*` })).filter(tab => !tab.isInReaderMode);
}

export async function sameSite__cluster(tab) {
    const tabs = await sameSite(tab);
    const targetTabIndex = tab.index;
    const targetArrayIndex = tabs.findIndex(tab => tab.index === targetTabIndex);
    const difference = targetTabIndex - targetArrayIndex;
    return tabs.filter(
        (tab, arrayIndex) => tab.index === arrayIndex + difference
    ); // Cluster tabs share same difference between tab and tabs-array indexes
}

export async function sameSite__descendants(tab) {
    const tabs = await sameSite(tab);
    const descendantTabs = (await Promise.all( tabs.map(getDescendants) )).flat();
    return tabs.concat(descendantTabs);
}

const READER_HEAD = 'about:reader?url=';
const getReaderUrl = url => decodeURIComponent( url.slice(READER_HEAD.length) );
const getHostname = url => (new URL(url)).hostname;
const getReaderTabsByHostname = async hostname =>
    (await get({ url: `${READER_HEAD}*` }))
    .filter(tab => getHostname(getReaderUrl(tab.url)) === hostname);


/* Directional commands */

export const toStart = async ({ index }) => (await get()).slice(0, index + 1);
export const toEnd = async ({ index }) => (await get()).slice(index);

export async function addLeft() {
    const selectedTabs = await get({ highlighted: true });
    const firstTabIndex = selectedTabs[0].index;
    if (firstTabIndex !== 0)
        return selectedTabs.concat({ index: firstTabIndex - 1 });
}

export async function addRight() {
    const selectedTabs = await get({ highlighted: true });
    const tabToAdd = await getByIndex(selectedTabs.at(-1).index + 1);
    if (tabToAdd)
        return selectedTabs.concat({ index: tabToAdd.index });
}

export async function trailLeft() {
    const tabsToSelect = await get({ highlighted: true });
    const focusedTabArrayIndex = tabsToSelect.findIndex(tab => tab.active);
    const focusedTab = tabsToSelect[focusedTabArrayIndex];
    const focusedTabIndex = focusedTab.index;
    if (focusedTabIndex === 0)
        return;
    const rightTab = await getByIndex(focusedTabIndex + 1);
    const leftTabIndex = focusedTabIndex - 1;
    const leftTab = tabsToSelect.find(tab => tab.index === leftTabIndex) || { index: leftTabIndex };
    leftTab.active = true;
    if (!leftTab.highlighted || rightTab?.highlighted) {
        // Extend trail
        tabsToSelect.unshift(leftTab); // Add leftTab to selection
        delete focusedTab.active;
    } else {
        // Shrink trail
        tabsToSelect.splice(focusedTabArrayIndex, 1); // Remove focusedTab from selection
    }
    return tabsToSelect;
}

export async function trailRight() {
    const tabsToSelect = await get({ highlighted: true });
    const focusedTabArrayIndex = tabsToSelect.findIndex(tab => tab.active);
    const focusedTab = tabsToSelect[focusedTabArrayIndex];
    const focusedTabIndex = focusedTab.index;
    const rightTab = await getByIndex(focusedTabIndex + 1);
    if (!rightTab)
        return;
    const leftTabIndex = focusedTabIndex - 1;
    const leftTab = leftTabIndex >= 0 && tabsToSelect.find(tab => tab.index === leftTabIndex);
    rightTab.active = true;
    if (!rightTab.highlighted || leftTab?.highlighted) {
        // Extend trail
        tabsToSelect.unshift(rightTab); // Add rightTab to selection
        delete focusedTab.active;
    } else {
        // Shrink trail
        tabsToSelect.splice(focusedTabArrayIndex, 1); // Remove focusedTab from selection
    }
    return tabsToSelect;
}

const getByIndex = async index => (await get({ index }).catch(() => null))?.[0];


/* Tab-tree commands */

export async function descendants(tab) {
    return [tab, ...await getDescendants(tab)];
}

export async function parent({ openerTabId }) {
    if (openerTabId)
        return [await getById(openerTabId)];
}

export async function parent__descendants(tab) {
    const { openerTabId } = tab;
    return openerTabId ? (await Promise.all([ getById(openerTabId), getDescendants(openerTabId) ])).flat()
        : descendants(tab);
}

export async function siblings({ openerTabId }) {
    return openerTabId ? getChildrenOfId(openerTabId) // If target tab has parent, get all tabs with same parent
        : (await get()).filter(tab => !tab.openerTabId); // Else, get all parentless tabs
}

export function siblings__descendants({ openerTabId }) {
    return openerTabId ? getDescendants(openerTabId)
        : get();
}

async function getDescendants(tab_or_tabId) {
    const tabId = tab_or_tabId?.id || tab_or_tabId;
    const childTabs = await getChildrenOfId(tabId);
    const descendantTabs = (await Promise.all( childTabs.map(getDescendants) )).flat();
    return childTabs.concat(descendantTabs);
}

const getById = tabId => browser.tabs.get(tabId);
const getChildrenOfId = openerTabId => get({ openerTabId });


/* Temporal commands */

const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

export const pastHour = () => getTabsAccessedWithinPeriod(HOUR);
export const past24Hours = () => getTabsAccessedWithinPeriod(DAY);
export const today = () => getTabsAccessedOnDay(0);
export const yesterday = () => getTabsAccessedOnDay(-1);

async function getTabsAccessedWithinPeriod(period) {
    const now = Date.now();
    return (await get()).filter(tab => (now - tab.lastAccessed) <= period);
}

async function getTabsAccessedOnDay(offset) {
    const date = new Date();
    if (offset)
        date.setDate(date.getDate() + offset);
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const isLastAccessedAtDate = tab => {
        const tabDate = new Date(tab.lastAccessed);
        return tabDate.getDate() === day && tabDate.getMonth() === month && tabDate.getFullYear() === year;
    };
    return (await get()).filter(isLastAccessedAtDate);
}

/* Other commands */

// Deselect all but the focused tab
export const focused = () => get({ active: true });

// Invert selection
export const unselected = () => get({ highlighted: false });
