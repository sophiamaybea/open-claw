import pathlib
import unittest
from decimal import Decimal
from microcompound.engine import Configuration, Simulator, Wallet, generate_fixture

class TestLedger(unittest.TestCase):
    def test_entry_exit_conserves_cash_less_fees(self):
        w=Wallet(Decimal('3'))
        self.assertTrue(w.buy('TEST','scalper',100,0,Decimal('.001'),Decimal('.35')))
        self.assertFalse(w.buy('TEST','scalper',100,0,Decimal('.001'),Decimal('.35')))
        result=w.sell(100,1,Decimal('.001'))
        self.assertIsNotNone(result)
        self.assertEqual(w.position,None)
        self.assertLess(w.cash_usd,Decimal('3'))
        self.assertAlmostEqual(float(w.cash_usd+w.total_fees),3,places=8)
    def test_no_negative_spend(self):
        w=Wallet(Decimal('.001'))
        self.assertFalse(w.buy('TEST','scalper',100,0,Decimal('.01'),Decimal('.35')))
        self.assertEqual(w.cash_usd,Decimal('.001'))
    def test_determinism(self):
        cfg=Configuration()
        events=generate_fixture(minutes=3,seed=7)
        a,b=Simulator(cfg).run(events),Simulator(cfg).run(events)
        self.assertEqual(a['virtual_nav'],b['virtual_nav'])
        self.assertEqual(a['primary_trades'],b['primary_trades'])
        self.assertFalse(a['real_funds_connected'])
        self.assertIn(a['market_data'],('synthetic-fixture',))
    def test_shadow_wallet_is_separate(self):
        s=Simulator(Configuration())
        self.assertIsNot(s.wallets['primary'],s.wallets['momentum'])
        self.assertIsNot(s.wallets['primary'],s.wallets['scalper'])
    def test_live_capability_absent(self):
        root=pathlib.Path(__file__).parents[1]/'microcompound'
        source='\n'.join(p.read_text() for p in root.glob('*.py'))
        for term in ('send_raw_transaction(','.create_order(', '/swap/v2/execute', 'eth_sendRawTransaction', 'PRIVATE_KEY', 'mnemonic'):
            self.assertNotIn(term,source)

if __name__=='__main__': unittest.main()
