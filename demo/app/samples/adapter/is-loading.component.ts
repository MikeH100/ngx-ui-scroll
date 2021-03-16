import { Component } from '@angular/core';

import { demos } from '../../routes';
import { DemoContext, DemoSources, DemoSourceType } from '../../shared/interfaces';
import { datasourceGetCallbackInfinite } from '../../shared/datasource-get';

import { Datasource } from '../../../../public_api'; // from 'ngx-ui-scroll';

@Component({
  selector: 'app-demo-is-loading',
  templateUrl: './is-loading.component.html'
})
export class DemoIsLoadingComponent {

  demoContext: DemoContext = {
    config: demos.adapterProps.map.isLoading,
    viewportId: 'is-loading-viewport',
    count: 0,
    log: ''
  };

  datasource = new Datasource({
    get: datasourceGetCallbackInfinite(this.demoContext, 225)
  });

  sources: DemoSources = [{
    name: DemoSourceType.Component,
    text: `datasource = new Datasource ({
  get: (index, count, success) => {
    const data = [];
    for (let i = index; i <= index + count - 1; i++) {
      data.push({ id: i, text: 'item #' + i });
    }
    setTimeout(() => success(data), 225);
  }
});

isLoadingCounter = 0;

constructor() {
  this.datasource.adapter.isLoading$
    .subscribe(isLoading =>
      this.isLoadingCounter += !isLoading ? 1 : 0
    );
}
`
  }, {
    active: true,
    name: DemoSourceType.Template,
    text: `The uiScroll is
{{datasource.adapter.isLoading ? 'loading': 'relaxing'}}.

<br>

The value of isLoading counter has been changed
for {{isLoadingCounter}} times.

<div class="viewport">
  <div *uiScroll="let item of datasource">
    <div class="item">{{item.text}}</div>
  </div>
</div>`
  }, {
    name: DemoSourceType.Styles,
    text: `.viewport {
  width: 150px;
  height: 250px;
  overflow-y: auto;
}
.item {
  font-weight: bold;
  height: 25px;
}`
  }];

  isLoadingCounter = 0;

  constructor() {
    this.datasource.adapter.isLoading$
      .subscribe(isLoading => this.isLoadingCounter += !isLoading ? 1 : 0);
  }
}
