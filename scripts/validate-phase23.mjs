import fs from 'node:fs'; import path from 'node:path';
const root=process.cwd(); const must=[
'data/fixtures/judges.json','data/fixtures/cases.json','data/sources/source_registry.json','data/methodology/versions.json','data/health/system_health.json','src/db/schema.ts','migrations/0001_phase3_foundation.sql','src/lib/fixtures.ts','src/components/JudgeCard.astro','src/components/ScoreBadge.astro','src/pages/api/search/index.ts','src/pages/api/admin/status.ts','public/downloads/cases-fixture.csv','public/downloads/cases-fixture.json','public/downloads/cases-fixture.parquet','public/downloads/manifest.json'];
const missing=must.filter(f=>!fs.existsSync(path.join(root,f))); if(missing.length){console.error('Phase 2/3 missing:\n'+missing.join('\n'));process.exit(1)}
for(const f of ['data/fixtures/judges.json','data/fixtures/cases.json','data/sources/source_registry.json','data/methodology/versions.json','data/health/system_health.json','public/downloads/manifest.json']) JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const cases=JSON.parse(fs.readFileSync(path.join(root,'data/fixtures/cases.json'),'utf8')); if(cases.some(c=>!c.publicCaseNumber.startsWith('FX-'))) throw new Error('Fixture case identifiers must use FX- prefix');
const pages=['src/pages/index.astro','src/pages/judges.astro','src/pages/compare.astro','src/pages/cases.astro','src/pages/methodology.astro','src/pages/data.astro','src/pages/data-sources.astro','src/pages/governance.astro','src/pages/add-cities.astro'];
for(const f of pages){const t=fs.readFileSync(path.join(root,f),'utf8'); if(!t.includes('BaseLayout')) throw new Error(`${f} missing BaseLayout`)}
console.log(`Phase 2/3 validation passed (${must.length} capability artifacts, ${pages.length} public routes).`);
