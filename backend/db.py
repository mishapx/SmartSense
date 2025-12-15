import psycopg2
import os

def get_conn():
    return psycopg2.connect(
        host="localhost",
        database="smartsense",
        user="smartsense_user",
        password="StrongPassword123!"
    )
