import time
import random
import json
import paho.mqtt.client as mqtt
import os
import sys

MQTT_BROKER = os.getenv("MQTT_BROKER", "20.74.80.75")  # set env or replace
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
TOPIC = os.getenv("MQTT_TOPIC", "smartsense/sensors")
DEVICE_ID = os.getenv("DEVICE_ID", "sim-001")
RECONNECT_DELAY = 5

def on_connect(client, userdata, flags, rc, properties=None):
    print("[MQTT] connected rc=", rc)

def on_disconnect(client, userdata, rc):
    print("[MQTT] disconnected rc=", rc, "-> reconnecting in", RECONNECT_DELAY, "s")
    time.sleep(RECONNECT_DELAY)
    try:
        client.reconnect()
    except Exception as e:
        print("[MQTT] reconnect failed:", e)

client = mqtt.Client(client_id=DEVICE_ID, protocol=mqtt.MQTTv311)
client.on_connect = on_connect
client.on_disconnect = on_disconnect

# try to connect with retries
while True:
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
        break
    except Exception as e:
        print("[MQTT] connect error:", e)
        time.sleep(RECONNECT_DELAY)

client.loop_start()

def generate_reading():
    return {
        "device_id": DEVICE_ID,
        "temperature": round(random.uniform(18.0, 30.0), 1),
        "humidity": round(random.uniform(30.0, 65.0), 1),
        "pm2_5": round(random.uniform(3.0, 80.0), 1),        # µg/m3
        "co2": random.randint(380, 1600),                    # ppm
        "voc_index": round(random.uniform(0.0, 10.0), 2),    # arbitrary index
        "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

try:
    while True:
        payload = generate_reading()
        client.publish(TOPIC, json.dumps(payload))
        print("Published:", payload)
        time.sleep(2)
except KeyboardInterrupt:
    print("Stopped by user")
finally:
    client.loop_stop()
    client.disconnect()
    sys.exit(0)
