import * as auth from './auth';
import * as notifications from './notifications';
import * as clients from './clients';
import * as shops from './shops';
import * as streams from './streams';
import * as reels from './reels';
import * as reports from './reports';
import * as purchases from './purchases';
import * as system from './system';
import * as testpanel from './testpanel';

export const api = {
  ...auth,
  ...notifications,
  ...clients,
  ...shops,
  ...streams,
  ...reels,
  ...reports,
  ...purchases,
  ...system,
  ...testpanel,
};
