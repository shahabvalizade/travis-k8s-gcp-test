const keys = require('./keys');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const { Pool } = require('pg');
const redis = require('redis');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL client
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
});

async function initPostgres() {
  try {
    await pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)');
    console.log('✅ Table "values" ensured');
  } catch (err) {
    console.error('❌ Failed to create table:', err);
    process.exit(1);
  }
}

// Redis client
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});
const redisPublisher = redisClient.duplicate();

// Routes
app.get('/', (req, res) => {
  res.send('Hi');
});

app.get('/values/all', async (req, res) => {
  try {
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows);
  } catch (err) {
    console.error('❌ Failed to fetch values:', err);
    res.status(500).send('Database error');
  }
});

app.get('/values/current', (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    if (err) {
      console.error('❌ Redis error:', err);
      return res.status(500).send('Redis error');
    }
    res.send(values);
  });
});

app.post('/values', async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  redisClient.hset('values', index, 'Nothing yet!');
  redisPublisher.publish('insert', index);

  try {
    await pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
  } catch (err) {
    console.error('❌ Insert failed:', err);
  }

  res.send({ working: true });
});

// Start server only after DB is ready
initPostgres().then(() => {
  app.listen(5000, () => {
    console.log('🚀 API server listening on port 5000');
  });
});
