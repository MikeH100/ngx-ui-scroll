import { Settings as ISettings, DevSettings as IDevSettings } from '../interfaces/index';
import { assignSettings, assignDevSettings } from '../utils/index';

export const defaultSettings: ISettings = {
  adapter: false,
  startIndex: 1,
  minIndex: -Infinity,
  maxIndex: Infinity,
  itemSize: 20,
  bufferSize: 5,
  padding: 0.5,
  infinite: false,
  horizontal: false,
  windowViewport: false
};

export const minSettings: ISettings = {
  itemSize: 1,
  bufferSize: 1,
  padding: 0.01
};

export const defaultDevSettings: IDevSettings = {
  debug: false, // logging is enabled if true; need to turn off when release
  immediateLog: true, // logging is not immediate if false, it could be forced via Workflow.logForce call
  logTime: false, // log time difference
  clipAfterFetchOnly: true,
  clipAfterScrollOnly: true,
  paddingForwardSize: 0,
  paddingBackwardSize: 0,
  throttle: 40,
  inertialScrollDelay: 25
};

export class Settings implements ISettings {

  // user settings
  adapter: boolean;
  startIndex: number;
  minIndex: number;
  maxIndex: number;
  itemSize: number;
  bufferSize: number;
  padding: number;
  infinite: boolean;
  horizontal: boolean;
  windowViewport: boolean;

  // development settings
  debug: boolean;
  immediateLog: boolean;
  logTime: boolean;
  clipAfterFetchOnly: boolean;
  clipAfterScrollOnly: boolean;
  paddingForwardSize: number;
  paddingBackwardSize: number;
  throttle: number;
  inertialScrollDelay: number;

  // internal settings, managed by scroller itself
  instanceIndex: number;

  constructor(
    settings: ISettings | undefined, devSettings: IDevSettings | undefined, instanceIndex: number
  ) {
    assignSettings(this, settings || {}, defaultSettings, minSettings);
    assignDevSettings(this, devSettings || {}, defaultDevSettings);
    this.instanceIndex = instanceIndex;
    // todo: min/max indexes must be ignored if infinite mode is enabled
  }
}
