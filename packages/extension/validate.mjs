#!/usr/bin/env node
/**
 * Run data validation to ensure all Travian building data is accurate
 */

import { DataValidator } from './src/tests/validate-data.js';

console.log('Running Travian data validation...\n');

const validator = new DataValidator();
validator.runAll();

console.log('\nValidation complete. Check output above for any errors.');
console.log('If errors found, update travian-constants.ts with correct values.');
