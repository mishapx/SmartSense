require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api', routes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`SmartSense backend listening on port ${port}`);
});
