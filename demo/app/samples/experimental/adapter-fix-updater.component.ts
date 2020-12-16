import { Component } from '@angular/core';

import { demos } from '../../routes';
import { DemoSources, DemoSourceType } from '../../shared/interfaces';

import { Datasource } from '../../../../public_api';

@Component({
  selector: 'app-adapter-fix-updater',
  templateUrl: './adapter-fix-updater.component.html'
})
export class DemoAdapterFixUpdaterComponent {

  demoContext = {
    config: demos.experimental.map.adapterFixUpdater,
    noInfo: true
  };

  adapterScope = demos.adapter;

  datasource = new Datasource({
    get: (index: number, count: number, success: Function) => {
      const data = [];
      for (let i = index; i < index + count; i++) {
        data.push({ id: i, text: 'item #' + i });
      }
      success(data);
    }
  });

  inputValue: string;

  constructor() {
    this.inputValue = '5';
  }

  sources: DemoSources = [{
    name: DemoSourceType.Template,
    text: `<button (click)="doUpdate()">Update</button> item #
<input [(ngModel)]="inputValue" size="2">
<div>Items in buffer: {{this.countItems()}}</div>

<div class="viewport">
  <div *uiScroll="let item of datasource">
    <div class="item">{{item.text}}</div>
  </div>
</div>`
  }, {
    name: DemoSourceType.Component,
    text: `inputValue = '5'

datasource = new Datasource({
  get: (index, count, success) => {
    const data = [];
    for (let i = index; i < index + count; i++) {
      data.push({ id: i, text: 'item #' + i });
    }
    success(data);
  }
});

doUpdate() {
  const index = Number(this.inputValue);
  if (!isNaN(index)) {
    this.datasource.adapter.fix({
      updater: ({ $index, data }) => {
        if (index === $index) {
          data.text += '*';
        }
      }
    });
  }
}

countItems() {
  let count = 0;
  this.datasource.adapter.fix({
    updater: ({}) => count++
  });
  return count;
}
`
  }];

  itemAdapterDescription = `  ItemAdapter {
    $index: number;
    data: any;
    element?: HTMLElement;
  }`;

  adapterFixUpdater = `Adapter.fix({ updater })`;

  doUpdate() {
    const index = Number(this.inputValue);
    if (!isNaN(index)) {
      this.datasource.adapter.fix({
        updater: ({ $index, data }) => {
          if (index === $index) {
            data.text += '*';
          }
        }
      });
    }
  }

  countItems() {
    let count = 0;
    this.datasource.adapter.fix({
      updater: ({ }) => count++
    });
    return count;
  }

}
