import { BehaviorSubject, Subject } from 'rxjs';

import {
  makeDatasource,
  AdapterPropName,
  EMPTY_ITEM,
  IDatasource,
  IDatasourceConstructed,
  IReactivePropConfig,
  IAdapterConfig,
  IAdapterItem,
  IAdapter
} from './vscroll';

interface IReactiveOverride<Item = unknown> {
  init$: Subject<boolean>;
  isLoading$: Subject<boolean>;
  loopPending$: Subject<boolean>;
  firstVisible$: BehaviorSubject<IAdapterItem<Item>>;
  lastVisible$: BehaviorSubject<IAdapterItem<Item>>;
  bof$: Subject<boolean>;
  eof$: Subject<boolean>;
}

type _Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

interface IAngularAdapter<Data = unknown>
  extends _Omit<IAdapter<Data>, keyof IReactiveOverride<Data>>,
    IReactiveOverride<Data> {}

interface IAngularDatasourceParams<Data = unknown>
  extends _Omit<IDatasource<Data>, 'adapter'> {}

interface IAngularDatasource<Data = unknown>
  extends _Omit<IDatasource<Data>, 'adapter'> {
  adapter?: IAngularAdapter<Data>;
}

interface IAngularDatasourceConstructed<Data = unknown>
  extends _Omit<IDatasourceConstructed<Data>, 'adapter'> {
  adapter: IAngularAdapter<Data>;
}

const getBooleanSubjectPropConfig = (): IReactivePropConfig => ({
  source: new Subject<boolean>(),
  emit: (source, value) => (source as Subject<boolean>).next(value as boolean)
});

const getItemBehaviorSubjectPropConfig = (): IReactivePropConfig => ({
  source: new BehaviorSubject<IAdapterItem>(EMPTY_ITEM),
  emit: (source, value) =>
    (source as BehaviorSubject<IAdapterItem>).next(value as IAdapterItem)
});

const getAdapterConfig = (): IAdapterConfig => ({
  mock: false,
  reactive: {
    [AdapterPropName.init$]: getBooleanSubjectPropConfig(),
    [AdapterPropName.isLoading$]: getBooleanSubjectPropConfig(),
    [AdapterPropName.loopPending$]: getBooleanSubjectPropConfig(),
    [AdapterPropName.firstVisible$]: getItemBehaviorSubjectPropConfig(),
    [AdapterPropName.lastVisible$]: getItemBehaviorSubjectPropConfig(),
    [AdapterPropName.bof$]: getBooleanSubjectPropConfig(),
    [AdapterPropName.eof$]: getBooleanSubjectPropConfig()
  }
});

type AngularDatasourceClass<> = new <Data>(
  params: IAngularDatasourceParams<Data>
) => IAngularDatasourceConstructed<Data>;

const AngularDatasource = makeDatasource(
  getAdapterConfig
) as AngularDatasourceClass;

export {
  IAngularAdapter as IAdapter,
  IAngularDatasource as IDatasource,
  AngularDatasource as Datasource
};
