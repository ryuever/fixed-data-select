# fixed data select

Interactive <kbd>Select</kbd> with typing auto-completion. It has following features:

- Optimization of list display(Todo): For big data, it will only display limited number of items;
- auto-completion when types: Recently, the filtered display data is processed locally; you could provide customization filter which will apply when you typeing. As default, it means the match the regexp

```js
new RegExp(e.target.value).test(item)
```

- <kbd>uparrow</kbd>, <kbd>downarrow</kbd> and <kbd>Enter</kbd> key stroke handle automatically.

## usage

```js
new FixedDataSelect({
  target,
  dataSource,
  itemHeight: 31,
  onPress: (record) => {
    // ...
  },
  onItemClick: (record) => {
    // ...
  },
});
```

## API

### `FixedDataSelect`

Just like its name, it aim to process a list display with fixed data;

- `dataSource(Array)`: Data source which are used to display on the list.
- `target(HTMLElement)`: The target node list will bind with.
- `onPress(function)`: The callback function which will be triggered on press <kbd>Enter</kbd>.
- `onItemClick(function)`: The callback function which will be triggered on click on the list item.
- `itemHeight(Number)`: It is required which indicate the height of list item. It could be used to calculate current active item's position.
