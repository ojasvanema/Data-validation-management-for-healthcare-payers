from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database.session import init_db
from .api.routes import router

app = FastAPI(title="VERA — Validation & Enrichment for Reliable Access", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB on startup
@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(router)
