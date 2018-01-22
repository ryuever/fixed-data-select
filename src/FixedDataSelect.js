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

export default class FixedDataSelect {
  constructor(options) {
    const opts = options || {};

    const {
      dataSource,
      target,
      onPressEnter,
      pressTodisappear,

      onItemClick,
    } = opts;

    this.dataSource = dataSource;

    this.target = target;

    this.onPressEnter = onPressEnter || noop;
    this.pressTodisappear = typeof pressTodisappear !== 'undefined' ? pressTodisappear : true;

    this.onItemClick = onItemClick || noop;

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
        if ([38, 40, 13].includes(e.keyCode)) return;
        this.listGenerator.updateDataFilter((item) => new RegExp(e.target.value).test(item));

        // once update data structure of show list,  show index should be update
        this.listNavigator.resetShowIndex(this.listGenerator.filteredDataSource.length);
      })
    }
  }

  cleanerOnDisappear() {
    this.epp.resetStat();

    // `showIndex` should be clear after every list disappear.
    const showIndex = this.listNavigator.activeShowIndex;
    this.listGenerator.removeClassFromItem(showIndex, 'active2');

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
    this.onItemClick(data);

    if (index === key) return;

    const index = this.listNavigator.activeIndex;

    const nextIndex = key;

    this.listGenerator.removeClassFromItem(index, 'active');
    this.listGenerator.addClassToItem(nextIndex, 'active');
    this.listGenerator.listNode.style.display = 'none';

    this.cleanerOnDisappear();
    this.listNavigator.updateIndexAfterCommit(key);

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
      itemHeight: 39,
    });

    this.listNavigator.on('change', (nextIndex, index) => {
      this.listGenerator.removeClassFromItem(index, 'active2');
      this.listGenerator.addClassToItem(nextIndex, 'active2');

      const nextValue = this.listGenerator.findRecordById(nextIndex);

      this.updateHolderValue(nextValue);
    })

    this.pressTodisappear && this.listNavigator.on('commit', (nextIndex, index) => {
      this.listGenerator.removeClassFromItem(index, 'active');
      this.listGenerator.addClassToItem(nextIndex, 'active');
      this.listGenerator.listNode.style.display = 'none';

      const record = this.listGenerator.findRecordById(nextIndex);

      this.onPressEnter(record);

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
