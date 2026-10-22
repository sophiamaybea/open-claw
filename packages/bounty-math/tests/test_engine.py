import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from engine import calculate, MathError
EXAMPLES=[
 {"reward_usd":500,"acceptance_probability":.4,"eligibility_probability":.8,"cost_usd":25,"hours":5},
 {"reward_usd":300,"acceptance_probability":.7,"eligibility_probability":.6,"cost_usd":15,"hours":3},
 {"reward_usd":900,"acceptance_probability":.25,"eligibility_probability":.9,"cost_usd":80,"hours":12}
]
class Tests(unittest.TestCase):
 def test_wolfram_golden_numbers(self):
  scores=[calculate("score",x) for x in EXAMPLES]
  self.assertEqual([round(y["expected_net_usd"],6) for y in scores],[135,111,122.5])
  self.assertEqual([round(y["expected_net_per_hour_usd"],6) for y in scores],[27,37,10.208333])
 def test_portfolio_budget(self):
  out=calculate("portfolio",{"items":EXAMPLES,"hour_budget":8})
  self.assertEqual(out["selected_indexes"],[0,1])
  self.assertEqual(out["expected_net_usd"],246)
 def test_posterior(self):
  res=calculate("posterior",{"prior_alpha":1,"prior_beta":1,"verified_successes":3,"verified_failures":1})
  self.assertAlmostEqual(res["posterior_mean"],2/3)
  self.assertEqual(res["n_verified_outcomes"],4)
 def test_symbolic(self):
  res=calculate("symbolic",{"template":"ev_derivatives"})
  self.assertEqual(res["derivative_acceptance"],"e*r/h")
 def test_jev_style_label_no_fake_model(self):
  out=calculate("decision",{"candidates":[dict(label="A",**EXAMPLES[0]),dict(label="B",**EXAMPLES[1])]})
  self.assertEqual(out["choice"],"B")
  self.assertFalse(out["is_laya_model"])
  self.assertFalse(out["calibrated_probabilities"])
 def test_reject_injection(self):
  with self.assertRaises(MathError):calculate("score",{**EXAMPLES[0],"hours":"__import__('os').system('id')"})
 def test_reject_invalid_probability(self):
  with self.assertRaises(MathError):calculate("score",{**EXAMPLES[0],"acceptance_probability":1.4})
 def test_reject_workload_abuse(self):
  with self.assertRaises(MathError):calculate("portfolio",{"items":[EXAMPLES[0]]*17,"hour_budget":40})
if __name__=="__main__":unittest.main()
