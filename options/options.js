import menuData from '../menudata.js';

(async function populateForm() {
    const preferences = await browser.storage.sync.get();
    const disabledCommandSet = new Set(preferences?.disabledCommands);

    const $commands = document.getElementById('commands');
    const $template = $commands.querySelector('template').content;
    const template = {
        $heading: $template.firstElementChild,
        $checkField: $template.querySelector('label'),
    };
    $commands.addHeading = title => {
        const $heading = template.$heading.cloneNode();
        $heading.textContent = title;
        $commands.append($heading);
    };
    $commands.addField = (name, title, checked) => {
        const $field = template.$checkField.cloneNode(true);
        const $input = $field.querySelector('input');
        $input.name = name;
        $input.checked = checked;
        $field.querySelector('span').textContent = title.replace('&', '');
        $commands.append($field);
    };

    for (const [groupTitle, commandDict] of Object.entries(menuData)) {
        $commands.addHeading(groupTitle);
        for (const [name, title] of Object.entries(commandDict)) {
            $commands.addField(name, title, !disabledCommandSet.has(name));
        }
    }
})();

document.body.querySelector('form')
.addEventListener('submit', async event => {
    // Save and restart
    const disabledCommands = [];
    for (const $field of event.target.elements) {
        if ($field.classList.contains('command') && !$field.checked)
            disabledCommands.push($field.name);
    }
    await browser.storage.sync.set({ disabledCommands });
    browser.runtime.reload();
});