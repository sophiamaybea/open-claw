from revenue_swarm.evaluator import evaluate, extract_reward
from revenue_swarm.learning import EvidenceLearner
from revenue_swarm.models import Opportunity


def test_reward_extraction_prefers_largest_usd_value():
    amount, text = extract_reward("low $100 high $2,500")
    assert amount == 2500
    assert text == "$2,500"


def test_objective_bounty_qualifies():
    op = Opportunity(
        id="x",
        source="github",
        source_url="https://example.com/1",
        title="[Bounty $500] Fix regression",
        body="Acceptance criteria: add tests and reproduce the bug.",
        comments=0,
    )
    result = evaluate(op)
    assert result.reward_usd == 500
    assert result.status == "QUALIFIED"
    assert result.score >= 45


def test_security_work_is_human_gated():
    op = Opportunity(
        id="x",
        source="github",
        source_url="https://example.com/2",
        title="[Bounty $500] smart contract vulnerability",
        body="Acceptance criteria and tests",
    )
    result = evaluate(op)
    assert result.requires_human_gate is True
    assert result.safety_class == "authorised-security"


def test_learning_uses_external_outcomes(tmp_path):
    learner = EvidenceLearner(tmp_path / "stats.json")
    before = learner.snapshot()
    assert before == {}

    learner.record("github-bounty", "ACCEPTED")
    stats = learner.snapshot()["github-bounty"]
    assert stats["accepted"] == 1
    assert stats["attempts"] == 1

    learner.record("github-bounty", "PAYOUT_VERIFIED", payout_usd=500)
    stats = learner.snapshot()["github-bounty"]
    assert stats["verified_revenue_usd"] == 500
    assert stats["payouts"] == 1
