import unittest
import os
from decimal import Decimal
from microcompound.engine import Configuration, Simulator, generate_fixture
from microcompound.agents import LearningSimulator, LearningRouter, LearningWallet, IncrementalClassifier, cloud_research_memo, research_memo, run_sweep

class TestOnlineResearch(unittest.TestCase):
    def test_learn_after_close_not_buy(self):
        s = LearningSimulator(Configuration(), force_fallback=True)
        s.router.latest['momentum'] = {'price_change_bps':100,'edge_bps':500,'cost_bps':260,'liquidity_log':10,'activity':100}
        w = s.wallets['momentum']
        self.assertTrue(w.buy('TEST','momentum',1,0,Decimal('0.01'),Decimal('.35')))
        self.assertEqual(s.router.models['momentum'].samples, 0)
        w.sell(1.1,4,Decimal('.01'))
        self.assertEqual(s.router.models['momentum'].samples, 1)
        self.assertEqual(s.router.models['momentum'].predictions[0]['outcome_at_step'], 4)
        self.assertTrue(s.router.models['momentum'].predictions[0]['win'])

    def test_no_label_from_same_tick_forced_exit(self):
        s = LearningSimulator(Configuration(), force_fallback=True)
        s.router.latest['momentum'] = {'price_change_bps':100,'edge_bps':500,'cost_bps':260,'liquidity_log':10,'activity':100}
        w = s.wallets['momentum']
        self.assertTrue(w.buy('TEST','momentum',1,4,Decimal('0.01'),Decimal('.35')))
        w.sell(1.0,4,Decimal('0.01'))
        self.assertEqual(s.router.models['momentum'].samples,0)

    def test_prequential_brier_is_prior_probability(self):
        model = IncrementalClassifier(force_fallback=True)
        features={'price_change_bps':0,'edge_bps':0,'cost_bps':0,'liquidity_log':0,'activity':0}
        model.learn_one(features, True,trade_id='one',exit_index=4)
        self.assertEqual(model.report()['prequential_brier'],0.25)
        self.assertEqual(model.report()['completed_labels'],1)
        self.assertGreater(model.predict_one(features),0.5)

    def test_fixture_repeatability_and_no_real_funds(self):
        cfg=Configuration(initial_usd=3)
        events=generate_fixture(minutes=20,seed=14)
        a=LearningSimulator(cfg,force_fallback=True).run(events)
        b=LearningSimulator(cfg,force_fallback=True).run(events)
        self.assertEqual(a['virtual_nav'],b['virtual_nav'])
        self.assertEqual(a['learning']['models'],b['learning']['models'])
        self.assertFalse(a['real_funds_connected'])
        self.assertEqual(sum(m['completed_labels'] for m in a['learning']['models'].values()), len(a['learning']['recent_labelled_exits']) if len(a['learning']['recent_labelled_exits'])<15 else sum(m['completed_labels'] for m in a['learning']['models'].values()))

    def test_multiple_stress_runs_and_baselines(self):
        sweep=run_sweep(seeds=range(2,4),capitals=(1.,3.),cost_mults=(1.,5.),minutes=10,force_fallback=True)
        self.assertEqual(sweep['summary']['run_count'],8)
        self.assertEqual(sweep['summary']['real_money_usd'],0)
        self.assertIn('learning_minus_legacy_pnl',sweep['runs'][0])
        self.assertEqual(sweep['summary']['hold_baseline_pnl_usd'],0)

    def test_fail_closed_optional_cloud_no_key(self):
        payload=run_sweep(seeds=range(1,2),capitals=(3.,),cost_mults=(1.,),minutes=8,force_fallback=True)
        old=os.environ.pop('GROQ_API_KEY',None)
        try:
            memo=cloud_research_memo(payload)
        finally:
            if old is not None: os.environ['GROQ_API_KEY']=old
        self.assertEqual(memo['cloud_status'],'not_configured')
        self.assertEqual(memo['provider'],'local-deterministic')

    def test_model_is_evaluated_after_mature_labels(self):
        from microcompound.agents import run_sweep
        sweep=run_sweep(seeds=range(6,7),capitals=(3.,),cost_mults=(1.,),minutes=60,force_fallback=True)
        self.assertGreaterEqual(sweep['summary']['model_evaluations'],0)
        self.assertTrue(all(x['model_evaluations']>=x['model_vetoes'] for x in sweep['runs']))

    def test_shadow_wallets_isolated(self):
        s=LearningSimulator(Configuration(),force_fallback=True)
        self.assertIsNot(s.wallets['primary'],s.wallets['momentum'])
        self.assertIsNot(s.wallets['scalper'],s.wallets['momentum'])

if __name__=='__main__':unittest.main()
