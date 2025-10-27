import requests
from bs4 import BeautifulSoup
from google import genai
from google.genai import types
import json
import re
import os 
from typing import List

# --- Imports are CORRECT for Web Scraping ---
from proxy_manager import get_random_http_proxy 
from nlp_processor import extract_key_medical_terms, analyze_text_style 

# --- NEW: Import DB utility for persistence ---
from db_utils import save_verified_claim 

# --- Initialize Global Components ---
try:
    # Initialize the LLM client once (required for the global scope)
    client = genai.Client()
except Exception as e:
    print(f"FATAL ERROR: Failed to initialize AI/LLM components: {e}")


# --- Helper Function: Source Trust (Stage 4 - Rule-Based) ---
def get_source_trust_score(url_domain: str) -> float:
    """Assigns a quantifiable trust score (0.1 to 0.9) to the source domain."""
    domain = url_domain.lower()
    if re.search(r'(nih\.gov|who\.int|cdc\.gov|mayoclinic\.org|pubmed|nejm|\.gov|\.edu)', domain):
        return 0.9
    elif re.search(r'(facebook|twitter|instagram|tiktok|blogspot|remedies-today|home-remedies)', domain):
        return 0.2
    return 0.5


# --- Stage 0: Input Pre-processing (fetch_url_content with Retry) ---
def fetch_url_content(url):
    """
    Fetches and cleans the main text from a URL using proxy rotation and retry attempts.
    """
    
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit=537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/', 
    }
    
    MAX_ATTEMPTS = 5
    
    for attempt in range(MAX_ATTEMPTS):
        proxy_address = get_random_http_proxy()
        PROXIES = { "http": proxy_address, "https": proxy_address } if proxy_address else {}

        try:
            print(f"Attempt {attempt + 1}: Connecting via {proxy_address if proxy_address else 'DIRECT'}...")
            
            response = requests.get(url, headers=HEADERS, proxies=PROXIES, timeout=15)
            response.raise_for_status() 

            # SUCCESS: HTML Parsing and Content Isolation
            soup = BeautifulSoup(response.content, 'html.parser')
            main_content = []
            
            for tag in soup.find_all(['p', 'article', 'main', 'li']): 
                text = tag.get_text(separator=' ', strip=True)
                if len(text) > 50: 
                    main_content.append(text)
            
            return " ".join(main_content) if main_content else soup.get_text(separator=' ', strip=True)
        
        except Exception as e:
            print(f"Attempt {attempt + 1} Failed. Error: {e}")
            if attempt == MAX_ATTEMPTS - 1:
                print("CRITICAL: All proxy attempts exhausted.")
                return f"Web Scrape failed: All attempts exhausted. Final Error: {e}"
            continue 

    return "Web Scrape failed: Unknown error after retries."


# --- Stage 2 & 3: HYBRID RAG & LLM JUDGMENT CORE (Updated Signature) ---
def get_grounded_verdict(claim: str, search_terms: List[str], client: genai.Client) -> dict:
    """Executes the LLM judgment, using NER terms to focus the RAG query."""
    
    if search_terms:
        search_query = f"Verify claim: {claim}. Focus search terms: {' AND '.join(search_terms)}"
    else:
        search_query = f"Verify claim: {claim}."

    response_schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "verdict": types.Schema(type=types.Type.STRING, description="The classification: 'Contradicted', 'Supported', or 'Unsupported/Neutral'."),
            "trusted_source": types.Schema(type=types.Type.STRING, description="The name of the most credible source found (e.g., 'NIH', 'WHO')."),
            "reasoning": types.Schema(type=types.Type.STRING, description="A concise, one-sentence summary of the evidence found."),
            "score_base": types.Schema(type=types.Type.INTEGER, description="A base score from 10 (False) to 90 (True) before Source Trust is applied.")
        },
        required=["verdict", "trusted_source", "reasoning", "score_base"]
    )
    
    system_instruction = (
        "You are an expert medical misinformation classifier. Your task is to analyze the user's claim against "
        "the current scientific consensus using Google Search to look up the provided query. You MUST use a precise query. "
        "DO NOT use your internal knowledge. You MUST respond with a JSON object that adheres strictly to the provided schema. "
        "Classify the claim based ONLY on the search results."
    )
    
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        response_mime_type="application/json",
        response_schema=response_schema
    )
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[search_query], 
            config=config
        )
        verdict_data = json.loads(response.text)
        return verdict_data
        
    except Exception as e:
        return {
            "verdict": "ERROR", 
            "trusted_source": "API Failure", 
            "reasoning": f"Gemini API call failed: {e}", 
            "score_base": 0
        }


# --- Main Workflow Function (FINAL STABLE LOGIC) ---

def process_claim(raw_input):
    """
    Executes the full 5-Stage Hybrid Misinformation Workflow.
    """
    
    # Initialize client locally here for robustness against environment issues
    try:
        gemini_client = genai.Client()
    except Exception:
        gemini_client = None

    source_origin = "User-submitted Text"
    source_trust_score = 0.5 
    clean_text = raw_input
    
    # 0. INPUT PRE-PROCESSING (Stage 0)
    if raw_input.startswith('http'):
        
        # --- ATTEMPT LIVE SCRAPE WITH ROTATION ---
        clean_text = fetch_url_content(raw_input) 
        
        if "Web Scrape failed" in clean_text:
            print("WARNING: Scraping failed. Falling back to URL string analysis.")
            clean_text = raw_input 
            
        match = re.search(r'//(.*?)/', raw_input)
        domain = match.group(1) if match else raw_input
        source_origin = raw_input
        source_trust_score = get_source_trust_score(domain)
        
    else:
        # --- RAW TEXT INPUT (Linguistic Analysis) ---
        clean_text = raw_input
        
        if gemini_client:
            linguistic_penalty = analyze_text_style(raw_input, gemini_client) 
        else:
            linguistic_penalty = 0.0
            
        source_trust_score = 0.5 - linguistic_penalty
        source_trust_score = max(0.1, source_trust_score)
        source_origin = "User-submitted Text (Linguistically Assessed)"
        
    # 1. NLP & CLAIMS (Stage 1)
    search_terms = extract_key_medical_terms(clean_text) 
    
    # 2. & 3. RAG & LLM JUDGMENT
    if gemini_client:
        llm_verdict = get_grounded_verdict(clean_text, search_terms, gemini_client)
    else:
         llm_verdict = {
            "verdict": "ERROR", 
            "trusted_source": "API Unavailable", 
            "reasoning": "AI client failed to initialize due to missing API Key.", 
            "score_base": 0
        }
    
    # 4. & 5. FEATURE ENGINEERING & SCORING 
    score_base = llm_verdict.get('score_base', 0)
    
    if llm_verdict.get('verdict') == 'Contradicted':
        penalty_factor = (1 - source_trust_score) * 40 
        final_score = max(10, score_base - penalty_factor)
    else:
        final_score = score_base
        
    final_score = min(100, max(0, round(final_score))) 

    # --- Final Output ---
    final_result = {
        "credibility_score": final_score,
        "llm_judgment": llm_verdict.get('verdict', 'N/A'),
        "trusted_reference": llm_verdict.get('trusted_source', 'N/A'),
        "reasoning": llm_verdict.get('reasoning', 'No specific reasoning provided.'),
        "source_origin": source_origin,
        "claims_processed": 1,
        "extracted_terms": search_terms,
        "debug_message": "Full 5-Stage pipeline executed with stability fallback."
    }
    
    # --- Persistence: Save result to MongoDB ---
    try:
        from db_utils import save_verified_claim 
        
        # CRITICAL FIX: Only save if the AI verdict was NOT an error
        # This prevents the corrupted error dictionary from crashing the DB driver
        if final_result.get('llm_judgment') != 'ERROR':
            save_verified_claim(final_result) 
        else:
            print("WARNING: Skipping DB save. AI processing failed.")
            
    except Exception as e:
        print(f"WARNING: Could not save result to DB. Error: {e}")

    return final_result
