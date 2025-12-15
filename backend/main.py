from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from db import get_conn
from mqtt_client import start_mqtt
from fastapi import FastAPI

app = FastAPI()

# ✅ CORS — ВАЖНО: СРАЗУ ПОСЛЕ app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MQTT стартует при запуске backend
start_mqtt()

import json
from fastapi import HTTPException


@app.get("/latest")
def latest_measurement():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT topic, value, timestamp
        FROM measurements
        ORDER BY timestamp DESC
        LIMIT 1
    """)

    row = cur.fetchone()

    cur.close()
    conn.close()

    if row is None:
        return {"message": "No data yet"}

    return {
        "topic": row[0],
        "value": row[1],
        "timestamp": row[2].isoformat()
    }

   
