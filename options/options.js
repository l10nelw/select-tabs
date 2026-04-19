import { isOS, MENU_ROOT } from '../common.js';

/** @import { CommandId, CommandInfo, StoredCommandInfo, ContextType, LoadedData, StoredData } from '../common.js' */

const SUPPORTS_MENU_ACCESSKEYS = !isOS('Mac OS');

/** @type {HTMLFormElement} */ const $form = document.body.querySelector('form');
/** @type {HTMLInputElement[]} */ const $settings = $form.querySelectorAll('.setting');
/** @type {HTMLButtonElement} */ const $submitBtn = $form.querySelector('button[type="submit"]');

init(); // Load options
$form.addEventListener('change', onFormChange);
$form.addEventListener('click', onFormClick);
$form.addEventListener('focusin', onFormFocus);
$form.addEventListener('input', onFormInput);
$form.addEventListener('submit', onFormSubmit); // Save options

/**
 * Get stored data and hydrate $form with it.
 */
async function init() {
    const $template = $form.querySelector('template').content;
    /** @type {HTMLTableRowElement} */ const $headingTemplate = $template.firstElementChild;
    /** @type {HTMLTableRowElement} */ const $rowTemplate = $template.lastElementChild;

    const CommandTableBodyMethods = {
        /**
         * @param {string} category
         * @returns {HTMLTableRowElement}
         */
        addHeading(category) {
            /** @type {HTMLTableRowElement} */
            const $heading = $headingTemplate.cloneNode(true);
            $heading.firstElementChild.textContent = category;
            $commandTableBody.append($heading);
            return $heading;
        },

        /**
         * @param {CommandId} id
         * @param {CommandInfo} info
         * @returns {HTMLTableRowElement}
         */
        addRow(id, { accessKey, contexts, parentId, showInTabMenu, shortcut, title }) {
            /** @type {boolean} */
            const isTabMenuItem = parentId && contexts.includes('tab');

            /** @type {HTMLTableRowElement} */
            const $row = $rowTemplate.cloneNode(true);

            // title
            /** @type {HTMLLabelElement} */
            const $title = $row.querySelector('.title label');
            $title.textContent = title;
            $title.htmlFor = id;

            // showInTabMenu
            /** @type {HTMLInputElement} */
            const $showInTabMenu = $row.querySelector('.showInTabMenu input');
            $showInTabMenu.id = id;
            $showInTabMenu.name = id;
            isTabMenuItem
                ? $showInTabMenu.dataset.initial = $showInTabMenu.checked = showInTabMenu
                : $showInTabMenu.remove();

            // accessKey
            /** @type {HTMLInputElement} */
            const $accessKey = $row.querySelector('.accessKey input');
            $accessKey.name = id;
            $accessKey.dataset.initial = $accessKey.value = accessKey ?? '';
            $accessKey.setAttribute('aria-label', `Access key for "${title}" command`);

            // shortcut
            if (shortcut)
                $row.querySelector('.shortcut').textContent = shortcut;

            $commandTableBody.append($row);
            return $row;
        },
    };
    /** @type {HTMLTableSectionElement & typeof CommandTableBodyMethods} */
    const $commandTableBody = Object.assign($form.querySelector('tbody'), CommandTableBodyMethods);

    /// Begin populating ///

    const { commands, settings } = await getData();

    // General settings
    for (const $setting of $settings)
        $setting.dataset.initial = $setting.checked = settings[$setting.name];

    // Table rows for commands and categories
    let currentCategory = '';
    for (const [id, info] of /** @type {[CommandId, CommandInfo][]} */ (Object.entries(commands))) {
        const { category = '' } = info;
        if (category !== currentCategory) {
            $commandTableBody.addHeading(category);
            currentCategory = category;
        }
        $commandTableBody.addRow(id, info);
    }
}

/**
 * @listens Event#change
 * @param {Event & { target: HTMLInputElement }} event
 */
async function onFormChange({ target }) {
    indicateModifiedField(target);
}

/**
 * @listens Event#click
 * @param {Event & { target: HTMLElement }} event
 */
function onFormClick({ target }) {
    if (target.matches('#commands legend button'))
        return target.ariaExpanded = target.ariaExpanded === 'false';

    if (target.matches('#commands:has(button[aria-expanded="false"])'))
        return target.querySelector('legend button').ariaExpanded = true;

    if (target.matches('.shortcut') && target.textContent)
        return browser.commands.openShortcutSettings();
}

/**
 * @listens Event#focusin
 * @param {Event & { target: HTMLInputElement }} event
 */
async function onFormFocus({ target }) {
    // Select text inside accessKey field when focused
    if (target.matches('.accessKey input'))
        target.select();
}

/**
 * @listens Event#input
 * @param {Event & { target: HTMLInputElement }} event
 */
async function onFormInput({ target }) {
    // Make text inside accessKey field always lowercased
    if (target.matches('.accessKey input'))
        target.value = target.value.toLowerCase();
    indicateModifiedField(target);
}

/**
 * @listens Event#submit
 * @param {Event} event
 */
async function onFormSubmit(event) {
    event.preventDefault();
    await saveData();
    browser.runtime.reload();
}

/**
 * Get options data from session-storage and add in keyboard shortcuts of commands.
 * Remove unconfigurable commands if necessary.
 * @returns {Promise<LoadedData>}
 */
async function getData() {
    /** @type {[LoadedData, { name: CommandId, shortcut: string }[]]} */
    const [data, shortcutableCommands] = await Promise.all([
        browser.storage.session.get(['commands', 'settings']),
        browser.commands.getAll(),
    ]);
    const commands = data.commands;

    for (const { name, shortcut } of shortcutableCommands) {
        /** @type {StoredCommandInfo & { shortcut?: string }} */
        const command = commands[name];
        if (command)
            command.shortcut = shortcut || '—';
    }

    if (!SUPPORTS_MENU_ACCESSKEYS) {
        delete commands[MENU_ROOT];
        for (const commandId in commands) {
            // If command is neither used in tab nor popup contexts, it is not configurable (cannot disable + no access keys)
            // So exclude it from the table
            /** @type {ContextType[]} */
            const contexts = commands[commandId].contexts;
            if (!contexts.includes('tab') && !contexts.includes('popup'))
                delete commands[commandId];
        }
    }

    data.commands = commands;
    return data;
}

/**
 * Gather options data from $form and store in sync-storage.
 */
async function saveData() {
    /**
     * @param {string} fieldSelector
     * @returns {HTMLInputElement[]}
     */
    const queryFields = fieldSelector => $form.querySelectorAll(fieldSelector);

    /** @type {StoredData['commands']} */ const commands = {};
    /** @type {StoredData['settings']} */ const settings = {};

    for (const { checked, name } of $settings) {
        settings[name] = checked;
    }
    for (const { checked, name } of queryFields('td.showInTabMenu input')) {
        commands[name] ??= {};
        commands[name].showInTabMenu = checked;
    }
    for (const { name, value } of queryFields('td.accessKey input')) {
        commands[name] ??= {};
        commands[name].accessKey = value;
    }

    await browser.storage.sync.clear();
    await browser.storage.sync.set({ commands, settings });
}

/**
 * Mark $field if its value has changed and needs saving.
 * Also mark $submitBtn if a save is needed.
 * @param {HTMLInputElement} $field
 */
function indicateModifiedField($field) {
    if (!('initial' in $field.dataset))
        return;

    const isModified = ($field.type === 'checkbox') ?
        $field.checked !== ($field.dataset.initial === 'true') :
        $field.value !== $field.dataset.initial;

    $field.parentElement.classList.toggle('modified', isModified);
    $submitBtn.classList.toggle('modified', $form.querySelector('.modified > input'));
}
