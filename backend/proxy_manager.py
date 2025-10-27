# proxy_manager.py (FINAL ROBUST VERSION)
import requests
from bs4 import BeautifulSoup

def get_random_http_proxy() -> str:
    """Fetches a free HTTP proxy list and returns the first IP:PORT found."""
    
    # --- UPDATED SOURCE URL (Commonly reliable list) ---
    PROXY_LIST_URL = 'https://ProxySite.com/' 
    
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }
    
    try:
        response = requests.get(PROXY_LIST_URL, headers=HEADERS, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # --- CRITICAL FIX: Robust Table Selection (Targeting the site's known ID) ---
        table = soup.find('table', id='proxylisttable') # Target the specific ID for this site

        if not table:
            # Fallback 1: Find by partial class match
            table = soup.find('table', class_=lambda c: c and 'list' in c.lower())
        
        if not table:
            # Fallback 2: Select the very first <table> tag
            table = soup.find('table') 

        if not table:
            print("WARNING: Could not locate any <table> tag. Falling back.")
            return ""
            
        # Get the first data row (skipping the header)
        row = table.find('tbody').find('tr') 
        
        if not row:
            print("WARNING: No working proxies found in the table. Falling back.")
            return ""
            
        # Get the IP (first column) and Port (second column)
        tds = row.find_all('td')
        if len(tds) < 2:
            print("WARNING: Could not find IP and Port fields.")
            return ""

        ip = tds[0].text
        port = tds[1].text
        
        proxy_address = f"http://{ip}:{port}"
        print(f"Successfully retrieved new proxy: {proxy_address}")
        return proxy_address

    except Exception as e:
        print(f"Failed to fetch proxy list or parse table. Error: {e}")
        return ""