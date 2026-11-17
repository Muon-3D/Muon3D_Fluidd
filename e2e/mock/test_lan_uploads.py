import unittest

from aiohttp import FormData, web
from aiohttp.test_utils import TestClient, TestServer

import lan_uploads


class LanUploadsTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        app = web.Application()
        app.router.add_route('*', '/e2e/uploads/{session}', lan_uploads.control)
        app.router.add_post('/server/files/upload', lan_uploads.upload)
        self.client = TestClient(TestServer(app))
        await self.client.start_server()
        await self.client.post('/e2e/uploads/unit', json={})

    async def asyncTearDown(self):
        await self.client.close()
        lan_uploads.SESSIONS.pop('unit', None)

    async def send(self, contents, root='gcodes', checksum=None):
        form = FormData()
        form.add_field('file', contents, filename='part.gcode')
        form.add_field('path', 'parts')
        form.add_field('root', root)
        if checksum:
            form.add_field('checksum', checksum)
        return await self.client.post('/server/files/upload', data=form,
                                      headers={'X-E2E-Upload-Session': 'unit'})

    async def test_normal_and_empty_uploads_publish_only_to_their_folder(self):
        for contents in (b'G28\n', b''):
            response = await self.send(contents)
            self.assertEqual(response.status, 201)
        state = lan_uploads.SESSIONS['unit']
        self.assertEqual([file['size'] for file in state['files']], [4, 0])
        self.assertEqual(lan_uploads.directory(state, 'gcodes')['files'], [])
        self.assertEqual(len(lan_uploads.directory(state, 'gcodes/parts')['files']), 2)
        self.assertEqual(state['staged'], [])

    async def test_invalid_root_does_not_publish_or_leave_staging(self):
        response = await self.send(b'G28\n', root='invalid')
        self.assertEqual(response.status, 400)
        state = lan_uploads.SESSIONS['unit']
        self.assertEqual(state['files'], [])
        self.assertEqual(state['staged'], [])

    async def test_checksum_error_does_not_publish_or_leave_staging(self):
        response = await self.send(b'G28\n', checksum='wrong')
        self.assertEqual(response.status, 422)
        state = lan_uploads.SESSIONS['unit']
        self.assertEqual(state['files'], [])
        self.assertEqual(state['staged'], [])


if __name__ == '__main__':
    unittest.main()
