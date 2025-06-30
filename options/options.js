import { isOS } from '../common.js';
import * as Commands from '../commands.js';

/** @typedef {import('../common.js').StoredData} StoredData */
/** @typedef {import('../common.js').CommandId} CommandId */
/** @typedef {import('../common.js').CommandInfo} CommandInfo */
/** @typedef {import('../common.js').CommandDict} CommandDict */

/** @type {boolean} */ const SUPPORTS_ACCESSKEYS = !isOS('Mac OS');
/** @type {HTMLFormElement} */ const $form = document.body.querySelector('form');
/** @type {HTMLTableSectionElement} */ const $commandTableBody = $form.querySelector('tbody');

populate();
$form.addEventListener('submit', onFormSubmit);
$form.addEventListener('input', onFormInput);
$form.addEventListener('focusin', onFormFocus);
$form.addEventListener('click', onFormClick);

/**
 * @param {string} type
 * @returns {string}
 */
const relevantProp = type => (type === 'checkbox') ? 'checked' : 'value';

async function populate() {
    const $template = $form.querySelector('template').content;
    /** @type {HTMLTableRowElement} */ const $headingTemplate = $template.firstElementChild;
    /** @type {HTMLTableRowElement} */ const $rowTemplate = $template.lastElementChild;

    /** @type {[{ general: object, commands: CommandDict, shownTabMenuItems: Set<CommandId> }, object[]]} */
    const [{ general, commands, shownTabMenuItems }, shortcutableCommands] = await Promise.all([ Commands.getData(), browser.commands.getAll() ]);

    for (const { name, shortcut } of shortcutableCommands)
        commands[name].shortcut = shortcut || '—';

    if (SUPPORTS_ACCESSKEYS) {
        commands.matchSelectionText.title = 'With Selected Text';
    } else {
        $form.querySelector('.accessKey')?.remove(); // In <thead>
        $headingTemplate.querySelector('.accessKey')?.remove();
        $rowTemplate.querySelector('.accessKey')?.remove();
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
    $commandTableBody.addRow = (id, { accessKey, contexts, parentId, shortcut, title }) => {
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
            $accessKey.value = accessKey;
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

    // General fields
    for (const [key, value] of Object.entries(general)) {
        /** @type {HTMLInputElement} */
        const $field = $form[key];
        $field[relevantProp($field.type)] = value;
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

    /** @type {object.<string, any>} */
    const general = {};
    for (const $input of $form.querySelectorAll('#general input'))
        if ($input.checked)
            general[$input.name] = true;

    /** @type {string[]} */
    const shownTabMenuItems = [];
    for (const $input of $commandTableBody.querySelectorAll('.showInTabMenu input'))
        if ($input.checked)
            shownTabMenuItems.push($input.name);

    /** @type {object.<CommandId, string>} */
    const accessKeys = {};
    for (const $input of $commandTableBody.querySelectorAll('.accessKey input'))
        if ($input.value)
            accessKeys[$input.name] = $input.value;

    await browser.storage.sync.set(/** @type {StoredData} */ { general, shownTabMenuItems, accessKeys });
    browser.runtime.reload();
}
