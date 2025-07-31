from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("MONGO_DB_NAME")]

def create_session(session_name, pdf_path):
    return db.sessions.insert_one({
        "session_name": session_name,
        "pdf_path": pdf_path,
        "messages": []
    }).inserted_id

def add_message(session_id, sender, text):
    db.sessions.update_one(
        {"_id": session_id},
        {"$push": {"messages": {"sender": sender, "text": text}}}
    )

def get_session(session_id):
    return db.sessions.find_one({"_id": session_id})

def list_sessions():
    return list(db.sessions.find({}, {"session_name": 1}))
