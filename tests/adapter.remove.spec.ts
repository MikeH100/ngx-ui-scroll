import { makeTest, TestBedConfig } from './scaffolding/runner';
import { Misc } from './miscellaneous/misc';
import { removeItems } from './miscellaneous/items';
import { Process } from '../src/component/interfaces/index';

const configList: TestBedConfig[] = [{
  datasourceName: 'limited--99-100-dynamic-size-processor',
  datasourceSettings: { startIndex: 1, bufferSize: 5, padding: 0.2, itemSize: 20 },
  templateSettings: { viewportHeight: 100 },
  custom: {
    remove: [3, 4, 5]
  }
}, {
  datasourceName: 'limited--99-100-dynamic-size-processor',
  datasourceSettings: { startIndex: 55, bufferSize: 8, padding: 1, itemSize: 20 },
  templateSettings: { viewportHeight: 100 },
  custom: {
    remove: [54, 55, 56, 57, 58]
  }
}, {
  datasourceName: 'limited--99-100-dynamic-size-processor',
  datasourceSettings: { startIndex: 10, bufferSize: 5, padding: 0.2, itemSize: 20 },
  templateSettings: { viewportHeight: 100 },
  custom: {
    remove: [7, 8, 9]
  }
}];

configList.forEach(config => config.datasourceSettings.adapter = true);

const configListInterrupted = [{
  ...configList[0],
  custom: {
    remove: [2, 3],
    removeWithInterruption: [2, 3, 5, 6]
  }
}, {
  ...configList[1],
  custom: {
    remove: [54],
    removeWithInterruption: [54, 56, 57, 58]
  }
}];

const configListIncrease = configList.map(config => ({
  ...config,
  custom: {
    ...config.custom,
    increase: true
  }
}));

const configListBad = [{
  ...configList[0],
  custom: { ...configList[0].custom, predicate: null }
}, {
  ...configList[1],
  custom: { ...configList[1].custom, predicate: () => null }
}, {
  ...configList[0],
  custom: { ...configList[0].custom, predicate: (x: any, y: any) => null }
}];

const configOut = {
  ...configList[0],
  datasourceSettings: {
    ...configList[0].datasourceSettings,
    minIndex: -99,
    maxIndex: 100
  }
};

const configListOut = [{
  ...configOut, custom: {
    remove: [51, 52, 53, 54, 55]
  }
}/*, {
  ...configOut, custom: {
    remove: [-51, -52, -53, -54, -55]
  }
}*/];

const doRemove = async (config: TestBedConfig, misc: Misc, byId = false) => {
  const { remove: indexList, removeWithInterruption: indexListFull, increase } = config.custom;
  // remove item from the original datasource
  (misc.datasource as any).setProcessGet((result: any[]) =>
    removeItems(result, indexList, -99, 100, increase)
  );
  // remove items from the UiScroll
  await misc.adapter.remove({
    predicate: item =>
      (indexListFull || indexList).some((i: number) =>
        i === (byId ? item.data.id : item.$index)
      ),
    increase
  });
};

const shouldRemove = (config: TestBedConfig, byId = false) => (misc: Misc) => async (done: Function) => {
  await misc.relaxNext();
  const bufferSizeBeforeRemove = misc.scroller.buffer.size;
  const { remove: indexList, increase } = config.custom;
  const { minIndex, maxIndex } = misc.scroller.buffer;

  const loopPendingSub = misc.adapter.loopPending$.subscribe(loopPending => {
    if (!loopPending) { // when the first loop after the Remove is done
      const len = indexList.length;
      const { minIndex: min, maxIndex: max, size } = misc.scroller.buffer;
      expect(size).toEqual(bufferSizeBeforeRemove - len);
      expect(min).toBe(minIndex + (increase ? len : 0));
      expect(max).toBe(maxIndex - (increase ? 0 : len));
      loopPendingSub.unsubscribe();
    }
  });

  await doRemove(config, misc, byId);

  const { firstIndex, lastIndex, items } = misc.scroller.buffer;
  expect(misc.scroller.state.clip.callCount).toEqual(1);
  if (firstIndex === null || lastIndex === null) {
    return done();
  }

  // check all items contents
  items.forEach(({ $index, data: { id } }) => {
    const diff = increase
      ? indexList.reduce((acc: number, index: number) => acc - (id < index ? 1 : 0), 0)
      : indexList.reduce((acc: number, index: number) => acc + (id > index ? 1 : 0), 0);
    expect(misc.checkElementContent($index, $index + diff)).toEqual(true);
  });

  // check first visible, the first `${startIndex} : item #${startIndex}` must persist
  // expect(misc.adapter.firstVisible.data.id).toEqual(config.datasourceSettings.startIndex);

  done();
};

const shouldBreak = (config: TestBedConfig) => (misc: Misc) => (done: Function) => {
  spyOn(misc.workflow, 'finalize').and.callFake(() => {
    if (misc.workflow.cyclesDone === 1) {
      const innerLoopCount = misc.scroller.state.innerLoopCount;
      // call remove with wrong predicate
      misc.adapter.remove(config.custom.predicate);
      setTimeout(() => {
        expect(misc.workflow.cyclesDone).toEqual(1);
        expect(misc.scroller.state.innerLoopCount).toEqual(innerLoopCount);
        expect(misc.workflow.errors.length).toEqual(1);
        expect(misc.workflow.errors[0].process).toEqual(Process.remove);
        done();
      }, 40);
    }
  });
};

const shouldRemoveOutOfView = (config: TestBedConfig) => (misc: Misc) => async (done: Function) => {
  await misc.relaxNext();
  await doRemove(config, misc);
  const { datasourceSettings: { minIndex, maxIndex, itemSize } } = config;
  const size = (maxIndex - minIndex + 1) * itemSize;
  expect(misc.scroller.viewport.getScrollableSize()).toBe(size);
  const min = Math.min(...config.custom.remove);
  const prev = min - 1, len = config.custom.remove.length;
  const scrollPosition = Math.abs(minIndex - prev) * itemSize;
  misc.adapter.fix({ scrollPosition });
  await misc.relaxNext();
  expect(misc.adapter.firstVisible.$index).toBe(prev);
  expect(misc.checkElementContent(prev, prev)).toBe(true);
  expect(misc.checkElementContent(min, min + len)).toBe(true);
  misc.adapter.fix({ scrollPosition: Infinity });
  await misc.relaxNext();
  expect(misc.adapter.lastVisible.$index).toBe(maxIndex - len);
  expect(misc.checkElementContent(maxIndex - len, maxIndex)).toBe(true);
  expect(misc.scroller.viewport.getScrollableSize()).toBe(size);
  done();
};

describe('Adapter Remove Spec', () => {

  describe('Common cases', () => {
    configList.forEach(config =>
      makeTest({
        config,
        title: 'should remove by index',
        it: shouldRemove(config)
      })
    );

    configList.forEach(config =>
      makeTest({
        config,
        title: 'should remove by id',
        it: shouldRemove(config, true)
      })
    );

    configListInterrupted.forEach(config =>
      makeTest({
        config,
        title: 'should remove only first uninterrupted portion',
        it: shouldRemove(config)
      })
    );

    configListIncrease.forEach(config =>
      makeTest({
        config,
        title: 'should increase indexes before removed items',
        it: shouldRemove(config)
      })
    );

    configListBad.forEach(config =>
      makeTest({
        config,
        title: 'should break due to wrong predicate',
        it: shouldBreak(config)
      })
    );
  });

  // describe('Virtualization', () => {
  //   configListOut.forEach(config =>
  //     makeTest({
  //       config,
  //       title: 'should remove out of view',
  //       it: shouldRemoveOutOfView(config)
  //     })
  //   );
  // });

});
