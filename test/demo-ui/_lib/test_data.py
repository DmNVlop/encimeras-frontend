"""
Alta y limpieza por API de los datos de prueba de la batería visual. Todo lleva el prefijo
«ZZ Prueba» (nombres), `zz.prueba.` (usernames/emails) o `ZZPRUEBA` (refs/nifs), para que
la limpieza solo toque lo creado por los tests. Rutas reales de `backend/src/<módulo>/*.controller.ts`.

Uso (siempre en try/finally):

    from test_data import create_customer, cleanup_customers
    try:
        c = create_customer(token, 'ZZ Prueba Uno', 'ZZPRUEBA-1')
        ...
    finally:
        remaining = cleanup_customers(token)
    check('sin clientes de prueba residuales', remaining == 0)
"""
from factory_env import api

NAME_PREFIX = 'ZZ Prueba'
USER_PREFIX = 'zz.prueba.'
REF_PREFIX = 'ZZPRUEBA'


def list_customers(token):
    """Clientes activos (el borrado es lógico: los desactivados no salen aquí)."""
    _, body = api('GET', '/customers', token=token)
    return [c for c in (body or []) if (c.get('officialName') or '').startswith(NAME_PREFIX)]


def create_customer(token, official_name, nif, description=''):
    """Alta INDIVIDUAL por `POST /customers`. Devuelve el cliente creado (con `_id`)."""
    first, _, last = official_name.rpartition(' ')
    status, body = api('POST', '/customers', {
        'type': 'INDIVIDUAL', 'officialName': official_name, 'firstName': first, 'lastName': last,
        'nif': nif, 'description': description,
    }, token=token)
    if status >= 300 or not body or not body.get('_id'):
        raise RuntimeError(f'No se pudo crear el cliente de prueba {official_name}: HTTP {status} {body}')
    return body


def cleanup_customers(token):
    """Desactiva los clientes «ZZ Prueba…» (`DELETE /customers/batch`) y devuelve cuántos quedan activos."""
    ids = [c['_id'] for c in list_customers(token)]
    if ids:
        api('DELETE', '/customers/batch', {'customerIds': ids}, token=token)
    return len(list_customers(token))


def list_users(token, prefix=USER_PREFIX):
    _, body = api('GET', '/users', token=token)
    return [u for u in (body or []) if (u.get('username') or '').startswith(prefix)]


def cleanup_users(token, prefix=USER_PREFIX):
    """Borra por `DELETE /users/:id` los usuarios `zz.prueba.…` y devuelve cuántos quedan."""
    for u in list_users(token, prefix):
        api('DELETE', f"/users/{u['_id']}", token=token)
    return len(list_users(token, prefix))


def list_materials(token, ref_prefix=REF_PREFIX):
    _, body = api('GET', '/materials', token=token)
    return [m for m in (body or []) if (m.get('ref') or '').startswith(ref_prefix)]


def create_material(token, ref, name, category='HPL'):
    """Alta por `POST /materials` (solo ADMIN). Devuelve el material creado (con `_id`)."""
    status, body = api('POST', '/materials', {
        'ref': ref, 'name': name, 'description': 'Material de prueba', 'category': category, 'type': 'MDF', 'isActive': True,
        'selectableAttributes': ['MAT_GROUP'],
        'pricingRecipes': [{'productType': 'ENCIMERA', 'pricingAttributes': ['MAT_GROUP'], 'unit': 'm2'}],
    }, token=token)
    if status >= 300 or not body or not body.get('_id'):
        raise RuntimeError(f'No se pudo crear el material de prueba {ref}: HTTP {status} {body}')
    return body


def cleanup_materials(token, ref_prefix=REF_PREFIX):
    """Borra por `DELETE /materials` (body `{ids}`) los materiales de ref `ZZPRUEBA…` y devuelve cuántos quedan."""
    ids = [m['_id'] for m in list_materials(token, ref_prefix)]
    if ids:
        api('DELETE', '/materials', {'ids': ids}, token=token)
    return len(list_materials(token, ref_prefix))


def find_priced_piece(token):
    """Pieza con precio real: material con receta ENCIMERA + price-config cuya combinación encaje con ella."""
    _, materials = api('GET', '/materials', token=token)
    _, prices = api('GET', '/price-configs', token=token)
    configs = [c for c in (prices or []) if c.get('productType') == 'ENCIMERA']
    for m in materials or []:
        recipe = next((r for r in m.get('pricingRecipes') or [] if r.get('productType') == 'ENCIMERA'), None)
        if not recipe:
            continue
        keys = sorted(recipe.get('pricingAttributes') or [])
        for c in configs:
            pairs = [kv.split(':', 1) for kv in c['combinationKey'].split('||')]
            if sorted(k for k, _ in pairs) == keys:
                return {'materialId': m['_id'], 'selectedAttributes': dict(pairs), 'length_mm': 2000, 'width_mm': 600}
    return None


def create_test_order(user_token, piece, factory_id, label):
    """Orden «ZZ Prueba <label> <marca>» del usuario, desde un borrador propio (`POST /drafts` + `POST /orders`).
    Devuelve dict con orderId, draftId, quoteTraceId, name y error. Limpiar SIEMPRE con `purge_test_order`."""
    import time
    import uuid
    created = {'orderId': None, 'draftId': None, 'quoteTraceId': str(uuid.uuid4()), 'name': f'{NAME_PREFIX} {label} {int(time.time())}', 'error': None}
    status, draft = api('POST', '/drafts', {'name': created['name'], 'core': {'mainPieces': [piece], 'factoryId': str(factory_id)}, 'quoteTraceId': created['quoteTraceId']}, token=user_token)
    created['draftId'] = (draft or {}).get('id')
    if not created['draftId']:
        created['error'] = f'POST /drafts -> {status}'
        return created
    status, order = api('POST', '/orders', {'orderName': created['name'], 'draftId': created['draftId']}, token=user_token)
    created['orderId'] = (order or {}).get('orderId')
    if not created['orderId']:
        created['error'] = f'POST /orders -> {status}'
    return created


def purge_test_order(admin_token, user_token, created):
    """Purga ADMIN de la orden de prueba (`DELETE /orders/:id`, incluye su traza) y su borrador. Devuelve el status de la purga."""
    status = 200
    if created.get('orderId'):
        status, _ = api('DELETE', f"/orders/{created['orderId']}", token=admin_token)
    if created.get('draftId'):
        api('DELETE', f"/drafts/{created['draftId']}", token=user_token)
    if not created.get('orderId'):
        api('DELETE', f"/quote-events/{created['quoteTraceId']}", token=admin_token)
    return status
