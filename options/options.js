import { isOS } from '../common.js';
import * as Storage from '../storage.js';

/** @import { CommandId, CommandInfo, CommandDict, StoredData } from '../common.js' */

/** @type {boolean} */ const SUPPORTS_ACCESSKEYS = !isOS('Mac OS');
/** @type {HTMLFormElement} */ const $form = document.body.querySelector('form');
/** @type {HTMLTableSectionElement} */ const $commandTableBody = $form.querySelector('tbody');

populate();
$form.addEventListener('submit', onFormSubmit);
$form.addEventListener('input', onFormInput);
$form.addEventListener('focusin', onFormFocus);
$form.addEventListener('click', onFormClick);

async function populate() {
    const $template = $form.querySelector('template').content;
    /** @type {HTMLTableRowElement} */ const $headingTemplate = $template.firstElementChild;
    /** @type {HTMLTableRowElement} */ const $rowTemplate = $template.lastElementChild;

    /** @type {[StoredData, { name: CommandId, shortcut: string }[]]} */
    const [{ commands }, shortcutableCommands] = await Promise.all([ Storage.load(), browser.commands.getAll() ]);

    for (const { name, shortcut } of shortcutableCommands)
        commands[name].shortcut = shortcut || '—';

    if (!SUPPORTS_ACCESSKEYS) {
        // Remove accessKey column
        $form.querySelector('.accessKey')?.remove(); // In <thead>
        $headingTemplate.querySelector('.accessKey')?.remove();
        $rowTemplate.querySelector('.accessKey')?.remove();
        // These commands are not configurable (cannot disable, no access keys)
        delete commands.menuRoot;
        delete commands.matchLinkText;
        delete commands.matchSelectionText;
    }

    /**
     * @param {string} category
     * @returns {HTMLTableRowElement}
     */
    $commandTableBody.addHeading = category => {
        /** @type {HTMLTableRowElement} */
        const $heading = $headingTemplate.cloneNode(true);
        $heading.firstElementChild.textContent = category;
        $commandTableBody.append($heading);
        return $heading;
    };

    /**
     * @param {CommandId} id
     * @param {CommandInfo} info
     * @returns {HTMLTableRowElement}
     */
    $commandTableBody.addRow = (id, { accessKey, contexts, parentId, showInTabMenu, shortcut, title }) => {
        /** @type {boolean} */
        const isTabMenuItem = parentId && contexts.includes('tab');
        if (!isTabMenuItem && !SUPPORTS_ACCESSKEYS)
            return;
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
            ? $showInTabMenu.checked = showInTabMenu
            : $showInTabMenu.remove();

        // accessKey
        if (SUPPORTS_ACCESSKEYS) {
            /** @type {HTMLInputElement} */
            const $accessKey = $row.querySelector('.accessKey input');
            $accessKey.name = id;
            $accessKey.value = accessKey ?? '';
            $accessKey.setAttribute('aria-label', `Access key for "${title}" command`);
        }

        // shortcut
        if (shortcut)
            $row.querySelector('.shortcut').textContent = shortcut;

        $commandTableBody.append($row);
        return $row;
    };

    // Add rows for commands and categories
    let currentCategory = '';
    for (const [id, info] of Object.entries(commands)) {
        const { category = '' } = info;
        if (category !== currentCategory) {
            $commandTableBody.addHeading(category);
            currentCategory = category;
        }
        $commandTableBody.addRow(id, info);
    }
}

/**
 * @listens Event#click
 * @param {Event} event
 */
function onFormClick({ target }) {
    if (target.matches('.shortcut') && target.textContent)
        browser.commands.openShortcutSettings();
}

/**
 * @listens Event#focusin
 * @param {Event} event
 */
async function onFormFocus(event) {
    const $field = event.target;
    if ($field.matches('.accessKey input'))
        $field.select();
}

/**
 * @listens Event#input
 * @param {Event} event
 */
async function onFormInput(event) {
    const $field = event.target;
    if ($field.matches('.accessKey input'))
        $field.value = $field.value.toLowerCase();
}

/**
 * Store preferences as StoredData in browser.storage.sync.
 * @listens Event#submit
 * @param {Event} event
 */
async function onFormSubmit(event) {
    event.preventDefault();

    /** @type {CommandDict} */
    const commands = {};
    for (const $input of $commandTableBody.querySelectorAll('.showInTabMenu input')) {
        commands[$input.name] ??= {};
        commands[$input.name].showInTabMenu = $input.checked;
    }
    for (const $input of $commandTableBody.querySelectorAll('.accessKey input')) {
        commands[$input.name] ??= {};
        commands[$input.name].accessKey = $input.value;
    }

    await Storage.save(/** @type {StoredData} */ ({ commands }));
    browser.runtime.reload();
}
