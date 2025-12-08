import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

# --- Database Init ---

DB_NAME = "healthcare.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    # Create Batches Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS batches (
            id TEXT PRIMARY KEY,
            status TEXT,
            analysis_result JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create Jobs Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            batch_id TEXT,
            status TEXT,
            provider_data JSON,
            result_state JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(batch_id) REFERENCES batches(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized.")

def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

# --- Batches ---

def create_batch(batch_id: str, count: int) -> str:
    conn = get_connection()
    c = conn.cursor()
    c.execute("INSERT INTO batches (id, status) VALUES (?, ?)", (batch_id, "processing"))
    conn.commit()
    conn.close()
    return batch_id

def update_batch_analysis(batch_id: str, analysis: Dict[str, Any]):
    conn = get_connection()
    c = conn.cursor()
    c.execute("UPDATE batches SET analysis_result = ? WHERE id = ?", (json.dumps(analysis, default=json_serial), batch_id))
    conn.commit()
    conn.close()

def get_batch(batch_id: str) -> Dict[str, Any]:
    conn = get_connection()
    c = conn.cursor()
    
    batch = c.execute("SELECT * FROM batches WHERE id = ?", (batch_id,)).fetchone()
    if not batch:
        conn.close()
        return None
        
    jobs = c.execute("SELECT * FROM jobs WHERE batch_id = ?", (batch_id,)).fetchall()
    
    job_ids = [j["id"] for j in jobs]
    
    analysis_result = None
    if batch["analysis_result"]:
        try:
             analysis_result = json.loads(batch["analysis_result"])
        except:
             pass
    
    conn.close()
    return {
        "id": batch["id"],
        "status": batch["status"],
        "analysis_result": analysis_result,
        "job_ids": job_ids,
        "jobs_data": [dict(j) for j in jobs]
    }

# --- Jobs ---

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, BaseModel):
        return obj.dict()
    raise TypeError(f"Type {type(obj)} not serializable")

def create_job(job_id: str, batch_id: str, provider_data: Dict[str, Any]):
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        INSERT INTO jobs (id, batch_id, status, provider_data) 
        VALUES (?, ?, ?, ?)
    ''', (job_id, batch_id, "processing", json.dumps(provider_data, default=json_serial)))
    conn.commit()
    conn.close()

def update_job_result(job_id: str, result_state: Dict[str, Any]):
    conn = get_connection()
    c = conn.cursor()
    c.execute('''
        UPDATE jobs 
        SET status = ?, result_state = ?
        WHERE id = ?
    ''', ("completed", json.dumps(result_state, default=json_serial), job_id))
    conn.commit()
    conn.close()

def get_all_jobs_summary():
    conn = get_connection()
    c = conn.cursor()
    jobs = c.execute("SELECT status, result_state FROM jobs").fetchall()
    conn.close()
    return [dict(j) for j in jobs]
