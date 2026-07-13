import fs from 'node:fs';
const required = [
  'src/pages/index.astro', 'src/pages/cities.astro', 'src/pages/[city]/index.astro',
  'src/pages/[city]/judges/index.astro', 'src/pages/[city]/judges/[judge].astro',
  'src/pages/[city]/compare.astro', 'src/pages/[city]/cases/index.astro',
  'src/pages/[city]/cases/[caseId].astro', 'src/pages/[city]/data.astro',
  'src/pages/data.astro', 'src/pages/es/index.astro', 'src/pages/es/cities.astro',
  'src/pages/es/[city]/index.astro', 'src/pages/es/[city]/judges/index.astro',
  'src/pages/es/[city]/judges/[judge].astro', 'src/pages/es/[city]/compare.astro',
  'src/pages/es/[city]/cases/index.astro', 'src/pages/es/[city]/cases/[caseId].astro',
  'src/pages/es/[city]/data.astro',
];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`Missing route source: ${file}`);
const home = fs.readFileSync('src/pages/index.astro', 'utf8');
if (/Shelby County, Tennessee/i.test(home)) throw new Error('National homepage must not be jurisdiction-specific.');
for (const [file, target] of [
  ['src/pages/cases.astro', '/memphis/cases'],
  ['src/pages/judges.astro', '/memphis/judges'],
  ['src/pages/compare.astro', '/memphis/compare'],
]) if (!fs.readFileSync(file, 'utf8').includes(target)) throw new Error(`${file} is missing the Memphis legacy redirect.`);
console.log(`City route PASS (${required.length} route sources checked).`);
