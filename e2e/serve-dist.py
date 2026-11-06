"""Serve a built Control (vite build output) for e2e/playwright.prod.config.ts.

Every unknown path gets index.html, as the hosted site does for its routes.
It listens on 127.0.0.1, which the prod config uses as its base URL.

    python e2e/serve-dist.py ../dist-prod-check 8091
"""
import http.server
import os
import sys

root, port = sys.argv[1], int(sys.argv[2])


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=root, **kwargs)

    def send_head(self):
        path = self.translate_path(self.path.split('?', 1)[0])
        if not os.path.exists(path):
            self.path = '/index.html'
        return super().send_head()

    def log_message(self, *args):
        pass


http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
