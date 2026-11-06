"""Minimal fake Moonraker for rendering Fluidd without a printer.

Answers the JSON-RPC calls Fluidd makes at start-up with a plausible M1 in the
middle of a print, and pushes a status update every second so temperatures and
progress move. Unknown methods are logged and answered with an empty result.

    python mock_moonraker.py [port]   (default 7125)
"""
import asyncio
import json
import os
import math
import sys
import time

from aiohttp import web, WSMsgType

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 7125
T0 = time.time()
DB: dict = {}

CONFIG = {
    'printer': {'kinematics': 'corexy', 'max_velocity': 500, 'max_accel': 20000, 'square_corner_velocity': 5},
    'stepper_x': {'position_min': 0, 'position_max': 200, 'position_endstop': 0},
    'stepper_y': {'position_min': 0, 'position_max': 200, 'position_endstop': 0},
    'stepper_z': {'position_min': -2, 'position_max': 200},
    'extruder': {'min_temp': 0, 'max_temp': 300, 'min_extrude_temp': 170, 'nozzle_diameter': 0.4,
                 'filament_diameter': 1.75, 'max_extrude_only_distance': 100, 'control': 'pid',
                 'heater_pin': 'PA1', 'sensor_type': 'NTC 100K', 'pressure_advance': 0.04},
    'heater_bed': {'min_temp': 0, 'max_temp': 120, 'control': 'pid'},
    'fan': {'pin': 'PB1'},
    'heater_fan hotend_fan': {'pin': 'PB2'},
    'temperature_sensor mcu': {'sensor_type': 'temperature_mcu'},
    'temperature_sensor chamber': {'sensor_type': 'NTC 100K'},
    'bed_mesh': {'mesh_min': [10, 10], 'mesh_max': [190, 190], 'probe_count': [5, 5]},
    'virtual_sdcard': {'path': '/home/muon/printer_data/gcodes'},
    'firmware_retraction': {'retract_length': 0.8, 'retract_speed': 35, 'unretract_extra_length': 0, 'unretract_speed': 35},
    'gcode_macro PRINT_START': {'gcode': ''},
    'gcode_macro PRINT_END': {'gcode': ''},
    'gcode_macro LOAD_FILAMENT': {'gcode': ''},
    'gcode_macro UNLOAD_FILAMENT': {'gcode': ''},
    'gcode_macro CLEAN_NOZZLE': {'gcode': ''},
    'gcode_macro PAUSE': {'gcode': ''},
    'gcode_macro RESUME': {'gcode': ''},
    'gcode_macro CANCEL_PRINT': {'gcode': ''},
    'pause_resume': {},
    'display_status': {},
}
CONFIG = {k.lower(): v for k, v in CONFIG.items()}

MESH = [[round(0.06 * math.sin(x / 1.3) - 0.04 * math.cos(y / 1.7) + 0.01 * (x - y), 3) for x in range(5)] for y in range(5)]


def status():
    t = time.time() - T0
    prog = min(0.999, 0.42 + t / 3000)
    return {
        'webhooks': {'state': 'ready', 'state_message': 'Printer is ready'},
        'toolhead': {'homed_axes': 'xyz', 'position': [101.2, 88.4, 12.6, 1452.1], 'max_velocity': 500, 'max_accel': 20000,
                     'square_corner_velocity': 5, 'minimum_cruise_ratio': 0.5, 'print_time': t, 'estimated_print_time': t,
                     'axis_minimum': [0, 0, -2, 0], 'axis_maximum': [200, 200, 200, 0], 'extruder': 'extruder', 'stalls': 0},
        'extruder': {'temperature': 219.6 + 0.6 * math.sin(t / 3), 'target': 220, 'power': 0.42 + 0.05 * math.sin(t),
                     'pressure_advance': 0.04, 'smooth_time': 0.04, 'can_extrude': True},
        'heater_bed': {'temperature': 59.8 + 0.3 * math.sin(t / 5), 'target': 60, 'power': 0.31},
        'heaters': {'available_heaters': ['heater_bed', 'extruder'], 'available_sensors': ['heater_bed', 'extruder', 'temperature_sensor mcu', 'temperature_sensor chamber']},
        'temperature_sensor mcu': {'temperature': 44.1, 'measured_min_temp': 30.2, 'measured_max_temp': 47.9},
        'temperature_sensor chamber': {'temperature': 34.7 + 0.2 * math.sin(t / 7), 'measured_min_temp': 21.0, 'measured_max_temp': 36.0},
        'fan': {'speed': 0.8, 'rpm': None},
        'heater_fan hotend_fan': {'speed': 1.0, 'rpm': 7800},
        'gcode_move': {'speed_factor': 1.0, 'extrude_factor': 1.0, 'absolute_coordinates': True, 'absolute_extrude': True,
                       'homing_origin': [0, 0, -0.02, 0], 'position': [101.2, 88.4, 12.6, 1452.1],
                       'gcode_position': [101.2, 88.4, 12.6, 1452.1], 'speed': 9000},
        'motion_report': {'live_position': [101.2 + 30 * math.sin(t), 88.4 + 30 * math.cos(t), 12.6, 1452.1],
                          'live_velocity': 180.0, 'live_extruder_velocity': 4.2},
        'print_stats': {'filename': 'M1_bracket_PLA_0.2mm.gcode', 'total_duration': 2400 + t, 'print_duration': 2280 + t,
                        'filament_used': 3120.4, 'state': 'printing', 'message': '', 'info': {'total_layer': 63, 'current_layer': 27}},
        'virtual_sdcard': {'file_path': '/home/muon/printer_data/gcodes/M1_bracket_PLA_0.2mm.gcode', 'progress': prog,
                           'is_active': True, 'file_position': int(prog * 4_000_000), 'file_size': 4_000_000},
        'display_status': {'progress': prog, 'message': None},
        'idle_timeout': {'state': 'Printing', 'printing_time': 2280 + t},
        'pause_resume': {'is_paused': False},
        'system_stats': {'sysload': 0.42, 'cputime': t, 'memavail': 612000},
        'bed_mesh': {'profile_name': 'default', 'mesh_min': [10, 10], 'mesh_max': [190, 190], 'probed_matrix': MESH,
                     'mesh_matrix': MESH, 'profiles': {'default': {'points': MESH, 'mesh_params': {
                         'min_x': 10, 'max_x': 190, 'min_y': 10, 'max_y': 190, 'x_count': 5, 'y_count': 5,
                         'mesh_x_pps': 2, 'mesh_y_pps': 2, 'algo': 'lagrange', 'tension': 0.2}}}},
        'firmware_retraction': {'retract_length': 0.8, 'retract_speed': 35, 'unretract_extra_length': 0, 'unretract_speed': 35},
        'exclude_object': {'objects': [], 'excluded_objects': [], 'current_object': None},
        'configfile': {'settings': CONFIG, 'config': {k: {kk: str(vv) for kk, vv in v.items()} for k, v in CONFIG.items()},
                       'save_config_pending': False, 'save_config_pending_items': {}, 'warnings': []},
        'gcode_macro PRINT_START': {}, 'gcode_macro PRINT_END': {}, 'gcode_macro LOAD_FILAMENT': {},
        'gcode_macro UNLOAD_FILAMENT': {}, 'gcode_macro CLEAN_NOZZLE': {}, 'gcode_macro PAUSE': {},
        'gcode_macro RESUME': {}, 'gcode_macro CANCEL_PRINT': {},
        'mcu': {'mcu_version': 'v0.12.0-muon', 'mcu_build_versions': '', 'mcu_constants': {'MCU': 'stm32h723xx'},
                'last_stats': {'mcu_awake': 0.012, 'mcu_task_avg': 0.00002, 'freq': 520000000}},
    }


HERE = os.path.dirname(os.path.abspath(__file__))


def marker(name):
    return os.path.exists(os.path.join(HERE, name))


# MuonOS SEC-8 network protection (Moonraker#21). `touch protected` next to this
# script for Level 1; `touch paired` as well to answer as a paired device (the
# Iroh gateway). Neither file: Level 0, which is what every image ships with.
def protection():
    level = 1 if marker('protected') else 0
    return {'level': level, 'name': 'protected' if level else 'open',
            'protected_surfaces': ['/server/aux', '/machine/update'],
            'excluded_surfaces': ['/server/aux/dev_mode'],
            'caller_has_identity': marker('paired'), 'changeable_by_caller': False}


def refused(endpoint):
    """Moonraker's own refusal, word for word (muon_floor.check_protection)."""
    p = protection()
    if not p['level'] or p['caller_has_identity']:
        return None
    if endpoint.startswith('/server/aux/dev_mode'):
        return None
    if not (endpoint.startswith('/server/aux') or endpoint.startswith('/machine/update')):
        return None
    return (f"'{endpoint}' is protected on this printer. The owner turned on network protection, "
            "which can only be turned off at the printer's panel. A paired device can still reach it.")


def server_info():
    return {'klippy_connected': True, 'klippy_state': 'ready', 'components': [
        'database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'shell_command', 'proc_stats',
        'job_state', 'job_queue', 'http_client', 'announcements', 'webcam', 'extensions', 'update_manager',
        'history', 'authorization', 'muon_floor', 'aux_api_proxy', 'muon_protection']
        + (['muon_access'] if MOCK_ACCESS else []),
        'failed_components': [], 'registered_directories': ['config', 'logs', 'gcodes', 'config_examples', 'docs'],
        'warnings': [], 'websocket_count': 1, 'moonraker_version': 'v0.9.3-muon', 'api_version': [1, 5, 0],
        'api_version_string': '1.5.0'}


FILES = [
    {'path': f, 'modified': time.time() - i * 86400, 'size': s, 'permissions': 'rw'}
    for i, (f, s) in enumerate([
        ('M1_bracket_PLA_0.2mm.gcode', 4_000_000), ('calibration_cube.gcode', 420_000),
        ('benchy_0.16mm_PETG.gcode', 7_200_000), ('fan_duct_v3.gcode', 2_100_000),
        ('cable_clip_x12.gcode', 900_000)])
]

HISTORY = [
    {'job_id': f'00000{i}', 'filename': f['path'], 'status': st, 'start_time': time.time() - (i + 1) * 90000,
     'end_time': time.time() - (i + 1) * 90000 + 5400, 'print_duration': 5200, 'total_duration': 5400,
     'filament_used': 4200.0, 'exists': True, 'metadata': {'size': f['size']}}
    for i, (f, st) in enumerate(zip(FILES[1:], ['completed', 'completed', 'cancelled', 'completed']))
]


def rpc(method, params):
    if method == 'server.info':
        return server_info()
    if method == 'server.connection.identify':
        return {'connection_id': 1}
    if method == 'printer.info':
        return {'state': 'ready', 'state_message': 'Printer is ready', 'hostname': 'muon-boxwood-367a',
                'klipper_path': '/opt/klipper', 'python_path': '/usr/bin/python3', 'log_file': '/tmp/klippy.log',
                'config_file': '/home/muon/printer_data/config/printer.cfg', 'software_version': 'v0.12.0-muon',
                'cpu_info': '4 core ARM'}
    if method == 'printer.objects.list':
        return {'objects': list(status().keys())}
    if method in ('printer.objects.subscribe', 'printer.objects.query'):
        return {'eventtime': time.time() - T0, 'status': status()}
    if method == 'server.config':
        return {'config': {'server': {'host': '0.0.0.0', 'port': 7125}, 'file_manager': {'enable_object_processing': True},
                           'history': {}, 'authorization': {}}, 'orig': {}, 'files': []}
    if method == 'server.database.get_item':
        ns, key = params.get('namespace'), params.get('key')
        val = DB.get(ns, {})
        if key:
            for part in key.split('.'):
                val = val.get(part) if isinstance(val, dict) else None
        return {'namespace': ns, 'key': key, 'value': val if val is not None else {}}
    if method == 'server.database.post_item':
        ns, key, value = params.get('namespace'), params.get('key'), params.get('value')
        cur = DB.setdefault(ns, {})
        parts = key.split('.')
        for p in parts[:-1]:
            cur = cur.setdefault(p, {})
        cur[parts[-1]] = value
        return {'namespace': ns, 'key': key, 'value': value}
    if method == 'server.files.get_directory':
        root = params.get('path', 'gcodes').split('/')[0]
        files = FILES if root == 'gcodes' else [{'filename': 'printer.cfg', 'modified': time.time(), 'size': 4096, 'permissions': 'rw'}]
        return {'dirs': [], 'files': [{'filename': f.get('path', f.get('filename')), 'modified': f['modified'],
                                       'size': f['size'], 'permissions': 'rw'} for f in files],
                'disk_usage': {'total': 29_000_000_000, 'used': 6_100_000_000, 'free': 22_900_000_000}, 'root_info': {'name': root, 'permissions': 'rw'}}
    if method == 'server.files.list':
        return FILES
    if method == 'server.files.metadata':
        return {'filename': params.get('filename'), 'size': 4_000_000, 'modified': time.time(), 'slicer': 'OrcaSlicer',
                'slicer_version': '2.3.0', 'layer_height': 0.2, 'first_layer_height': 0.2, 'object_height': 12.6,
                'filament_total': 5800.0, 'estimated_time': 5400, 'first_layer_extr_temp': 220, 'first_layer_bed_temp': 60,
                'filament_type': 'PLA', 'filament_name': 'Muon PLA Basalt', 'thumbnails': []}
    if method == 'server.history.list':
        return {'count': len(HISTORY), 'jobs': HISTORY}
    if method == 'server.history.totals':
        return {'job_totals': {'total_jobs': 48, 'total_time': 612000, 'total_print_time': 590000,
                               'total_filament_used': 188000, 'longest_job': 36000, 'longest_print': 35000}}
    if method == 'server.temperature_store':
        n = 1200
        def series(base, amp):
            return [round(base + amp * math.sin(i / 40), 2) for i in range(n)]
        return {'extruder': {'temperatures': series(219.8, 0.6), 'targets': [220] * n, 'powers': series(0.42, 0.05)},
                'heater_bed': {'temperatures': series(59.8, 0.3), 'targets': [60] * n, 'powers': series(0.31, 0.03)},
                'temperature_sensor mcu': {'temperatures': series(44, 0.4)},
                'temperature_sensor chamber': {'temperatures': series(34.6, 0.3)}}
    if method == 'server.gcode_store':
        return {'gcode_store': [{'message': m, 'time': time.time() - 60 + i, 'type': 'response'} for i, m in enumerate(
            ['// Klipper state: Ready', 'ok', '// probe: z=0.012', 'Bed mesh loaded: default'])]}
    if method == 'machine.system_info':
        return {'system_info': {'cpu_info': {'cpu_count': 4, 'bits': '64bit', 'processor': 'aarch64', 'cpu_desc': '',
                                             'serial_number': '367a', 'hardware_desc': '', 'model': 'Raspberry Pi CM4',
                                             'total_memory': 1900000, 'memory_units': 'kB'},
                                'sd_info': {}, 'distribution': {'name': 'MuonOS 2026.09', 'id': 'muonos', 'version': '2026.09'},
                                'available_services': ['klipper', 'moonraker'], 'instance_ids': {'moonraker': 'moonraker', 'klipper': 'klipper'},
                                'service_state': {'klipper': {'active_state': 'active', 'sub_state': 'running'},
                                                  'moonraker': {'active_state': 'active', 'sub_state': 'running'}},
                                'virtualization': {'virt_type': 'none', 'virt_identifier': 'none'},
                                'python': {'version': [3, 11, 2], 'version_string': '3.11.2'},
                                'network': {'wlan0': {'mac_address': 'd8:3a:dd:00:36:7a', 'ip_addresses': [{'family': 'ipv4', 'address': '192.168.1.153', 'is_link_local': False}]}}}}
    if method == 'machine.proc_stats':
        return {'moonraker_stats': [{'time': time.time(), 'cpu_usage': 3.1, 'memory': 42000, 'mem_units': 'kB'}],
                'throttled_state': {'bits': 0, 'flags': []}, 'cpu_temp': 51.2,
                'network': {'wlan0': {'rx_bytes': 1, 'tx_bytes': 1, 'bandwidth': 1200}}, 'system_cpu_usage': {'cpu': 14.2},
                'system_memory': {'total': 1900000, 'available': 1200000, 'used': 700000}, 'system_uptime': 86400, 'websocket_connections': 1}
    if method == 'server.muon.get_protection':
        return protection()
    if method == 'machine.update.status':
        return {'busy': False, 'github_rate_limit': 60, 'github_requests_remaining': 58, 'github_limit_reset_time': 0,
                'version_info': {'system': {'package_count': 0, 'package_list': []}}}
    if method == 'server.announcements.list':
        return {'entries': [], 'feeds': []}
    if method == 'server.webcams.list':
        return {'webcams': []}
    if method == 'server.job_queue.status':
        return {'queued_jobs': [], 'queue_state': 'ready'}
    if method == 'machine.device_power.devices':
        return {'devices': []}
    if method == 'server.sensors.list':
        return {'sensors': {}}
    if method == 'printer.gcode.help':
        return {'G28': 'Home', 'BED_MESH_CALIBRATE': 'Probe the bed'}
    if method.startswith('machine.peripherals'):
        return {}
    print('unhandled rpc', method, params, flush=True)
    return {}


async def ws_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async def pusher():
        while not ws.closed:
            await asyncio.sleep(1)
            s = status()
            sub = {k: s[k] for k in ('extruder', 'heater_bed', 'temperature_sensor chamber', 'print_stats',
                                     'virtual_sdcard', 'display_status', 'motion_report', 'toolhead')}
            try:
                await ws.send_json({'jsonrpc': '2.0', 'method': 'notify_status_update', 'params': [sub, time.time() - T0]})
                level = protection()['level']
                if level != seen['level']:
                    seen['level'] = level
                    await ws.send_json({'jsonrpc': '2.0', 'method': 'notify_muon_protection_changed',
                                        'params': [{'level': level, 'name': protection()['name']}]})
            except Exception:
                return

    seen = {'level': protection()['level']}
    task = asyncio.create_task(pusher())
    async for msg in ws:
        if msg.type != WSMsgType.TEXT:
            continue
        req = json.loads(msg.data)
        reason = refused('/' + req.get('method', '').replace('.', '/'))
        if reason:
            await ws.send_json({'jsonrpc': '2.0', 'id': req.get('id'), 'error': {'code': 403, 'message': reason}})
            continue
        result = rpc(req.get('method', ''), req.get('params') or {})
        await ws.send_json({'jsonrpc': '2.0', 'id': req.get('id'), 'result': result})
    task.cancel()
    return ws


async def http_db(request):
    if request.method == 'POST':
        body = await request.json()
        return web.json_response({'result': rpc('server.database.post_item', body)})
    ns = request.query.get('namespace')
    if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'auth401')):
        return web.json_response({'error': {'code': 401, 'message': 'Unauthorized'}}, status=401)
    return web.json_response({'result': {'namespace': ns, 'value': DB.get(ns, {})}})


NETWORKS = [
    {'in_use': True, 'ssid': 'Workshop', 'bssid': 'AA:BB:CC:00:00:01', 'mode': 'Infra', 'chan': 36, 'freq': 5180, 'rate': 540, 'signal': 78, 'security': 'WPA2'},
    {'in_use': False, 'ssid': 'Workshop-2G', 'bssid': 'AA:BB:CC:00:00:02', 'mode': 'Infra', 'chan': 6, 'freq': 2437, 'rate': 130, 'signal': 64, 'security': 'WPA2'},
    {'in_use': False, 'ssid': 'Office', 'bssid': 'AA:BB:CC:00:00:03', 'mode': 'Infra', 'chan': 11, 'freq': 2462, 'rate': 130, 'signal': 41, 'security': 'WPA2 WPA3'},
    {'in_use': False, 'ssid': 'Guest', 'bssid': 'AA:BB:CC:00:00:04', 'mode': 'Infra', 'chan': 1, 'freq': 2412, 'rate': 65, 'signal': 22, 'security': ''},
]


async def http_aux(request):
    tail = request.path[len('/server/aux'):]
    reason = refused(request.path)
    if reason:
        return web.json_response({'error': {'code': 403, 'message': reason}}, status=403)
    if tail == '/wifi/current':
        return web.json_response(NETWORKS[0])
    if tail in ('/wifi/show', '/wifi/scan'):
        return web.json_response(NETWORKS)
    if tail == '/wifi/device/status':
        return web.json_response({'device': 'wlan0', 'device_type': 'wifi', 'state': 'connected', 'connection': 'Workshop'})
    if tail == '/wifi/ap/device/status':
        return web.json_response({'device': 'ap0', 'device_type': 'wifi', 'state': 'disconnected', 'connection': None})
    if tail == '/wifi/ap/show':
        return web.json_response({'ssid': 'Muon-boxwood-367a', 'password': 'muon-setup', 'autoconnect': False})
    if tail == '/wifi/ap/count':
        return web.json_response(0)
    if tail.startswith('/dev_mode'):
        return web.json_response({'enabled': False, 'guard_armed': False})
    if tail == '/update/status':
        return web.json_response({'state': 'idle'})
    print('unhandled aux', request.method, tail, flush=True)
    return web.json_response({}, status=404)


# MOCK_ACCESS=1: answer server.muon.access.* (Moonraker muon_access_api) as
# the contract case "one owner, Open, a guest at home" in Moonraker's
# tests/assets/muon_access_contract.json. set_* is not applied; a request
# is allowed at the "panel" after 6 s.
import os as _os, time as _time
MOCK_ACCESS = _os.environ.get('MOCK_ACCESS') == '1'
ACCESS_STATE = {
    'owner': {'kind': 'account', 'email': 'sam@example.com'},
    'entry': 'open',
    'you': {'level': 'signed-out-guest', 'role': 'operator', 'trusted': False, 'principal': 'anyone at home'},
    'ways': {'email': {'on': False}, 'link': {'on': False}, 'password': {'on': False}, 'approve': {'on': False}},
    'privateUploads': False, 'dataMode': 'shared', 'levelsPreset': 'relaxed'}
ACCESS_CAPS = {'read': 'allowed', 'emergency_stop': 'allowed', 'print': 'allowed', 'files': 'allowed',
               'motion': 'allowed', 'files_others': 'refused', 'console': 'refused', 'wifi': 'allowed',
               'hotspot': 'refused', 'updates': 'refused', 'rename': 'refused', 'config': 'refused',
               'protection': 'ask', 'ui_settings': 'allowed', 'system': 'refused'}
ACCESS_REQUESTS = {}


async def http_access(request, name):
    if name == 'get':
        return web.json_response({'result': ACCESS_STATE})
    if name == 'capabilities':
        return web.json_response({'result': {'actions': ACCESS_CAPS}})
    if name.startswith('set_'):
        return web.json_response({'result': {'applied': False}})
    if name == 'request':
        rid = f'r{len(ACCESS_REQUESTS) + 1}-mock'
        ACCESS_REQUESTS[rid] = _time.time()
        return web.json_response({'result': {'requestId': rid, 'code': '3F9A', 'expiresAt': int((_time.time() + 120) * 1000)}})
    if name == 'request_status':
        t = ACCESS_REQUESTS.get(request.query.get('request_id'))
        status = 'expired' if t is None else ('allowed' if _time.time() - t > 6 else 'pending')
        return web.json_response({'result': {'status': status}})
    if name == 'cancel_request':
        ACCESS_REQUESTS.pop(request.query.get('request_id'), None)
        return web.json_response({'result': 'ok'})
    return web.json_response({'error': {'code': 404, 'message': 'Not Found'}}, status=404)


async def http_generic(request):
    path = request.path
    if MOCK_ACCESS and path.startswith('/server/muon/access/'):
        return await http_access(request, path.rsplit('/', 1)[1])
    if path == '/server/info':
        return web.json_response({'result': server_info()})
    if path == '/server/muon/protection':
        return web.json_response({'result': protection()})
    if path == '/access/oneshot_token':
        return web.json_response({'result': 'x'})
    if path == '/access/info':
        return web.json_response({'result': {'default_source': 'moonraker', 'available_sources': ['moonraker']}})
    if path.startswith('/access/'):
        return web.json_response({'result': {'username': '_TRUSTED_USER_', 'source': 'moonraker'}})
    if path.startswith('/server/muon/dev_mode') or path.startswith('/server/aux/dev_mode'):
        return web.json_response({'enabled': False, 'guard_armed': False})
    if path.startswith('/server/aux/wifi/status') or path.startswith('/server/aux/ap'):
        return web.json_response({'connected': True, 'ssid': 'Workshop', 'signal': 72, 'enabled': False})
    print('unhandled http', request.method, path, flush=True)
    return web.json_response({'result': {}}, status=404)


@web.middleware
async def cors(request, handler):
    if request.method == 'OPTIONS':
        resp = web.Response()
    else:
        resp = await handler(request)
    resp.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
    resp.headers['Access-Control-Allow-Headers'] = '*'
    resp.headers['Access-Control-Allow-Methods'] = '*'
    resp.headers['Access-Control-Allow-Credentials'] = 'true'
    return resp


app = web.Application(middlewares=[cors])
app.router.add_get('/websocket', ws_handler)
app.router.add_route('*', '/server/database/item', http_db)
app.router.add_route('*', '/server/aux/{tail:.*}', http_aux)
app.router.add_route('*', '/{tail:.*}', http_generic)

if __name__ == '__main__':
    web.run_app(app, host='127.0.0.1', port=PORT, print=lambda *_: print(f'mock moonraker on {PORT}', flush=True))
