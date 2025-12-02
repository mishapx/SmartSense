const express = require('express');
const router = express.Router();

const latestTelemetry = {}; // store last received data for each device

router.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

// Save real telemetry from device/simulator
router.post('/telemetry', (req, res) => {
  latestTelemetry[req.body.deviceId] = {
    ...req.body,
    timestamp: new Date().toISOString()
  };
  console.log('Telemetry received:', latestTelemetry[req.body.deviceId]);
  res.json({ ok: true });
});

// Provide recommendation based on last telemetry
router.get('/recommendation/:deviceId', (req, res) => {
  const deviceId = req.params.deviceId;
  const data = latestTelemetry[deviceId];

  if (!data) {
    return res.status(404).json({ error: "No telemetry data for this device yet" });
  }

  const advice = [];

  if (data.temperature > 28) advice.push("🪟 Open windows to cool down the room.");
  if (data.temperature < 18) advice.push("🔥 Increase heating to maintain comfort.");
  if (data.humidity > 70) advice.push("📉 Use a dehumidifier or reduce moisture.");
  if (data.humidity < 30) advice.push("💧 Turn on humidifier to improve air moisture.");
  if (data.airQuality > 1000) advice.push("🚪 Ventilate the room to improve air quality.");
  if (data.airQuality > 1500) advice.push("⚠ Avoid staying long, air seriously polluted!");

  if (advice.length === 0) {
    advice.push("👍 Air conditions are good.");
  }

  res.json({
    deviceId,
    currentValues: data,
    recommendations: advice
  });
});

module.exports = router;
