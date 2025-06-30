/*
 * Tab-getting functions a.k.a. commands.
 * Most require a target tab argument, some do not.
 * Returns either an array of tabs to be selected, or falsy (to abort selection).
 */

/** @typedef {import('../common.js').Tab} Tab */
/**
 * @callback ContextMenuClick_Getter
 * @param {Tab} _
 * @param {object} menuClickInfo
 * @param {string} menuClickInfo.linkText
 * @param {string} menuClickInfo.selectionText
 * @returns {Promise<Tab[]?>}
 */
/**
 * @callback Targeted_NoNull_Getter
 * @param {Tab} tab
 * @returns {Promise<Tab[]>}
 */
/**
 * @callback Targeted_CanNull_Getter
 * @param {Tab} tab
 * @returns {Promise<Tab[]?>}
 */
/**
 * @callback Targetless_NoNull_Getter
 * @returns {Promise<Tab[]>}
 */
/**
 * @callback Targetless_CanNull_Getter
 * @returns {Promise<Tab[]?>}
 */
/** @typedef {ContextMenuClick_Getter | Targeted_NoNull_Getter | Targeted_CanNull_Getter | Targetless_NoNull_Getter | Targeted_CanNull_Getter} Getter */

/**
 * @param {object.<string, any>} properties
 * @returns {Promise<Tab[]>}
 */
export const get = properties => browser.tabs.query({ currentWindow: true, ...properties });

/** @type {Targetless_NoNull_Getter} */
export const selected = () => get({ highlighted: true });

/**
 * Explicitly indicate the tab to focus among the tabs to select.
 * If the tab is not among the tabs to select, it will increase the selection set by that one tab.
 * @param {Tab[]} tabsToSelect
 * @param {Tab} tabToFocus
 * @returns {Tab[]}
 * @modifies tabsToSelect, tabToFocus
 */
function setTabFocus(tabsToSelect, tabToFocus) {
    tabToFocus.active = true;
    if (tabToFocus.id !== tabsToSelect[0].id)
        tabsToSelect.unshift(tabToFocus); // browser.tabs.highlight() will focus on the first tab in array
    return tabsToSelect;
}


/* --- Text search commands --- */

/** @type {ContextMenuClick_Getter} */ export const matchLinkText = (_, { linkText }) => matchText(linkText);
/** @type {ContextMenuClick_Getter} */ export const matchSelectionText = (_, { selectionText }) => matchText(selectionText);

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

/** @type {Targeted_CanNull_Getter} */
export async function duplicates({ url, isInReaderMode }) {
    if (isInReaderMode)
        url = getReaderUrl(url);
    const { protocol, hostname, pathname, search } = new URL(url); // Ignore port and hash; they are not queryable
    url = (protocol === 'about:') ?
        protocol + pathname :
        `${protocol}//${hostname}${pathname}${search}`;
    const tabs = await get({ url });
    if (tabs.length > 1)
        return tabs;
}

/** @type {Targeted_NoNull_Getter} */
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

/** @type {Targeted_NoNull_Getter} */
export const sameSite__cluster = async tab => getCluster(await sameSite(tab), tab);

/** @type {Targeted_NoNull_Getter} */
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

/** @type {Targeted_NoNull_Getter} */ export const toStart = async ({ index }) => (await get()).slice(0, index + 1);
/** @type {Targeted_NoNull_Getter} */ export const toEnd = async ({ index }) => (await get()).slice(index);

/** @type {Targetless_CanNull_Getter} */
export async function addLeft() {
    const selectedTabs = await selected();
    const firstTabIndex = selectedTabs[0].index;
    if (firstTabIndex !== 0)
        return selectedTabs.concat({ index: firstTabIndex - 1 });
}

/** @type {Targetless_CanNull_Getter} */
export async function addRight() {
    const selectedTabs = await selected();
    const tabToAdd = await getByIndex(selectedTabs.at(-1).index + 1);
    if (tabToAdd)
        return selectedTabs.concat({ index: tabToAdd.index });
}

/** @type {Targetless_CanNull_Getter} */
export async function trailLeft() {
    const tabsToSelect = await selected();
    const focusedTabArrayIndex = tabsToSelect.findIndex(tab => tab.active);
    const focusedTab = tabsToSelect[focusedTabArrayIndex];
    const focusedTabIndex = focusedTab.index;
    if (focusedTabIndex === 0)
        return;
    const rightTab = await getByIndex(focusedTabIndex + 1);
    const leftTabIndex = focusedTabIndex - 1;
    const leftTab = tabsToSelect.find(tab => tab.index === leftTabIndex) || { index: leftTabIndex };
    if (leftTab.highlighted && !rightTab?.highlighted)
        tabsToSelect.splice(focusedTabArrayIndex, 1); // Shrink trail by removing focusedTab from selection
    return setTabFocus(tabsToSelect, leftTab); // Switch focus to leftTab; Adds to selection if not already included, which expands trail
}

/** @type {Targetless_CanNull_Getter} */
export async function trailRight() {
    const tabsToSelect = await selected();
    const focusedTabArrayIndex = tabsToSelect.findIndex(tab => tab.active);
    const focusedTab = tabsToSelect[focusedTabArrayIndex];
    const focusedTabIndex = focusedTab.index;
    const rightTab = await getByIndex(focusedTabIndex + 1);
    if (!rightTab)
        return;
    const leftTabIndex = focusedTabIndex - 1;
    const leftTab = leftTabIndex >= 0 && tabsToSelect.find(tab => tab.index === leftTabIndex);
    if (rightTab.highlighted && !leftTab?.highlighted)
        tabsToSelect.splice(focusedTabArrayIndex, 1); // Shrink trail by removing focusedTab from selection
    return setTabFocus(tabsToSelect, rightTab); // Switch focus to rightTab; Adds to selection if not already included, which expands trail
}

/**
 * @param {number} index
 * @returns {Promise<Tab?>}
 */
const getByIndex = async index => (await get({ index }).catch(() => null))?.[0];


/* --- Tab-tree commands --- */

/** @type {Targeted_CanNull_Getter} */
export async function descendants(tab) {
    const descendantTabs = await getDescendants(tab);
    if (descendantTabs.length)
        return descendantTabs.concat(tab);
}

/** @type {Targeted_CanNull_Getter} */
export async function parent({ openerTabId }) {
    if (openerTabId)
        return [await getById(openerTabId)];
}

/** @type {Targeted_CanNull_Getter} */
export async function parent__descendants(tab) {
    const { openerTabId } = tab;
    if (openerTabId) {
        const [parentTab, descendantTabs] = await Promise.all([ getById(openerTabId), getDescendants(openerTabId) ]);
        return setTabFocus(descendantTabs, parentTab);
    }
    return descendants(tab);
}

/** @type {Targeted_NoNull_Getter} */
export async function siblings({ openerTabId }) {
    return openerTabId ?
        getChildrenOfId(openerTabId) : // If target tab has parent, get all tabs with same parent
        (await get()).filter(tab => !tab.openerTabId); // Else, get all parentless tabs
}

/** @type {Targeted_NoNull_Getter} */
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


/* --- Membership commands --- */

/** @type {Targeted_CanNull_Getter} */ export const sameTabGroup = ({ groupId }) => (groupId !== -1) && get({ groupId });
/** @type {Targeted_CanNull_Getter} */ export const sameContainer = ({ cookieStoreId }) => isContainerId(cookieStoreId) && get({ cookieStoreId });

const NON_CONTAINER_IDS = ['firefox-default', 'firefox-private'];
const isContainerId = cookieStoreId => !NON_CONTAINER_IDS.includes(cookieStoreId);


/* --- Temporal commands --- */

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

/** @type {Targetless_NoNull_Getter} */ export const pastHour = () => getTabsAccessedWithinPeriod(HOUR);
/** @type {Targetless_NoNull_Getter} */ export const past24Hours = () => getTabsAccessedWithinPeriod(DAY);
/** @type {Targetless_NoNull_Getter} */ export const today = () => getTabsAccessedOnDay(0);
/** @type {Targetless_NoNull_Getter} */ export const yesterday = () => getTabsAccessedOnDay(-1);

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


/* --- Selection commands --- */

/** @type {Targetless_NoNull_Getter} */ export const all = () => get();
/** @type {Targetless_NoNull_Getter} */ export const focused = () => get({ active: true }); // "Clear"
/** @type {Targetless_NoNull_Getter} */ export const unselected = () => get({ highlighted: false }); // "Invert"
/** @type {Targeted_NoNull_Getter}   */ export const cluster = async tab => getCluster(await selected(), tab);

/**
 * Given an array of tabs that may have continuity gaps in their indexes, return only the consecutive-indexes subarray that the targetTab is part of.
 * Meaning, return a bunch of tabs around the targetTab that must be adjacent to each other.
 * @param {Tab[]} tabs
 * @param {Tab} targetTab
 * @returns {Tab[]}
 */
function getCluster(tabs, targetTab) {
    const targetTabIndex = targetTab.index;
    const targetArrayIndex = tabs.findIndex(tab => tab.index === targetTabIndex);
    const difference = targetTabIndex - targetArrayIndex;
    return tabs.filter(
        /**
         * Cluster tabs share same difference between tab and tabs-array indexes.
         * @param {Tab} tab
         * @param {number} arrayIndex
         * @returns {boolean}
         */
        (tab, arrayIndex) => tab.index === (arrayIndex + difference)
    );
}


/* --- Switch within selection commands --- */

/**
 * @type {Targeted_NoNull_Getter}
 * @modifies tab
 */
export const switchToHere = async tab => setTabFocus(await selected(), tab);

/** @returns {Promise<Tab[]>} */ export const cycleForward = () => cycleInSelection(1);
/** @returns {Promise<Tab[]>} */ export const cycleBackward = () => cycleInSelection(-1);

/**
 * @param {number} offset
 * @returns {Promise<Tab[]>}
 */
async function cycleInSelection(offset) {
    const selectedTabs = await selected();
    const focusedTabArrayIndex = selectedTabs.findIndex(tab => tab.active);
    const tab = selectedTabs.at(focusedTabArrayIndex + offset) ?? selectedTabs[0];
    return setTabFocus(selectedTabs, tab);
}
