import math
import unittest
from audit_nsunsc_cinematics import audit_animation

class CinematicAuditTests(unittest.TestCase):
    def test_invalid_values_and_sentinels_are_separate(self):
        a={'duration':1,'entries':[{'name':'camera','format':2,'clump':0,'curves':[{'path':'location','keys':[[-1,[0,0,0]],[0,[0,0,0]],[2,[0,math.nan,0]]]}]}]}
        r=audit_animation(a)
        self.assertEqual(r['counts']['keys'],3)
        self.assertEqual(r['counts']['negativeTimeSentinels'],1)
        self.assertEqual(r['counts']['keysPastDuration'],1)
        self.assertEqual(len(r['issues']),1)
        self.assertEqual(r['cameras'][0]['paths'],['location'])
    def test_order_detection_does_not_rewrite_source(self):
        keys=[[1,[1]],[0,[0]]]
        a={'duration':1,'entries':[{'name':'body','format':1,'curves':[{'path':'opacity','keys':keys}]}]}
        self.assertEqual(audit_animation(a)['counts']['outOfOrderKeyTransitions'],1)
        self.assertEqual(a['entries'][0]['curves'][0]['keys'],keys)

if __name__=='__main__': unittest.main()
