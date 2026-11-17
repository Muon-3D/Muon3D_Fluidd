"""Per-browser LAN upload sessions; file bodies are streamed, not buffered."""
import asyncio
import hashlib
import time

from aiohttp import web


SESSIONS = {}


async def control(request):
    key = request.match_info['session']
    if request.method == 'POST':
        options = await request.json()
        SESSIONS[key] = dict(options, files=[], attempts=[], staged=[], sockets=set())
    state = SESSIONS[key]
    return web.json_response({k: v for k, v in state.items() if k != 'sockets'})


def directory(state, path):
    root, _, folder = path.partition('/')
    files = [dict(filename=f['name'], size=f['size'], modified=f['modified'], permissions='rw')
             for f in state['files'] if f['root'] == root and f['folder'] == folder]
    dirs = [] if folder else [dict(dirname='parts', modified=time.time(), size=0, permissions='rw')]
    return dict(dirs=dirs, files=files,
                disk_usage=dict(total=29_000_000_000, used=6_100_000_000, free=22_900_000_000),
                root_info=dict(name=root, permissions='rw'))


async def upload(request):
    state = SESSIONS.get(request.headers.get('X-E2E-Upload-Session'))
    if state is None:
        raise web.HTTPBadRequest(text='Missing LAN upload session')
    form = await request.multipart()
    fields = {}
    attempt = dict(name='', size=0, completed=False)
    state['attempts'].append(attempt)
    digest = hashlib.sha256()
    try:
        async for part in form:
            if part.name != 'file':
                fields[part.name] = await part.text()
                continue
            attempt['name'] = part.filename
            state['staged'].append('.' + part.filename + '.tmp')
            while True:
                chunk = await part.read_chunk(64 * 1024)
                if not chunk:
                    break
                digest.update(chunk)
                attempt['size'] += len(chunk)
                if state.get('cut_after') and attempt['size'] >= state['cut_after']:
                    request.transport.abort()
                    return web.Response(status=499)
                if state.get('delay'):
                    await asyncio.sleep(state['delay'])
        attempt.update(root=fields.get('root'), folder=fields.get('path', ''), sha256=digest.hexdigest())
        if not attempt['name'] or attempt['root'] not in ('gcodes', 'calibration', 'config'):
            raise web.HTTPBadRequest(text='Invalid file or root')
        if fields.get('checksum') and fields['checksum'] != attempt['sha256']:
            return web.json_response({'error': {'message': 'Checksum mismatch'}}, status=422)
        attempt['completed'] = True
        published = dict(attempt, modified=time.time())
        state['files'].append(published)
        item = dict(path='/'.join(filter(None, [attempt['folder'], attempt['name']])),
                    root=attempt['root'], size=attempt['size'], modified=published['modified'])
        for socket in tuple(state['sockets']):
            await socket.send_json(dict(jsonrpc='2.0', method='notify_filelist_changed',
                                        params=[dict(action='create_file', item=item)]))
        return web.json_response({'result': {'item': item, 'action': 'create_file'}}, status=201)
    finally:
        state['staged'].clear()
