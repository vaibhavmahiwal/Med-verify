# verifier.py
import requests
from bs4 import BeautifulSoup
import spacy
from google import genai
from google.genai import types
import json
import re
import os # To retrieve the API key from environment

# --- Initialize Global Components ---
try:
    # Initialize the LLM client (Stage 2/3)
    # The client automatically picks up the GEMINI_API_KEY from environment
    client = genai.Client()
    
    # Initialize the NLP model (Stage 1) - Used later for NER
    nlp = spacy.load("en_core_web_sm")
    
except Exception as e:
    print(f"FATAL ERROR: Failed to initialize AI/NLP components: {e}")
    # Exit or handle gracefully in a real application

# --- Helper Function: Source Trust (Stage 4) ---
def get_source_trust_score(url_domain: str) -> float:
    """Assigns a quantifiable trust score to the source domain."""
    
    # Basic rule-based scoring for the hackathon MVP
    domain = url_domain.lower()
    
    # High Trust
    if re.search(r'(nih\.gov|who\.int|cdc\.gov|mayoclinic\.org|pubmed|nejm)', domain):
        return 0.9
    # Medium Trust (Major News/Academic)
    elif re.search(r'(nytimes\.com|bbc\.com|wikipedia\.org|university)', domain):
        return 0.6
    # Low Trust (Social/Blogs)
    elif re.search(r'(facebook|twitter|instagram|tiktok|blogspot|remedies-today)', domain):
        return 0.2
    # Default/Unknown
    return 0.5


# --- Stage 0: Input Pre-processing (URL Handling) ---
def fetch_url_content(url):
    """Fetches and cleans the main text from a URL."""
    # (Implementation remains the same as previously defined)
    try:
        if not url.startswith('http'):
            raise ValueError("Invalid URL format.")
            
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        main_content = []
        for tag in soup.find_all(['p', 'article', 'main']):
            text = tag.get_text(separator=' ', strip=True)
            if len(text) > 50: 
                main_content.append(text)
        
        return " ".join(main_content) if main_content else soup.get_text(separator=' ', strip=True)
        
    except requests.exceptions.RequestException as e:
        return f"Error fetching URL: {e}"
    except Exception as e:
        return f"Error parsing content: {e}"


# --- Stage 2 & 3: HYBRID RAG & LLM JUDGMENT CORE ---
def get_grounded_verdict(claim: str) -> dict:
    """
    Uses Gemini 2.5 Flash with Google Search for grounded, structured verification.
    """
    
    # 1. Define the desired structured output (Schema is the "Contract")
    response_schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "verdict": types.Schema(
                type=types.Type.STRING,
                description="The classification: 'Contradicted', 'Supported', or 'Unsupported/Neutral'."
            ),
            "trusted_source": types.Schema(
                type=types.Type.STRING,
                description="The name of the most credible source found (e.g., 'NIH', 'WHO', 'PubMed')."
            ),
            "reasoning": types.Schema(
                type=types.Type.STRING,
                description="A concise, one-sentence summary of the evidence found."
            ),
            "score_base": types.Schema(
                type=types.Type.INTEGER,
                description="A base score from 10 (False) to 90 (True) before Source Trust is applied."
            )
        },
        required=["verdict", "trusted_source", "reasoning", "score_base"]
    )
    
    # 2. Define the System Instruction (The LLM's Role)
    system_instruction = (
        "You are an expert medical misinformation classifier. Your task is to analyze the user's claim against "
        "the current scientific consensus using the 'google_search' tool. "
        "DO NOT use your internal knowledge. You MUST respond with a JSON object that adheres strictly to the provided schema. "
        "Classify the claim based ONLY on the search results."
    )
    
    # 3. Configure the API Call for Grounding and Structured Output
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        tools=[{"google_search": {}}], # Enables the RAG/Grounding tool
        response_mime_type="application/json",
        response_schema=response_schema
    )
    
    # 4. Execute the Call
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[f"Medical Claim to Verify: {claim}"],
            config=config
        )
        
        # 5. Parse the JSON output
        verdict_data = json.loads(response.text)
        return verdict_data
        
    except Exception as e:
        return {
            "verdict": "ERROR", 
            "trusted_source": "API Failure", 
            "reasoning": f"Gemini API call failed: {e}", 
            "score_base": 0
        }

# --- Main Workflow Function (Modified for Integration) ---

def process_claim(raw_input):
    """Executes the full 5-Stage Hybrid Misinformation Workflow."""
    
    # 0. INPUT PRE-PROCESSING (Stage 0)
    source_origin = "User-submitted Text"
    source_trust_score = 0.5 
    
    if raw_input.startswith('http'):
        clean_text = fetch_url_content(raw_input)
        
        # Extract the domain for trust scoring
        match = re.search(r'//(.*?)/', raw_input)
        domain = match.group(1) if match else raw_input
        source_origin = raw_input
        source_trust_score = get_source_trust_score(domain)
    else:
        clean_text = raw_input
    
    if "Error" in clean_text:
        return {"result": "Failed to process input.", "details": clean_text}

    # 1. NLP & CLAIMS (Skipping detailed NER for now, checking the whole text)
    claim_to_check = clean_text 

    # 2. & 3. RAG & LLM JUDGMENT
    llm_verdict = get_grounded_verdict(claim_to_check)
    
    # 4. & 5. FEATURE ENGINEERING & SCORING (Stage 4 & 5)
    score_base = llm_verdict.get('score_base', 0)
    
    # Scoring Logic: Penalize Contradicted claims heavily if the source is not trusted
    if llm_verdict['verdict'] == 'Contradicted':
        # Low trust score (e.g., 0.2) means the penalty factor is high (0.8 * 40 = 32)
        # High trust score (e.g., 0.9) means penalty factor is low (0.1 * 40 = 4)
        penalty_factor = (1 - source_trust_score) * 40 
        final_score = max(10, score_base - penalty_factor)
    else:
        # For Supported/Neutral claims, rely mostly on the LLM's conviction score
        final_score = score_base
        
    final_score = min(100, max(0, round(final_score))) 

    # --- Final Output ---
    return {
        "credibility_score": final_score,
        "llm_judgment": llm_verdict.get('verdict', 'N/A'),
        "trusted_reference": llm_verdict.get('trusted_source', 'N/A'),
        "reasoning": llm_verdict.get('reasoning', 'No specific reasoning provided.'),
        "source_origin": source_origin,
        "claims_processed": 1,
        "debug_message": "LLM call is live and grounded with Google Search. Next: Test API."
    }