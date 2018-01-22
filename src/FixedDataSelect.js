// The most reasonable method to set `active` class is watching the `variable` change.
// On this situation, we can get the value and nextValue;

import ListViewNavigator from 'listview-navigator';
import DOMEventer from 'dom-eventer';
import ListViewProvider from 'listview-provider';
import DOMPositionProvider from 'dom-position-provider';
import EventPositionProvider from 'event-position-provider';
import isInput from 'predicable-utilities/lib/isInput';
import isDiv from 'predicable-utilities/lib/isDiv';

const noop = () => {};
const isFunction = (obj) => typeof obj === 'function';

export default class FixedDataSelect {
  constructor(options) {
    const opts = options || Object.create(null);

    const {
      dataSource,
      target,
      onPress,
      pressTodisappear,
      displayField = '',
      displayFilter = null,
      onItemClick,
      itemHeight,
    } = opts;

    this.dataSource = dataSource;

    this.target = target;

    this.onPress = onPress || noop;
    this.pressTodisappear = typeof pressTodisappear !== 'undefined' ? pressTodisappear : true;

    this.onItemClick = onItemClick || noop;
    this.displayFilter = displayFilter;
    this.itemHeight = itemHeight;

    this.eventer = new DOMEventer();

    this.mountListenerToTargetIfNecessary();
    this.initListViewProvider();
    this.initListViewNavigator();
    this.initPositionManager();
    this.initEventPositionProvider();
  }

  mountListenerToTargetIfNecessary() {
    if (isInput(this.target)) {
      this.eventer.listen(this.target, 'keyup', (e) => {
        // skip the arrow key.
        e.preventDefault();
        if ([38, 40, 13].includes(e.keyCode)) return;

        this.listGenerator.updateDataFilter((item) => {
          const { target: { value } } = e;

          if (isFunction(this.displayFilter)) {
            return this.displayFilter(e.target.value);
          }
          return new RegExp(e.target.value).test(item);
        });

        if (!e.target.value) {
          this.listNavigator.resetIndex();
          this.listNavigator.setMaxIndex(this.listGenerator.filteredDataSource.length)
          return true;
        } else {
          // once update data structure of show list,  show index should be update
          this.listNavigator.resetShowIndex(this.listGenerator.filteredDataSource.length);

          // set first item as selected
          this.listGenerator.addClassToItem(0, 'active');
        }
      })
    }
  }

  cleanerOnDisappear() {
    this.epp.resetStat();

    // `showIndex` should be clear after every list disappear.
    const showIndex = this.listNavigator.activeShowIndex;
    this.listGenerator.removeClassFromItem(showIndex, 'active');

    // If `target` is `input` type; it should lose focus after list container disappear;

    if (isInput(this.target)) {
      this.target.blur();
    }
  }

  // 1. trigger on arrow key `up`, `down`
  // 2. triggered on manually click
  // 3. manually input
  updateHolderValue(value) {
    if (isInput(this.target)) {
      this.target.value = value;
    }

    if (isDiv(this.target)) {
      this.target.innerHTML = value;
    }
  }

  itemClickHandlerWrapper(data, key) {
    const index = this.listNavigator.activeIndex;

    // no need to exclude the key and index the same's condition
    // if (index === key) return;

    const nextIndex = key;

    this.listGenerator.removeClassFromItem(index, 'active2');
    this.listGenerator.addClassToItem(nextIndex, 'active2');
    this.listGenerator.listNode.style.display = 'none';

    const record = this.listGenerator.findRecordById(nextIndex);
    this.onItemClick(data);

    this.cleanerOnDisappear();
    this.listNavigator.updateActiveIndex(key);

    this.updateHolderValue(data);
  }

  initListViewProvider() {
    this.listGenerator = new ListViewProvider({
      dataSource: this.dataSource,
      onItemClick: this.itemClickHandlerWrapper.bind(this),
    });
  }

  initListViewNavigator() {
    this.listNavigator = new ListViewNavigator({
      target: this.listGenerator.listNode,
      max: this.dataSource.length,
      itemHeight: this.itemHeight,
    });

    this.listNavigator.on('change', (nextIndex, index) => {
      this.listGenerator.removeClassFromItem(index, 'active');
      this.listGenerator.addClassToItem(nextIndex, 'active');

      // only if arrow down/up will trigger updateHolderValue
      if (nextIndex === index && nextIndex === 0) return;

      const nextValue = this.listGenerator.findRecordById(nextIndex);

      this.updateHolderValue(nextValue);
    })

    this.pressTodisappear && this.listNavigator.on('commit', (nextIndex, index) => {
      this.listGenerator.removeClassFromItem(index, 'active2');
      this.listGenerator.addClassToItem(nextIndex, 'active2');
      this.listGenerator.listNode.style.display = 'none';

      const record = this.listGenerator.findRecordById(nextIndex);

      this.onPress(record);

      this.cleanerOnDisappear();
    })
  }

  initPositionManager() {
    this.positionManager = new DOMPositionProvider({
      sourceNode: this.listGenerator.listNode,
      targetNode: this.target,
      orientation: ['bottom', 'left'],
    })
  }

  initShowIndexOnAppear() {
    const index = this.listNavigator.activeIndex;
    this.listGenerator.addClassToItem(index, 'active');
  }

  initEventPositionProvider() {
    this.epp = new EventPositionProvider({
      entryNodes: [
        this.target,
        this.listGenerator.listNode,
      ],
    })

    this.epp.on('click', (stat) => {
      const { event, eventType } = stat;

      if (eventType === 'willDismiss') {
        this.listGenerator.listNode.style.display = 'none';
      }

      if (eventType === 'willFire') {
        this.listGenerator.listNode.style.display = 'block';
        const rect = this.positionManager.getRect();

        const { top, left, bottom, right } = rect;

        this.listGenerator.listNode.style.position = 'absolute';
        this.listGenerator.listNode.style.top = `${top}px`;
        this.listGenerator.listNode.style.left = `${left}px`;

        this.initShowIndexOnAppear();
      }
    })
  }
}
