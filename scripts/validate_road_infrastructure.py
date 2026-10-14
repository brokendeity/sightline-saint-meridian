"""Run the road feature and existing browser regressions in an isolated CLI browser."""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/playwright'
CLI = Path.home() / '.codex/skills/playwright/scripts/playwright_cli.sh'
SESSION = 'road-validation'
SUITES = ['import-regression-suite.js', 'gameplay-upgrade-tests.js',
          'polish-audit-tests.js', 'presentation-upgrade-tests.js',
          'visual-polish-tests.js', 'building-import-tests.js',
          'road-infrastructure-tests.js']

def command(*args):
    result = subprocess.run([str(CLI), '-s=' + SESSION, *args], cwd=ROOT,
                            capture_output=True, text=True, timeout=180)
    if result.returncode:
        raise RuntimeError(result.stdout[-2000:] + result.stderr[-1000:])
    return result.stdout

summary = {'suites': [], 'passed': 0, 'total': 0}
try:
    command('open', 'http://127.0.0.1:8765/SIGHTLINE_SAINT_MERIDIAN_TOON.html', '--browser', 'chrome')
    for index, name in enumerate(SUITES):
        if index:
            command('reload')
        command('eval', 'new Promise(resolve=>{const poll=()=>gameReady?resolve(true):setTimeout(poll,40);poll()})')
        raw = command('eval', (OUT / name).read_text())
        (OUT / ('roads-final-' + name.removesuffix('.js') + '.txt')).write_text(raw)
        data = json.loads(raw.split('### Result\n', 1)[1].split('### Ran', 1)[0])
        checks = ([c for group in data for c in group['checks']]
                  if name == 'import-regression-suite.js'
                  else data['checks'] if isinstance(data, dict) else data)
        entry = {'suite': name, 'passed': sum(c['pass'] for c in checks),
                 'total': len(checks), 'failures': [c for c in checks if not c['pass']]}
        summary['suites'].append(entry)
        summary['passed'] += entry['passed']
        summary['total'] += entry['total']
        print(name, str(entry['passed']) + '/' + str(entry['total']), flush=True)
    (OUT / 'road-validation-summary.json').write_text(json.dumps(summary, indent=2))
    print('TOTAL', summary['passed'], '/', summary['total'], flush=True)
finally:
    command('close')
if summary['passed'] != summary['total']:
    raise SystemExit(1)
