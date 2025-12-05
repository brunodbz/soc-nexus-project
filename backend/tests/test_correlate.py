import asyncio
import os
from pathlib import Path

import pytest

# Ensure imports resolve when running from repository root
import sys
sys.path.append(str(Path(__file__).resolve().parents[1]))

from main import (
    correlate_data,
    fetch_defender_alerts,
    fetch_elastic_alerts,
    fetch_opencti_intel,
    fetch_tenable_vulns,
    get_mock_defender,
    get_mock_elastic,
    get_mock_opencti,
    get_mock_tenable,
)


def test_correlate_elastic_enriches_context():
    elastic = [
        {
            "id": "EL-TEST",
            "source_ip": "192.168.1.50",
            "event": "Suspicious Authentication",
            "severity": "Critical",
        }
    ]
    defender = []
    tenable = [
        {"ip": "192.168.1.50", "cve": "CVE-2024-0001", "cvss": 9.9, "name": "Test Vuln"}
    ]
    opencti = [
        {
            "indicator": "192.168.1.50",
            "type": "IPv4",
            "threat_group": "APT-TEST",
            "confidence": 85,
        }
    ]

    incidents = correlate_data(elastic, defender, tenable, opencti)

    assert len(incidents) == 1
    incident = incidents[0]
    assert incident["severity"] == "Critical"
    assert "APT-TEST" in incident["context"]["intel"]
    assert "CVE-2024-0001" in incident["context"]["vuln"]
    assert incident["target"] == "192.168.1.50"


def test_correlate_defender_requires_severity_context():
    defender = [
        {
            "id": "DEF-LOW",
            "host_ip": "10.0.0.5",
            "malware_family": "Unknown.Generic",
            "severity": "High",
        }
    ]

    incidents = correlate_data([], defender, [], [])

    assert incidents == []


@pytest.mark.asyncio
async def test_fetchers_fall_back_to_mocks(monkeypatch):
    # Ensure environment variables are cleared so the mock data path is exercised
    for env_var in ["ELASTIC_URL", "ELASTIC_API_KEY", "DEFENDER_TOKEN", "TENABLE_ACCESS_KEY", "OPENCTI_URL"]:
        monkeypatch.delenv(env_var, raising=False)

    elastic = await fetch_elastic_alerts()
    defender = await fetch_defender_alerts()
    tenable = await fetch_tenable_vulns()
    opencti = await fetch_opencti_intel()

    assert {alert["id"] for alert in elastic} == {alert["id"] for alert in get_mock_elastic()}
    assert {alert["id"] for alert in defender} == {alert["id"] for alert in get_mock_defender()}
    assert {vuln["ip"] for vuln in tenable} == {vuln["ip"] for vuln in get_mock_tenable()}
    assert {intel["indicator"] for intel in opencti} == {intel["indicator"] for intel in get_mock_opencti()}
