require('dotenv').config();
const axios = require('axios');

function random(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

setInterval(async () => {
  const payload = {
    deviceId: process.env.DEVICE_ID,
    temperature: random(20, 35),
    humidity: random(30, 80),
    airQuality: random(300, 2000)
  };
  await axios.post(process.env.BACKEND_URL + "/api/telemetry", payload)
    .then(res => console.log("Sent:", payload, "Alerts:", res.data.alerts))
    .catch(err => console.log(err.message));
}, +process.env.INTERVAL_SECONDS * 1000);
