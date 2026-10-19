"""Run with: python -m unittest discover -s packages/agency-intelligence/tests -v"""
import importlib.util
import sys
import unittest
from pathlib import Path

MODULE = Path(__file__).resolve().parents[1] / "agency_intelligence.py"
spec = importlib.util.spec_from_file_location("agency_intelligence", MODULE)
engine = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = engine
spec.loader.exec_module(engine)


class AgencyIntelligenceTests(unittest.TestCase):
    def test_deduplicates_and_prefers_documented_faults(self):
        rows = [
            {"business_name": "A", "website": "https://a.example", "issues": "broken_booking_link"},
            {"business_name": "A", "website": "https://a.example/", "issues": "stale_copyright"},
            {"business_name": "B", "website": "https://b.example", "issues": "missing_spf"},
        ]
        result = engine.prepare_queue(rows, min_score=8)
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["service"], "Booking flow repair")
        self.assertEqual(result[0]["score"], 30)
        self.assertTrue(result[0]["needs_human_review"])

    def test_no_fake_demand_without_evidence(self):
        row = engine.rank_candidate({"business_name": "Example", "website": "https://example.com"})
        self.assertEqual(row["score"], 0)
        self.assertEqual(row["confidence"], "insufficient evidence")

    def test_sorted_multiple_observations(self):
        a = engine.rank_candidate({"website": "https://one.example", "issues": "missing_dmarc,broken_booking_link"})
        self.assertEqual(a["issues"][0], "broken_booking_link")
        self.assertEqual(a["score"], 38)

    def test_calibration_only_when_outcomes_recorded(self):
        candidate = engine.rank_candidate({"business_name": "B", "website": "https://b.example", "issues": "broken_booking_link"})
        calibrated = engine.calibrate([candidate], [])
        self.assertEqual(calibrated[0]["outcome_data_status"], "prior only, unvalidated")
        self.assertEqual(calibrated[0]["observed_attempts"], 0)
        self.assertAlmostEqual(calibrated[0]["posterior_conversion_scenario"], .05)

    def test_posterior_shrinks_small_sample(self):
        self.assertAlmostEqual(engine.posterior_conversion(0, 0), .05)
        self.assertAlmostEqual(engine.posterior_conversion(2, 20), 3/40)
        self.assertAlmostEqual(engine.posterior_conversion(10, 10), 11/30)

    def test_validates_counts(self):
        self.assertLessEqual(engine.posterior_conversion(100, 1), 1)
        self.assertEqual(engine.posterior_conversion(-2, -10), .05)

    def test_filtered_without_public_url(self):
        a = engine.prepare_queue([{"business_name": "A", "website": "example.com", "issues": "broken_booking_link"}])
        self.assertEqual(a, [])

if __name__ == "__main__":
    unittest.main()
