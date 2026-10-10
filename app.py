import os
import socket
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8000"))
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def log_message(self, fmt, *args):
        print(f"[{self.address_string()}] {fmt % args}")


def main():
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    host_display = "localhost" if HOST == "0.0.0.0" else HOST
    print(f"Forex calculator running at http://{host_display}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()


if __name__ == "__main__":
    main()
