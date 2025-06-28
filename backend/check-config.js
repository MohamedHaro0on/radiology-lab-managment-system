import config from './config/index.js';

console.log('Backend config:');
console.log('MongoDB URI:', config.mongodb.uri);
console.log('Environment:', config.env);
console.log('Port:', config.port); 