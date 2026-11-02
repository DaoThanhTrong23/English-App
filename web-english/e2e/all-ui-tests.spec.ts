import { after } from 'node:test';
import { closeHarness } from './helpers/test-harness.ts';

import './specs/01-auth-layout-notif.spec.ts';
import './specs/02-dash-topic-toplvl.spec.ts';
import './specs/03-course-crsdtl.spec.ts';
import './specs/04-word-wrdadd.spec.ts';
import './specs/05-test-tstdtl-tstres.spec.ts';
import './specs/06-student-stddet-keywrd.spec.ts';
import './specs/07-aichat-game-achieve.spec.ts';
import './specs/08-role-staff-log-setting.spec.ts';
import './specs/09-cross-sec-val.spec.ts';

after(async () => {
  await closeHarness();
});
