import { validateCityPublication } from './lib/city-publication-validator.mjs';

const result = validateCityPublication();
console.log(`City publication PASS (${result.cityCount} city record(s)).`);
