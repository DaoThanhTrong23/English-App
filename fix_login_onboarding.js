const fs = require('fs');
const file = 'mobile-english/src/app/(auth)/login.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace router.replace('/(tabs)') with conditional redirect
const injection = `
      if (user && user.onboardingCompleted === false) {
        /* @ts-ignore */
        router.replace('/onboarding');
      } else {
        /* @ts-ignore */
        router.replace('/(tabs)');
      }
`;

code = code.replace(/\/\* @ts-ignore \*\/\s*router\.replace\('\/\(tabs\)'\);/g, injection);
fs.writeFileSync(file, code);
