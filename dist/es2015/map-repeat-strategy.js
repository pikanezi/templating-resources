import { createFullOverrideContext, updateOverrideContexts } from './repeat-utilities';

export let MapRepeatStrategy = class MapRepeatStrategy {
  getCollectionObserver(observerLocator, items) {
    return observerLocator.getMapObserver(items);
  }

  instanceChanged(repeat, items) {
    let removePromise = repeat.removeAllViews(true);
    if (removePromise instanceof Promise) {
      removePromise.then(() => this._standardProcessItems(repeat, items));
      return;
    }
    this._standardProcessItems(repeat, items);
  }

  _standardProcessItems(repeat, items) {
    let index = 0;
    let overrideContext;

    items.forEach((value, key) => {
      overrideContext = createFullOverrideContext(repeat, value, index, items.size, key);
      repeat.addView(overrideContext.bindingContext, overrideContext);
      ++index;
    });
  }

  instanceMutated(repeat, map, records) {
    let key;
    let i;
    let ii;
    let overrideContext;
    let removeIndex;
    let record;
    let rmPromises = [];
    let viewOrPromise;

    for (i = 0, ii = records.length; i < ii; ++i) {
      record = records[i];
      key = record.key;
      switch (record.type) {
        case 'update':
          removeIndex = this._getViewIndexByKey(repeat, key);
          viewOrPromise = repeat.removeView(removeIndex, true);
          if (viewOrPromise instanceof Promise) {
            rmPromises.push(viewOrPromise);
          }
          overrideContext = createFullOverrideContext(repeat, map.get(key), removeIndex, map.size, key);
          repeat.insertView(removeIndex, overrideContext.bindingContext, overrideContext);
          break;
        case 'add':
          overrideContext = createFullOverrideContext(repeat, map.get(key), map.size - 1, map.size, key);
          repeat.insertView(map.size - 1, overrideContext.bindingContext, overrideContext);
          break;
        case 'delete':
          if (record.oldValue === undefined) {
            return;
          }
          removeIndex = this._getViewIndexByKey(repeat, key);
          viewOrPromise = repeat.removeView(removeIndex, true);
          if (viewOrPromise instanceof Promise) {
            rmPromises.push(viewOrPromise);
          }
          break;
        case 'clear':
          repeat.removeAllViews(true);
          break;
        default:
          continue;
      }
    }

    if (rmPromises.length > 0) {
      Promise.all(rmPromises).then(() => {
        updateOverrideContexts(repeat.views(), 0);
      });
    } else {
      updateOverrideContexts(repeat.views(), 0);
    }
  }

  _getViewIndexByKey(repeat, key) {
    let i;
    let ii;
    let child;

    for (i = 0, ii = repeat.viewCount(); i < ii; ++i) {
      child = repeat.view(i);
      if (child.bindingContext[repeat.key] === key) {
        return i;
      }
    }

    return undefined;
  }
};