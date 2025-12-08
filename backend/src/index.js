require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const mqtt = require('mqtt');

const app = express();
app.use(cors());
app.use(express.json());

// Храним последние данные
const latestTelemetry = {};
app.set('latestTelemetry', latestTelemetry);

// MQTT брокер внутри Docker-сети
const mqttUrl = process.env.MQTT_BROKER_URL || 'mqtt://mqtt-broker:1883';
const mqttClient = mqtt.connect(mqttUrl);

mqttClient.on('connect', () => {
  console.log("Connected to MQTT broker at", mqttUrl);
  mqttClient.subscribe("smartsense/+/telemetry");
});

mqttClient.on('message', (topic, payload) => {
  try {
    const [_, deviceId] = topic.split('/');
    const data = JSON.parse(payload.toString());

    latestTelemetry[deviceId] = { 
      ...data,
      deviceId,
      timestamp: new Date().toISOString()
    };

    console.log("Telemetry", deviceId, latestTelemetry[deviceId]);
  } catch (err) {
    console.error("MQTT error:", err);
  }
});

app.use('/api', routes);

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Backend running on port ${port}`);
});
