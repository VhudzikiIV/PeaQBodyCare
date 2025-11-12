const mysql = require('mysql2/promise');

async function test() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'dzika.123',
      database: 'peaqbodycare'
    });
    console.log('✅ Connection successful!');
    await connection.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

test();