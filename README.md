SmartSense – IoT Cloud Computing Project
Problem
In modern households and small offices, people often remain unaware of the quality of the air they breathe or the surrounding environmental conditions. Poor air quality, high humidity, or excessive temperature can affect health, productivity, and comfort.
 Existing solutions are often expensive, lack cloud integration, or do not provide real-time alerts and analytics.
Solution
SmartSense is an innovative IoT-based environmental monitoring system designed to make smart indoor air management accessible and affordable.
Each SmartSense IoT device is equipped with sensors that measure:
Temperature
Humidity
Air quality (e.g., CO₂, VOCs, PM2.5)

The device sends data at regular intervals to a cloud backend hosted on Microsoft Azure, where it is processed, stored, and made available through a REST API.
 Users can access the data via a web or mobile dashboard, view historical trends, and receive alerts if environmental parameters exceed healthy thresholds.
How It Works
IoT Device / Simulator
Collects environmental data and sends it to the backend via HTTP requests (or MQTT).
Can receive control commands, such as “change sampling rate” or “trigger recalibration”.

Cloud Backend
Receives sensor data and stores it in Azure Blob Storage.
Applies business logic for threshold detection and alerts.
Exposes a REST API for users and administrators.



User Interface (maybe)
Displays live sensor readings and trends using API data.
Allows users to manage devices and view alerts.

Project Components

1. IoT Device
- Simulates sensor data 
- Periodically sends data to the cloud backend using HTTP or MQTT
- Receives control commands or configuration updates from the backend

2. Cloud Data Storage
- **Azure Blob Storage** is used for storing device data and logs.
- Ensures scalability, reliability, and cost efficiency.

3. Backend (REST API)
- Built with **Node.js + Express** 
- Handles business logic, authentication, and data management.
- Connects to Azure Blob Storage and exposes endpoints for CRUD operations.
