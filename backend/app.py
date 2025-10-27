from flask import Flask, request, jsonify, Response
from flask_cors import CORS 
from dotenv import load_dotenv
import os
from flask_pymongo import PyMongo 

# --- LOAD ENV VARIABLES (CRITICAL: Must be at the very top of app.py) ---
load_dotenv() 

# Import your core processing function from verifier.py
from verifier import process_claim 

# --- 1. Initialize Flask App ---
app = Flask(__name__)

# --- 2. Configure MongoDB ---
# Fetch the URI securely from the environment variables (from your .env file)
app.config["MONGO_URI"] = os.environ.get("MONGO_URI")

# CRITICAL CHECK: Ensure the URI was loaded
if not app.config["MONGO_URI"]:
    # If not found in .env, raise a critical error to prevent PyMongo crash
    raise ValueError("FATAL: MONGO_URI environment variable is not set in the .env file.")
    
# Initialize the PyMongo object (unconnected initially)
mongo = PyMongo()

# Finalize the MongoDB connection using init_app
mongo.init_app(app) 

# --- ADDED: SUCCESS LOG ---
print("MongoDB Atlas: Connection successful (Initialization Complete).") # Confirmation log

# --- 3. Configure Gemini API Key Check ---
# The client initialization is ALREADY handled in verifier.py (client = genai.Client()), 
# which relies on the environment variable being set by load_dotenv() above.
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    print("FATAL: GEMINI_API_KEY environment variable is not set. AI calls will fail.")

# --- 4. Enable CORS ---
CORS(app)


# --- 5. API Route Definition for Verification ---
@app.route('/medverify/check', methods=['POST'])
def check_claim():
    """
    Handles POST requests with user input (text or URL) and runs the MedVerify workflow.
    """
    data = request.get_json() 
    raw_input = data.get('input')
    
    if not raw_input:
        return jsonify({"error": "No input provided. Please enter a text or URL."}), 400
    
    print(f"--- Processing new input: {raw_input[:50]}...")
    
    try:
        # Call the main processing function
        result = process_claim(raw_input)
        
        print("--- Processing complete. Returning result.")
        return jsonify(result), 200
        
    except Exception as e:
        print(f"AN UNHANDLED ERROR OCCURRED: {e}")
        return jsonify({
            "error": "Internal server error during workflow execution.", 
            "details": str(e)
        }), 500


# --- Default Root Route (Optional but helpful for testing) ---
@app.route('/', methods=['GET'])
def home_page():
    return "Welcome to the MedVerify Backend API! POST your claims to /medverify/check"

# --- Run the App ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)
