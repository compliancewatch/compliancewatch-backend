import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/index.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('ComplianceWatch backend is running.');
});

app.listen(port, () => {
  console.log(`ComplianceWatch backend listening on port ${port}`);
});

