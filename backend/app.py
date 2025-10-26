# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS 
import os
from dotenv import load_dotenv # <--- ADD THIS LINE

# --- LOAD ENV VARIABLES ---
load_dotenv() # <--- ADD THIS LINE (Loads the .env file)

# Import your core processing function from verifier.py
from verifier import process_claim
# --- 1. Initialize Flask App ---
app = Flask(__name__)

# --- 2. Enable CORS ---
# This allows any frontend (e.g., your local Streamlit demo) to access the API.
# For production, you would restrict origins (e.g., origins=["https://your-frontend.com"])
CORS(app)

# --- Configuration & Setup ---
# Load the API key from the environment variable set in your terminal
# This is a good practice for security.
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("FATAL: GEMINI_API_KEY environment variable is not set.")
    # In a real app, you'd exit or refuse to start. For now, we'll run but log the warning.

# --- 3. API Route Definition ---
@app.route('/medverify/check', methods=['POST'])
def check_claim():
    """
    Handles POST requests with user input (text or URL) and runs the MedVerify workflow.
    """
    # Expects JSON data: {"input": "The claim text or URL"}
    data = request.get_json() 
    raw_input = data.get('input')
    
    if not raw_input:
        return jsonify({"error": "No input provided. Please enter a text or URL."}), 400
    
    print(f"--- Processing new input: {raw_input[:50]}...") # Log start of processing
    
    try:
        # Call the main processing function defined in verifier.py
        result = process_claim(raw_input)
        
        # Log successful completion and return the structured result
        print("--- Processing complete. Returning result.")
        return jsonify(result), 200
        
    except Exception as e:
        # Catch any unexpected errors in the pipeline and return a 500 status
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
    # You will need to install Flask-CORS: pip install flask-cors
    app.run(debug=True, port=5000)