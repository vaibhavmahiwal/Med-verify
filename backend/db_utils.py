from datetime import datetime
from typing import Dict, Any, List
from bson import json_util # Used for serializing MongoDB objects (like ObjectId) to JSON
import json # Ensure this is imported for json.dumps
from config import mongo # <<< CRITICAL FIX: Imports 'mongo' from the central config file

# --- MongoDB Collection Name ---
# This collection will store the final verified results from the 5-stage pipeline
CLAIMS_COLLECTION = 'verified_claims_history' 

def save_verified_claim(claim_result: Dict[str, Any]) -> None:
    """
    Saves a structured claim result into the MongoDB collection.
    
    Args:
        claim_result: The final dictionary output from verifier.process_claim().
    """
    
    # --- CRITICAL FIX: VALIDATE INPUT STRUCTURE ---
    # If the input is None or not a dictionary, log the failure and exit gracefully.
    if not isinstance(claim_result, dict):
        print("MONGO DB ERROR: Input 'claim_result' is not a valid dictionary (is None or corrupt). Skipping save.")
        return
    
    # 1. Safely retrieve all necessary fields using .get()
    score = claim_result.get('credibility_score', -1) 
    
    # 2. Create the document by explicitly mapping fields
    claim_document = {
        'timestamp': datetime.utcnow(), 
        'original_input': claim_result.get('source_origin', 'N/A'),
        'credibility_score': score,
        'llm_judgment': claim_result.get('llm_judgment', 'UNKNOWN_ERROR'),
        'trusted_reference': claim_result.get('trusted_reference', 'N/A'),
        'reasoning': claim_result.get('reasoning', 'Internal error occurred.'),
        
        # Explicitly map complex list fields
        'extracted_terms': claim_result.get('extracted_terms', []),
        'debug_message': claim_result.get('debug_message', 'No debug info.'),
        
        # NOTE: All data fields are explicitly mapped here to prevent the 'NoneType' crash.
    }
    
    try:
        # Insert the document into the claims_history collection
        mongo.db[CLAIMS_COLLECTION].insert_one(claim_document)
        print(f"MongoDB: Successfully saved claim with score {score}")
    except Exception as e:
        # The connection error will be caught here if the DB link is broken.
        print(f"MONGO DB ERROR: Failed to save claim result. Details: {e}")

def get_all_claims_history() -> List[Dict[str, Any]]:
    """
    Retrieves all saved claims from the database for the Verification Gallery,
    sorted by the newest claims first.
    """
    try:
        # 1. Retrieve all documents, sort by timestamp descending (-1)
        # 2. Exclude the internal MongoDB "_id" field from the output
        cursor = mongo.db[CLAIMS_COLLECTION].find({}, {'_id': 0}).sort('timestamp', -1)
        
        # Convert the MongoDB cursor results into a simple Python list of dictionaries
        # Use json_util to correctly serialize the datetime object in the JSON
        return json.loads(json_util.dumps(list(cursor)))
    except Exception as e:
        print(f"MONGO DB ERROR: Failed to retrieve claims history. Details: {e}")
        return []
