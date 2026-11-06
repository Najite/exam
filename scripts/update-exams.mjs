import fs from 'fs';
import path from 'path';
import { initialExams } from './src/lib/seed-data';

const file = path.join(process.cwd(), 'data/exams.json');
fs.writeFileSync(file, JSON.stringify(initialExams, null, 2), 'utf-8');
console.log('Successfully updated data/exams.json with biblical seed exams');

