/*
 * Tab-getting functions a.k.a. commands.
 * Most require a target tab argument, some do not.
 * Returns either an array of tabs to be selected, or undefined/null (to abort selection).
 */

/** @typedef {import('../common.js').Tab} Tab */

/**
 * @param {Object} properties
 * @returns {Promise<Tab[]>}
 */
export const get = properties => browser.tabs.query({ currentWindow: true, ...properties });


/* --- Text search commands --- */

/**
 * @param {Tab} [_]
 * @param {Object} menuClickInfo
 * @param {string} menuClickInfo.linkText
 * @returns {Promise<Tab[]?>}
 */
export const matchLinkText = (_, { linkText }) => matchText(linkText);

/**
 * @param {Tab} [_]
 * @param {Object} menuClickInfo
 * @param {string} menuClickInfo.selectionText
 * @returns {Promise<Tab[]?>}
 */
export const matchSelectionText = (_, { selectionText }) => matchText(selectionText);

/**
 * @param {string} text
 * @returns {Promise<Tab[]?>}
 */
async function matchText(text) {
    text = text.trim().toLowerCase();
    if (!text)
        return;
    /**
     * @param {Tab} tab
     * @returns {boolean}
     */
    const isMatch = tab => {
        // Check title
        if (tab.title.toLowerCase().includes(text))
            return true;
        // Check url
        if (text.includes(' ')) // TODO: Should we check for more characters?
            return false;
        let url = tab.url.toLowerCase();
        if (url.startsWith(READER_HEAD))
            url = getReaderUrl(url);
        return url.includes(text);
    }
    return (await get()).filter(isMatch);
}


/* --- URL-based commands --- */

/**
 * @param {Tab} tab
 * @param {boolean} tab.isInReaderMode
 * @param {string} tab.url
 * @returns {Promise<Tab[]>}
 */
export async function duplicates({ url, isInReaderMode }) {
    if (isInReaderMode)
        url = getReaderUrl(url);
    const { protocol, hostname, pathname, search } = new URL(url); // Remove port and hash; they are not queryable
    url = (protocol === 'about:') ?
        protocol + pathname :
        `${protocol}//${hostname}${pathname}${search}`;
    return get({ url });
}

/**
 * @param {Tab} tab
 * @param {boolean} tab.isInReaderMode
 * @param {string} tab.url
 * @returns {Promise<Tab[]>}
 */
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

/**
 * @param {Tab} tab
 * @returns {Promise<Tab[]>}
 */
export async function sameSite__cluster(tab) {
    const tabs = await sameSite(tab);
    const targetTabIndex = tab.index;
    const targetArrayIndex = tabs.findIndex(tab => tab.index === targetTabIndex);
    const difference = targetTabIndex - targetArrayIndex;
    return tabs.filter(
        // Cluster tabs share same difference between tab and tabs-array indexes
        (tab, arrayIndex) => tab.index === arrayIndex + difference
    );
}

/**
 * @param {Tab} tab
 * @returns {Promise<Tab[]>}
 */
export async function sameSite__descendants(tab) {
    const tabs = await sameSite(tab);
    const descendantTabs = (await Promise.all( tabs.map(getDescendants) )).flat();
    return tabs.concat(descendantTabs);
}

const READER_HEAD = 'about:reader?url=';
/**
 * @param {string} url
 * @returns {string}
 */
const getReaderUrl = url => decodeURIComponent(url.slice(READER_HEAD.length));
/**
 * @param {string} url
 * @returns {string}
 */
const getHostname = url => (new URL(url)).hostname;
/**
 * @param {string} hostname
 * @returns {Promise<Tab[]>}
 */
const getReaderTabsByHostname = async hostname =>
    (await get({ url: `${READER_HEAD}*` }))
    .filter(tab => getHostname(getReaderUrl(tab.url)) === hostname);


/* --- Directional commands --- */

/**
 * @param {Tab} tab
 * @returns {Promise<Tab[]>}
 */
export const toStart = async ({ index }) => (await get()).slice(0, index + 1);

/**
 * @param {Tab} tab
 * @returns {Promise<Tab[]>}
 */
export const toEnd = async ({ index }) => (await get()).slice(index);

/**
 * @returns {Promise<Tab[]?>}
 */
export async function addLeft() {
    const selectedTabs = await get({ highlighted: true });
    const firstTabIndex = selectedTabs[0].index;
    if (firstTabIndex !== 0)
        return selectedTabs.concat({ index: firstTabIndex - 1 });
}

/**
 * @returns {Promise<Tab[]?>}
 */
export async function addRight() {
    const selectedTabs = await get({ highlighted: true });
    const tabToAdd = await getByIndex(selectedTabs.at(-1).index + 1);
    if (tabToAdd)
        return selectedTabs.concat({ index: tabToAdd.index });
}

/**
 * @returns {Promise<Tab[]?>}
 */
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

/**
 * @returns {Promise<Tab[]?>}
 */
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

/**
 * @param {number} index
 * @returns {Promise<Tab?>}
 */
const getByIndex = async index => (await get({ index }).catch(() => null))?.[0];


/* --- Tab-tree commands --- */

/**
 * @param {Tab} tab
 * @returns {Promise<Tab[]?>}
 */
export async function descendants(tab) {
    const descendantTabs = await getDescendants(tab);
    if (descendantTabs.length)
        return descendantTabs.concat(tab);
}

/**
 * @param {Tab} tab
 * @param {number} tab.openerTabId
 * @returns {Promise<Tab[]?>}
 */
export async function parent({ openerTabId }) {
    if (openerTabId)
        return [await getById(openerTabId)];
}

/**
 * @param {Tab} tab
 * @returns {Promise<Tab[]?>}
 */
export async function parent__descendants(tab) {
    const { openerTabId } = tab;
    return openerTabId ?
        (await Promise.all([ getById(openerTabId), getDescendants(openerTabId) ])).flat() :
        descendants(tab);
}

/**
 * @param {Tab} tab
 * @param {number} tab.openerTabId
 * @returns {Promise<Tab[]>}
 */
export async function siblings({ openerTabId }) {
    return openerTabId ?
        getChildrenOfId(openerTabId) : // If target tab has parent, get all tabs with same parent
        (await get()).filter(tab => !tab.openerTabId); // Else, get all parentless tabs
}

/**
 * @param {Tab} tab
 * @param {number} tab.openerTabId
 * @returns {Promise<Tab[]>}
 */
export function siblings__descendants({ openerTabId }) {
    return openerTabId ?
        getDescendants(openerTabId) :
        get();
}

/**
 * @param {Tab | number} tab_or_tabId
 * @returns {Promise<Tab[]>}
 */
async function getDescendants(tab_or_tabId) {
    const tabId = tab_or_tabId?.id || tab_or_tabId;
    const childTabs = await getChildrenOfId(tabId);
    const descendantTabs = (await Promise.all( childTabs.map(getDescendants) )).flat();
    return childTabs.concat(descendantTabs);
}

/**
 * @param {number} tabId
 * @returns {Promise<Tab>}
 */
const getById = tabId => browser.tabs.get(tabId);
/**
 * @param {number} openerTabId
 * @returns {Promise<Tab[]>}
 */
const getChildrenOfId = openerTabId => get({ openerTabId });


/* --- Temporal commands --- */

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

/** @returns {Promise<Tab[]>} */ export const pastHour = () => getTabsAccessedWithinPeriod(HOUR);
/** @returns {Promise<Tab[]>} */ export const past24Hours = () => getTabsAccessedWithinPeriod(DAY);
/** @returns {Promise<Tab[]>} */ export const today = () => getTabsAccessedOnDay(0);
/** @returns {Promise<Tab[]>} */ export const yesterday = () => getTabsAccessedOnDay(-1);

/**
 * @param {number} period
 * @returns {Promise<Tab[]>}
 */
async function getTabsAccessedWithinPeriod(period) {
    const now = Date.now();
    return (await get()).filter(tab => (now - tab.lastAccessed) <= period);
}

/**
 * @param {number} offset
 * @returns {Promise<Tab[]>}
 */
async function getTabsAccessedOnDay(offset) {
    const date = new Date();
    if (offset)
        date.setDate(date.getDate() + offset);
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    /**
     * @param {Tab} tab
     * @returns {boolean}
     */
    const isLastAccessedAtDate = tab => {
        const tabDate = new Date(tab.lastAccessed);
        return tabDate.getDate() === day && tabDate.getMonth() === month && tabDate.getFullYear() === year;
    };
    return (await get()).filter(isLastAccessedAtDate);
}


/* --- Other commands --- */

/** @returns {Promise<Tab[]>} */ export const all = () => get();
/** @returns {Promise<Tab[]>} */ export const focused = () => get({ active: true });
/** @returns {Promise<Tab[]>} */ export const unselected = () => get({ highlighted: false });
