# test_api.py

import requests
import json

# Define the endpoint URL
API_ENDPOINT = "http://127.0.0.1:5000/medverify/check"

# Define the test claims
TEST_CLAIMS = [
    {
        "name": "1. Debunked Claim (Wayback Machine Test)",
        # This is the stable URL containing the known false MMR-Autism claim.
        "input": "https://web.archive.org/web/20170112184126/http://www.naturalnews.com/040189_MMR_vaccine_autism_GlaxoSmithKline.html", 
        "expected_verdict": "Contradicted" 
    },
 {
          "name": "2. user input test",
          "input": "sugar is good for health",
            "expected_verdict": "Contradicted"
 },
#     # {
#     #     "name": "Low Trust (Blog Vector)",
#     #     "input": "http://www.home-remedies-secrets.net/natural-healing",
#     #     "expected_verdict": "Contradicted" 
#     # }
 ]

def run_test(claim_data):
    """Sends a single POST request and prints the key results."""
    print(f"\n=======================================================")
    print(f"TESTING: {claim_data['name']}")
    
    payload = {"input": claim_data["input"]}
    headers = {"Content-Type": "application/json"}
    
    try:
        # Send the POST request
        response = requests.post(API_ENDPOINT, headers=headers, data=json.dumps(payload))
        response.raise_for_status()
        
        result = response.json()
        
        # Check if the Gemini API call failed
        if result.get('llm_judgment') == 'ERROR':
            print("\n❌ CRITICAL ERROR: Gemini API call failed internally.")
            print(f"   Reasoning: {result.get('reasoning', 'Unknown API or environment issue.')}")
            print("   Action: Check your API key and server logs immediately.")
            return

        # --- VERIFICATION PRINTS (Success) ---
        print("\n✅ API Response Received (Status 200 OK - Core Logic Ran)")
        print(f"  Final Score: {result.get('credibility_score', 'N/A')}/100")
        print(f"  LLM Verdict: {result.get('llm_judgment', 'N/A')}")
        print(f"  Source Origin: {result.get('source_origin', 'N/A')}")
        
        # Check for Stage 1 (NER)
        print(f"\n🧠 Stage 1 NER Output:")
        terms = result.get('extracted_terms', ['NER Output Missing from Verifier.py'])
        print(f"  Extracted Terms: {', '.join(terms)}") 

        # Check for Stage 2/3 (RAG)
        print(f"\n⭐ Stage 2/3 Grounding Output:")
        print(f"  Trusted Reference: {result.get('trusted_reference', 'N/A')}")
        print(f"  Reasoning: {result.get('reasoning', 'N/A')}")

    except requests.exceptions.RequestException as e:
        print(f"\n❌ NETWORK ERROR: Could not connect to Flask server at {API_ENDPOINT}.")
        print("   Detail: Ensure 'python app.py' is running and active in Terminal 1.")
    except json.JSONDecodeError:
        print("\n❌ JSON ERROR: Server returned non-JSON content.")
    except Exception as e:
        print(f"\n❌ UNEXPECTED PYTHON ERROR IN TEST SCRIPT: {e}")

if __name__ == "__main__":
    for claim in TEST_CLAIMS:
        run_test(claim)