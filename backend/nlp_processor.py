# nlp_processor.py

import spacy
from typing import List, Optional
import time
from google import genai 
from google.genai import types
import json 
import os 

# --- CRITICAL FIX: REMOVE the circular import ---
# DELETE THIS LINE: from verifier import client 

# Global variable for the spaCy model
NLP_MODEL: Optional[spacy.language.Language] = None
LOADED_TIME: Optional[float] = None

def load_nlp_model():
    """Loads the spaCy English model once for efficiency."""
    global NLP_MODEL, LOADED_TIME
    if NLP_MODEL is None:
        try:
            NLP_MODEL = spacy.load("en_core_web_sm")
            LOADED_TIME = time.time()
            print("NLP Model loaded successfully.")
        except Exception as e:
            print(f"ERROR: Could not load spaCy model. Details: {e}")
            NLP_MODEL = None
            
def extract_key_medical_terms(text: str) -> List[str]:
    """
    Uses spaCy to extract Named Entities and key nouns/adjectives 
    most relevant for a medical search query (Stage 1).
    """
    load_nlp_model()
    
    if NLP_MODEL is None:
        return ["NLP_ERROR_FALLBACK"]

    doc = NLP_MODEL(text)
    
    # Iterate over entities for labels
    key_entities = [
        ent.text for ent in doc.ents 
        if ent.label_ in ('PERSON', 'ORG', 'PRODUCT', 'GPE', 'NORP')
    ]
    
    # Simple tokenization to extract high-value nouns and adjectives
    key_tokens = [
        token.text for token in doc 
        if token.pos_ in ('NOUN', 'PROPN', 'ADJ') and len(token.text) > 2
    ]
    
    # Combine, clean, and limit the search terms
    combined_terms = set(key_entities + key_tokens)
    
    irrelevant_words = {
        "user", "text", "article", "post", "claim", "cure", 
        "remedy", "fast", "proven", "Type", "a", "the"
    }
    
    final_terms = [
        term for term in combined_terms 
        if term.lower() not in irrelevant_words
    ]
    
    # Limit the output to 5 high-quality search terms
    return list(final_terms)[:5]

# --- NEW FUNCTION: Stage 4 Linguistic Trust Inference ---
# CRITICAL FIX: Add 'client' as a parameter
def analyze_text_style(text: str, client: genai.Client) -> float: 
    """
    Uses Gemini to classify the input text for sensationalism and returns a trust penalty (0.0 to 0.4).
    """
    
    # CRITICAL FIX: Remove client initialization block and use the passed client object
    # The client object is now guaranteed to be initialized and passed from verifier.py
    
    # Define a simple schema for quick JSON output
    response_schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "sensationalism_score": types.Schema(
                type=types.Type.INTEGER,
                description="A score from 0 (Neutral/Rational) to 10 (Extreme Hype/Sensationalism)."
            )
        },
        required=["sensationalism_score"]
    )
    
    # Prompt instructing the model to act as a style critic
    prompt = (
        "Analyze the following medical claim text for sensationalism, urgency, or clickbait language. "
        "Assign a score from 0 (neutral/scientific) to 10 (extreme hype/misleading). "
        "Return ONLY the JSON object."
    )
    
    try:
        # Use the client object passed into the function
        response = client.models.generate_content(
            model='gemini-2.5-flash', # Use a fast model
            contents=[prompt + f"Text: {text}"],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema
            )
        )
        
        style_data = json.loads(response.text)
        
        # Robust check to prevent NoneType crash if parsing fails
        if not isinstance(style_data, dict):
            print(f"Error: API returned non-dict data: {response.text}")
            return 0.0
            
        sensationalism = style_data.get('sensationalism_score', 0)
        
        # Calculate Penalty: Max score of 10 maps to Max Penalty of 0.4
        penalty = (sensationalism / 10) * 0.4
        return penalty
        
    except Exception as e:
        print(f"Style analysis failed: {e}")
        # Return 0.0 penalty if the API call fails 
        return 0.0

# Call load_nlp_model() immediately when the module is imported
load_nlp_model()