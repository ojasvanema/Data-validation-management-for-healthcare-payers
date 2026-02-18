import sqlite3
import json
import datetime
from ..domain.models import FrontendProviderRecord

DB_NAME = "providers.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Store everything as JSON for now to handle nested lists/dicts easily without complex relational mapping yet
    c.execute('''CREATE TABLE IF NOT EXISTS providers
                 (id TEXT PRIMARY KEY, data TEXT)''')
    conn.commit()
    conn.close()

def save_provider(record: FrontendProviderRecord):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Upsert
    c.execute("INSERT OR REPLACE INTO providers (id, data) VALUES (?, ?)", 
              (record.id, record.json()))
    conn.commit()
    conn.close()

def get_all_providers():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT data FROM providers")
    rows = c.fetchall()
    conn.close()
    
    providers = []
    for row in rows:
        try:
            data = json.loads(row[0])
            providers.append(FrontendProviderRecord(**data))
        except Exception as e:
            print(f"Error parsing provider data: {e}")
            continue
    return providers

def get_provider(provider_id: str):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT data FROM providers WHERE id=?", (provider_id,))
    row = c.fetchone()
    conn.close()
    
    if row:
        return FrontendProviderRecord(**json.loads(row[0]))
    return None

def update_provider_status(provider_id: str, status: str):
    record = get_provider(provider_id)
    if record:
        record.status = status
        record.lastUpdated = datetime.datetime.now().isoformat()
        save_provider(record)
        return record
    return None
