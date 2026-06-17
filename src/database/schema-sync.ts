import { dataSource, initializeDatabase } from '../config/database.js';

await initializeDatabase();
await dataSource.synchronize();
await dataSource.destroy();

console.log('TypeORM schema synchronization complete.');
