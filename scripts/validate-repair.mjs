import fs from 'node:fs';
const required=['src/pages/admin/add-cities.astro','src/pages/admin/login.astro','src/pages/api/admin/login.ts','src/pages/api/admin/actions.ts','src/middleware.ts','src/components/LegalFooter.astro','src/pages/privacy.astro','src/pages/terms.astro','src/pages/legal/disclaimer.astro','src/pages/data-use.astro','src/pages/accessibility.astro','src/pages/security.astro','src/pages/funding-conflicts.astro','src/pages/political-neutrality.astro','src/pages/open-source.astro','data/cities/memphis_contact_guide.json'];
const missing=required.filter(f=>!fs.existsSync(f));if(missing.length)throw new Error(`Missing repair files: ${missing.join(', ')}`);
const layout=fs.readFileSync('src/layouts/BaseLayout.astro','utf8');if(!layout.includes('LegalFooter'))throw new Error('Global legal footer is not mounted.');
const wizard=fs.readFileSync('src/pages/admin/add-cities.astro','utf8');for(const token of ['Download request package','Upload and map court files','Readiness report','Memphis'])if(!wizard.includes(token))throw new Error(`Wizard missing ${token}`);
const contacts=fs.readFileSync('data/cities/memphis_contact_guide.json','utf8');for(const token of ['901-222-3200','901-222-3500'])if(!contacts.includes(token))throw new Error(`Contact guide missing ${token}`);
console.log('Repair validator passed.');
