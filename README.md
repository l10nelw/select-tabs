# Tab Selector

Select a tab's parent, siblings, children, or the whole family. If you often open lots of links in new tabs, this simple tool can come in handy.

## How it works

Tab Selector adds a context menu that appears when you right-click a tab (henceforth "target" tab). The menu items are:

- **Go to parent** &mdash; Go to the tab where the target was spawned from.
- **Select tab family** &mdash; Select the parent tab and all its descendants, including the target. If it has no parent, "Select tab and children" is invoked.
- **Select tab and siblings** &mdash; Select the target, its siblings, and all their descendants. If it has no parent, you end up with all tabs selected.
- **Select tab and children** &mdash; Select the target and its descendants.
- **Select children** &mdash; Select the target's descendants.

Note that for every tab selected, its children (tabs spawned from it) will also be selected, and their children, and so on. Meaning a "Select ..." option always implies the inclusion of descendants.

### Why would I use this?

Have you ever &ndash; while browsing or researching on sites like Wikipedia, Reddit, Amazon, StackOverflow, etc. &ndash; found yourself drifting off into topical tangents that quickly grow into large clusters of tabs, wishing you could instantly select these entire tangents to move to a new window, bookmark, or destroy? Yeah me too.

### Tree Style Tab exists. Why Tab Selector?

Yes, [Tree Style Tab](https://addons.mozilla.org/firefox/addon/tree-style-tab/) is a great addon that visually depicts all tab "family trees" right before your eyes. But maybe it's a bit much for you, maybe it's not your style (heh), maybe it doesn't serve a desired tab-handling option provided by another extension you've installed.

Maybe you just need something lightweight that lets you do one thing &ndash; select related (ha!) tabs &ndash; so you can do whatever else you want with them. This is here it.