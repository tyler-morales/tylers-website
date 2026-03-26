#!/usr/bin/env python3
"""Serve tools/vm-setup/images on :8765 with CORS so v86 can fetch the large HDA cross-origin from hugo server."""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images")
PORT = 8765


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers",
            "Range, Content-Type, X-Accept-Encoding",
        )
        self.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")
        super().end_headers()

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()


if __name__ == "__main__":
    os.chdir(DIR)
    print(f"Serving {DIR} at http://127.0.0.1:{PORT}/ (CORS enabled)")
    print("Needed for winxp-lite.img when Hugo excludes it from the static mount.")
    HTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
