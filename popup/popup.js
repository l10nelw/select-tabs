/** @import { CommandInfo, CommandDict, LoadedData, SETTINGS } from '../common.js' */

const IGNORED_KEYDOWN_SET = new Set(['Enter', 'Tab', ' ', 'Alt', 'Control', 'Shift']);

/** @type {HTMLBodyElement} */ const $body = document.body;
/** @type {HTMLSelectElement} */ const $commandList = document.getElementById('commandList');
/** @type {HTMLFormElement} */ const $form = $commandList.form;
/** @type {HTMLButtonElement} */ const $submitBtn = document.getElementById('submit');
/** @type {HTMLButtonElement} */ const $optionsBtn = document.getElementById('options');

let keep_popup_open_on_execute = false;

init();
$body.addEventListener('keydown', onKeyDown);
$body.addEventListener('keyup', onKeyUp);
$form.addEventListener('submit', onSubmit);
$commandList.addEventListener('dblclick', onCommandDoubleClick);
$optionsBtn.addEventListener('click', onOptionsBtnClick);

/**
 * Load all popup-eligible commands and populate $commandList.
 */
async function init() {
    /**
     * @param {CommandInfo} commandInfo
     * @returns {boolean}
     */
    const isEligible = commandInfo => commandInfo.contexts.at(-1) === 'popup';

    /**
     * @param {string} label
     * @returns {HTMLOptGroupElement}
     */
    const insertOptionGroup = label => {
        const $optionGroup = document.createElement('optgroup');
        $optionGroup.label = label;
        $commandList.appendChild($optionGroup);
        return $optionGroup;
    };

    /** @type {LoadedData} */
    const { commands, settings } = await browser.storage.session.get(['commands', 'settings']);
    const { show_access_keys_in_popup } = settings;
    ({ keep_popup_open_on_execute } = settings);

    /** @type {Map<string, HTMLOptGroupElement>} */
    const categoryMap = new Map();

    for (const [commandId, commandInfo] of /** @type {[commandId, CommandInfo][]} */ (Object.entries(commands))) {
        if (!isEligible(commandInfo))
            continue;
        const { accessKey, category, title } = commandInfo;

        const $option = document.createElement('option');
        $option.value = commandId;
        $option.textContent = (show_access_keys_in_popup && accessKey) ?
            `${accessKey.toUpperCase()}: ${title}` : title;

        /** @type {HTMLOptGroupElement} */
        const $optionGroup = categoryMap.getOrInsertComputed(category, insertOptionGroup);
        $optionGroup.appendChild($option);
    }

    $commandList.options[0].selected = true;
    $commandList.focus();
}

function onOptionsBtnClick() {
    browser.runtime.openOptionsPage();
    window.close();
}

/**
 * @param {KeyboardEvent} event
*/
function onKeyDown(event) {
    // Work around bug where sometimes $commandList isn't initially focused
    // Upon pressing a character key, focus on $commandList if not already focused, allowing it to respond the key as expected
    if (document.activeElement !== $commandList && !IGNORED_KEYDOWN_SET.has(event.key))
        $commandList.focus();
}

/**
 * @param {KeyboardEvent} event
 */
function onKeyUp(event) {
    if (event.key === 'Enter' && event.target !== $optionsBtn)
        $form.requestSubmit();
}

/**
 * @param {MouseEvent} event
 */
function onCommandDoubleClick(event) {
    if (event.target.tagName === 'OPTION')
        $form.requestSubmit();
}

/**
 * @param {SubmitEvent} event
 */
function onSubmit(event) {
    event.preventDefault(); // Don't reload popup
    browser.runtime.sendMessage({ type: 'selectTabs', commandId: $commandList.value });

    if (!keep_popup_open_on_execute)
        return window.close();
    $submitBtn.classList.add('highlight');
    setTimeout(() => $submitBtn.classList.remove('highlight'), 100);
}
