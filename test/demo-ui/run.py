"""
Lanzador de las pruebas visuales (Playwright, Python).
Necesita el frontend y el backend en marcha.
La fábrica es OBLIGATORIA (factory=<Fábrica>), sin valor por defecto.

Mismo uso que la batería de API del backend (`backend`: npm run test:demo):

  npm run test:demo                                 -> lista los grupos
  npm run test:demo -- users factory=DEMO           -> un grupo
  npm run test:demo -- all factory=DEMO             -> todos
  npm run test:demo -- users factory=DEMO visual    -> se ve en directo

(equivale a `python test/demo-ui/run.py <mismos argumentos>`)

Grupo = carpeta de test/demo-ui/. Se ejecutan los `ui_*.py` de cada grupo, de
uno en uno. Lo que empieza por `_` es utilidad. Un test falla si sale con
código != 0 o imprime FALLO/ABORTO. Capturas y descargas en <grupo>/capturas/ (fuera de git).
"""
import os
import pathlib
import re
import subprocess
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')  # consola de Windows en cp1252 rompe los acentos
ROOT = pathlib.Path(__file__).parent
GROUPS = sorted(d.name for d in ROOT.iterdir() if d.is_dir() and not d.name.startswith(('_', '.')))


def tests_of(group):
    return sorted(p for p in (ROOT / group).glob('ui_*.py'))


sys.path.insert(0, str(ROOT / '_lib'))
FACTORY_ARG = re.compile(r'^(--)?factory=')
factory_arg = next((a for a in sys.argv[1:] if FACTORY_ARG.match(a)), None)
# PowerShell se come el `--` de `npm run test:demo -- …` y npm se queda con `--factory`/`--visual`
# (los deja en npm_config_factory / npm_config_visual), así que valen todas las formas.
FACTORY = factory_arg.split('=', 1)[1] if factory_arg else os.environ.get('npm_config_factory')
VISUAL_ARGS = ('visual', '--visual')
VISUAL = any(a in VISUAL_ARGS for a in sys.argv[1:]) or bool(os.environ.get('npm_config_visual'))
args = [a for a in sys.argv[1:] if not FACTORY_ARG.match(a) and a not in VISUAL_ARGS]
USAGE = 'Uso: npm run test:demo -- <grupo> [grupo...] | all  factory=<Fábrica>  [visual]'
if not args:
    print('Grupos disponibles:')
    for g in GROUPS:
        print(f"  {g:<20} {', '.join(p.name for p in tests_of(g))}")
    print('\n' + USAGE)
    sys.exit(0)
if not FACTORY:
    print(f'ABORTO: falta la fábrica. No se ejecuta nada sin elegirla.\n{USAGE}')
    sys.exit(1)

selected = GROUPS if 'all' in args else args
unknown = [g for g in selected if g not in GROUPS]
if unknown:
    print(f"Grupo desconocido: {', '.join(unknown)}. Disponibles: {', '.join(GROUPS)}")
    sys.exit(1)

os.environ['TEST_FACTORY'] = FACTORY
import factory_env  # noqa: E402  lee TEST_FACTORY y el .env de la fábrica (sale con ABORTO si falta)

# Seguro duro antes de tocar nada: el ADMIN del .env es de FACTORY_ID de la fábrica elegida (aborta si no).
token = factory_env.login(*factory_env.credentials('ADMIN'))
factory_id = factory_env.assert_factory(token)
print(f'Fábrica de las pruebas: {FACTORY} ({factory_id}), comprobada con el token.')
env = {**os.environ, 'PYTHONIOENCODING': 'utf-8', 'TEST_FACTORY': FACTORY, 'DEMO_BEARER_TOKEN': token}

results = []
for group in selected:
    for test in tests_of(group):
        print(f'\n== {group}/{test.name} ==', flush=True)
        started = time.time()
        run = subprocess.run([sys.executable, str(test), *(['--visual'] if VISUAL else [])],
                             capture_output=True, text=True, encoding='utf-8', env=env, cwd=str(test.parent))
        output = (run.stdout or '') + (run.stderr or '')
        print(output, flush=True)
        failed = run.returncode != 0 or re.search(r'^(FALLO|ABORTO)', output, re.M)
        results.append((f'{group}/{test.name}', not failed, time.time() - started))

print('\n== Resumen ==')
for name, ok, secs in results:
    print(f"{'OK   ' if ok else 'FALLO'} {name} ({secs:.1f} s)")
failed_count = sum(1 for _, ok, _ in results if not ok)
print(f'\n{len(results) - failed_count}/{len(results)} tests OK')
sys.exit(1 if failed_count else 0)
