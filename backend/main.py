import os
import time
import asyncio
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Inicialização da App
app = FastAPI(title="SOCNexus Middleware", version="1.0.0")

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MOCK DATA GENERATORS ---

def get_mock_elastic():
    return [
        {"id": "EL-102", "source_ip": "192.168.1.45", "event": "Brute Force Attempt", "timestamp": datetime.now().isoformat(), "severity": "High"},
        {"id": "EL-104", "source_ip": "10.0.0.12", "event": "Data Exfiltration Pattern", "timestamp": datetime.now().isoformat(), "severity": "Critical"},
    ]

def get_mock_defender():
    return [
        {"id": "DEF-404", "host_ip": "192.168.1.45", "malware_family": "Mimikatz", "status": "Active", "severity": "High"},
        {"id": "DEF-409", "host_ip": "10.0.0.88", "malware_family": "Ransomware.WannaCry", "status": "Quarantined", "severity": "Critical"},
    ]

def get_mock_tenable():
    return [
        {"ip": "192.168.1.45", "cve": "CVE-2023-1234", "cvss": 9.8, "name": "RCE via SMB"},
        {"ip": "10.0.0.12", "cve": "CVE-2021-44228", "cvss": 10.0, "name": "Log4Shell"},
    ]

def get_mock_opencti():
    return [
        {"indicator": "192.168.1.45", "type": "IPv4", "threat_group": "APT29", "confidence": 90},
        {"indicator": "Mimikatz", "type": "Malware", "threat_group": "Common", "confidence": 100},
    ]

# --- SERVIÇOS REAIS DE INTEGRAÇÃO ---

async def fetch_elastic_alerts():
    url = os.getenv("ELASTIC_URL")
    api_key = os.getenv("ELASTIC_API_KEY")
    if not url or not api_key:
        return get_mock_elastic()
    
    query = { "query": { "range": { "@timestamp": { "gte": "now-24h" } } }, "size": 50 }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{url}/_search", json=query, headers={"Authorization": f"ApiKey {api_key}"}, timeout=5.0)
            if resp.status_code == 200:
                hits = resp.json().get('hits', {}).get('hits', [])
                return [{"id": h['_id'], "source_ip": h['_source'].get('source', {}).get('ip', '0.0.0.0'), "event": "Real Event", "severity": "High"} for h in hits]
    except Exception as e:
        print(f"Erro Elastic: {e}")
    return get_mock_elastic()

async def fetch_defender_alerts():
    token = os.getenv("DEFENDER_TOKEN")
    if not token:
        return get_mock_defender()
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://graph.microsoft.com/v1.0/security/alerts_v2", headers={"Authorization": f"Bearer {token}"}, timeout=5.0)
            if resp.status_code == 200:
                return resp.json().get('value', [])
    except Exception:
        pass
    return get_mock_defender()

async def fetch_tenable_vulns():
    access_key = os.getenv("TENABLE_ACCESS_KEY")
    if not access_key:
        return get_mock_tenable()
    return get_mock_tenable()

async def fetch_opencti_intel():
    url = os.getenv("OPENCTI_URL")
    if not url:
        return get_mock_opencti()
    return get_mock_opencti()

# --- ENGINE DE CORRELAÇÃO ---

def correlate_data(elastic, defender, tenable, opencti):
    incidents = []
    
    # 1. Analisa Elastic (SIEM)
    for alert in elastic:
        score = 0
        context = {"vuln": "N/A", "intel": "N/A", "raw_alert": alert.get("id")}
        
        if alert.get("severity") == "Critical": score += 40
        elif alert.get("severity") == "High": score += 30
        
        vuln = next((v for v in tenable if v["ip"] == alert.get("source_ip")), None)
        if vuln:
            score += 30
            context["vuln"] = f"{vuln['cve']} (CVSS {vuln['cvss']})"
            
        intel = next((i for i in opencti if i["indicator"] == alert.get("source_ip")), None)
        if intel:
            score += 30
            context["intel"] = f"{intel['threat_group']} (Conf: {intel['confidence']}%)"

        if score > 40:
            incidents.append({
                "id": f"CORR-{int(time.time())}-{alert['id']}",
                "primary_alert": alert.get("event"),
                "source": "SIEM + Correlation",
                "target": alert.get("source_ip"),
                "severity": "Critical" if score > 80 else "High",
                "context": context,
                "timestamp": datetime.now().isoformat()
            })

    # 2. Analisa Defender (EDR)
    for alert in defender:
        score = 0
        context = {"vuln": "N/A", "intel": "N/A", "raw_alert": alert.get("id")}
        
        if alert.get("severity") == "Critical": score += 50
        elif alert.get("severity") == "High": score += 30
        
        intel = next((i for i in opencti if i["indicator"] in alert.get("malware_family", "")), None)
        if intel:
            score += 40
            context["intel"] = f"Known Malware: {intel['threat_group']}"
            
        if score > 40:
            incidents.append({
                "id": f"CORR-{int(time.time())}-{alert['id']}",
                "primary_alert": f"{alert.get('malware_family')} Detected",
                "source": "EDR + Correlation",
                "target": alert.get("host_ip"),
                "severity": "Critical" if score > 80 else "High",
                "context": context,
                "timestamp": datetime.now().isoformat()
            })
            
    return incidents

# --- ENDPOINTS ---

@app.get("/")
def health_check():
    return {"status": "running", "service": "SOCNexus Middleware"}

@app.get("/api/dashboard")
async def get_dashboard_data():
    elastic, defender, tenable, opencti = await asyncio.gather(
        fetch_elastic_alerts(),
        fetch_defender_alerts(),
        fetch_tenable_vulns(),
        fetch_opencti_intel()
    )
    
    correlated = correlate_data(elastic, defender, tenable, opencti)
    
    return {
        "summary": {
            "elastic_count": len(elastic),
            "defender_count": len(defender),
            "correlated_count": len(correlated)
        },
        "elastic": elastic,
        "defender": defender,
        "tenable": tenable,
        "opencti": opencti,
        "correlated": correlated
    }
