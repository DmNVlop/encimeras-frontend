"""
Fábrica de las pruebas visuales: OBLIGATORIA (`run.py <grupo> factory=DEMO`), sin valor por
defecto, para que nunca haya confusión sobre dónde se escribe. Mismo criterio que
`backend/test/demo/_lib/env.js`.

Lee `docs/integrations/<Fábrica>/.env.playwright.local` (fuera de git).
"""
import json
import os
import pathlib
import sys
import urllib.error
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')  # consola de Windows en cp1252 rompe los acentos
ROOT = pathlib.Path(__file__).resolve().parents[4]  # raíz del workspace (frontend/test/demo-ui/_lib → ../../../..)


def load_env(factory):
    path = ROOT / 'docs' / 'integrations' / factory / '.env.playwright.local'
    if not path.exists():
        print(f'ABORTO: no existe {path} (credenciales de la fábrica {factory}).')
        sys.exit(1)
    env = {}
    for line in path.read_text(encoding='utf-8').splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()
    return env


FACTORY = os.environ.get('TEST_FACTORY')
if not FACTORY:
    print('ABORTO: falta la fábrica (factory=<Fábrica>). Lánzalo con run.py <grupo> factory=<Fábrica>.')
    sys.exit(1)
ENV = load_env(FACTORY)
BASE = ENV.get('FE_URL', 'http://localhost').rstrip('/')
API = ENV.get('API_URL', 'http://localhost:3000').rstrip('/')
VISUAL = '--visual' in sys.argv


def api(method, path, body=None, token=None, timeout=30):
    """Llamada directa al backend: devuelve (status, json o None)."""
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Content-Type': 'application/json', **({'Authorization': 'Bearer ' + token} if token else {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read() or b'null')
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b'null')
        except Exception:
            return e.code, None


def login(username, password):
    """Token de `POST /auth/login` (el body usa `username`, no `email`), o None."""
    _, b = api('POST', '/auth/login', {'username': username, 'password': password})
    return (b or {}).get('access_token')


def credentials(role='ADMIN'):
    """(usuario, contraseña) de un rol del .env (`DEMO_USER_<ROL>`/`DEMO_PASS_<ROL>`), o (None, None)."""
    return ENV.get(f'DEMO_USER_{role}'), ENV.get(f'DEMO_PASS_{role}')


def assert_factory(token):
    """Seguro duro: el token tiene que ser de FACTORY_ID de su .env (`GET /auth/me`). Sale con ABORTO si no."""
    if not ENV.get('FACTORY_ID'):
        print(f'ABORTO: FACTORY_ID vacío en docs/integrations/{FACTORY}/.env.playwright.local.')
        sys.exit(1)
    if not token:
        print(f'ABORTO: login fallido con DEMO_USER_ADMIN de {FACTORY}.')
        sys.exit(1)
    _, me = api('GET', '/auth/me', token=token)
    actual = str((me or {}).get('factoryId') or '') or None
    if actual != str(ENV['FACTORY_ID']):
        print(f'ABORTO: las credenciales de {FACTORY} son de la fábrica {actual or "(ninguna)"}, no de FACTORY_ID {ENV["FACTORY_ID"]}.')
        sys.exit(1)
    return actual


def admin_token():
    """Token del ADMIN: el que pasa el lanzador o, lanzado suelto, un login nuevo."""
    return os.environ.get('DEMO_BEARER_TOKEN') or login(*credentials('ADMIN'))


_failures = []


def check(name, ok, info=''):
    """Imprime OK/FALLO con una comprobación real (nunca `check(..., True)`)."""
    if not ok:
        _failures.append(name)
    print(f"{'OK   ' if ok else 'FALLO'} {name}{f' — {info}' if info else ''}", flush=True)
    return ok


def done():
    """Sale con código 1 si alguna comprobación falló."""
    sys.exit(1 if _failures else 0)
