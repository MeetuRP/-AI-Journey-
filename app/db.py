from pymongo import MongoClient
import os
from dotenv import load_dotenv

# ✅ Load MongoDB credentials
load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("MONGO_DB_NAME")]

# ✅ Create a new session
def create_session(session_name, pdf_path=None):
    return db.sessions.insert_one({
        "session_name": session_name,
        "pdf_path": pdf_path,
        "web_text": None,
        "messages": []
    }).inserted_id

# ✅ Add a message to session
def add_message(session_id, sender, text):
    db.sessions.update_one(
        {"_id": session_id},
        {"$push": {"messages": {"sender": sender, "text": text}}}
    )

# ✅ Get session data
def get_session(session_id):
    return db.sessions.find_one({"_id": session_id})

# ✅ List all sessions
def list_sessions():
    return list(db.sessions.find({}, {"session_name": 1}))

# ✅ Update session with file or web text
def update_session_file(session_id, pdf_path=None, web_text=None):
    update_fields = {}
    if pdf_path:
        update_fields["pdf_path"] = pdf_path
        update_fields["web_text"] = None
    elif web_text:
        update_fields["web_text"] = web_text
        update_fields["pdf_path"] = None

    if not update_fields:
        return  # Avoid empty update

    db.sessions.update_one(
        {"_id": session_id},
        {"$set": update_fields}
    )
