"""Retain chronological gameplay keyframes from the actual benchmark videos.
No synthetic scene recreation or authored camera is used in these review sheets.
"""
from pathlib import Path
import json,subprocess
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';report=json.loads((D/'V02_Camera_Acceleration_Benchmark.json').read_text());assert len(report['runs'])==2
for run in report['runs']:
 source=D/run['video'];duration=float(json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(source)]))['format']['duration']);out=source.parent/(run['id']+'-timeline.png')
 # Eight chronological samples spanning actual loaded movement, plus the start.
 interval=(duration-3)/9
 subprocess.run(['ffmpeg','-y','-v','error','-i',str(source),'-vf',f'fps=1/{interval},scale=480:-1,tile=3x3','-frames:v','1',str(out)],check=True)
 print(run['id'],'actualVideoSeconds',duration,'sheet',out.relative_to(D))
