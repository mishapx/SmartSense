import paho.mqtt.client as mqtt
import os
from db import get_conn

# Safe defaults if environment variables are missing
MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))


def on_connect(client, userdata, flags, reason_code, properties=None):
    if reason_code == 0:
        print(f"[MQTT] Connected to {MQTT_HOST}:{MQTT_PORT}")
        client.subscribe("smartsense/#")
        print("[MQTT] Subscribed to smartsense/#")
    else:
        print(f"[MQTT] Connection failed: {reason_code}")


def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode()
        print(f"[MQTT] Received → {msg.topic}: {payload}")

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO measurements (topic, value) VALUES (%s, %s)",
            (msg.topic, payload),
        )
        conn.commit()
        cur.close()
        conn.close()

        print("[DB] Saved to database")

    except Exception as e:
        print("[ERROR] MQTT message processing error:", str(e))


def start_mqtt():
    print("[MQTT] Starting MQTT client...")

    client = mqtt.Client(protocol=mqtt.MQTTv5)

    # assign callbacks
    client.on_connect = on_connect
    client.on_message = on_message

    try:
        client.connect(MQTT_HOST, MQTT_PORT)
        client.loop_start()
        print("[MQTT] Loop started")

    except Exception as e:
        print("[ERROR] MQTT connection failed:", str(e))
        raise
