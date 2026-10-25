"""Publish the currently rechecked design proposal, never a live train route."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
r=json.loads((D/'V02_Transit_Block_Balanced_Study.json').read_text());m=json.loads((R/'assets/city/vertical-v02/graybox/manifest.json').read_text())
assert r['entrySHA256']==sha(R/'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html')and r['manifestSHA256']==sha(R/'assets/city/vertical-v02/graybox/manifest.json')
assert r['evaluationIsCurrentRuntime']is False and not r['worldConflicts']and not r['convoyConflicts']
station=[p for p in m['records']if p.get('sourceStructure',p['id']).startswith('station-concourse')];edge=max(p['box']['max'][0]for p in station);near=80+r['frontLocalBounds']['min'][0]
proposal={'status':'UNIMPLEMENTED DESIGN PROPOSAL; current game train unchanged','sourceEntrySHA256':r['entrySHA256'],'sourceManifestSHA256':r['manifestSHA256'],'trainAssetSHA256':r['trainAssetSHA256'],
          'route':r['evaluatedProposal'],'routeDataPolicy':'Inline264controlpoints are complete. The optional local file/hash records study provenance, not a runtime file dependency.',
          'stationMainStraight':{'x':80,'y':100,'direction':'positiveZ','publicConcourseGoal':[66.5,100,376]},
          'existingBoardingSetback':{'source':'Actual exported concourse bounds and normalized Hi3D front envelope on station straight','concourseEastEdgeX':edge,'trainNearSideX':near,'horizontalGapMetres':near-edge,'status':'OPEN: inspect actual mesh door threshold/boarding height and author gated platform connection. No served or boardable station claim.'},
          'consistTarget':{'cars':4,'spacingMetres':r['spacing'],'envelope':r['consistEnvelopePolicy'],'coupling':'OPEN: mechanical/gangway/bogie articulation is not implemented or certified.'},
          'sampledGeometryEvidence':{'report':'V02_Transit_Block_Balanced_Study.json','samples':r['samples'],'intervalMetres':r['sampleIntervalMetres'],'worldConflicts':0,'convoyConflicts':0,'metrics':r['motionEnvelopeMetrics'],'predictedNativeFrameSpeedRatios':r['predictedNativeFrameSpeedRatios']},
          'proposedMotionPolicy':{'maximumStraightSpeedMetresPerSecond':16,'maximumLateralAccelerationMetresPerSecondSquared':2.5,'cornerSpeed':'Derive from measured native curve curvature; nominal24m radius suggests about7.75m/s before acceleration/station constraints. Proposal only.','status':'OPEN: controller/dwell/pause/native playback evidence pending.'},
          'phaseOrder':'Keep phase4 runtime independent. After essential gameplay acceptance and detailed architecture, author Blender transit infrastructure, recheck changed geometry, then integrate and validate native motion in phase6.',
          'remaining':['Recheck after detailed architecture','Refine consistent middle/rear assets in Blender','Validate coupler/bogie articulation','Author supported track and gated boarding connection from actual door geometry','Implement stopping and curvature-aware motion','Native full-route captures, continuous/bounded clearance, camera and performance acceptance']}
(D/'V02_Transit_Route_Proposal.json').write_text(json.dumps(proposal,indent=2)+'\n');print('Unimplemented proposal refreshed; boarding setback',near-edge)
