import unittest
from types import SimpleNamespace

from starlette.requests import Request
from starlette.responses import HTMLResponse, JSONResponse

from app.routers.public import public_scan_item


class _FakeQuery:
    def __init__(self, item):
        self.item = item

    def filter_by(self, **_):
        return self

    def first(self):
        return self.item


class _FakeDatabase:
    def __init__(self, item):
        self.item = item

    def query(self, _):
        return _FakeQuery(self.item)

    def commit(self):
        pass


def _request(accept):
    return Request(
        {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": "GET",
            "scheme": "http",
            "path": "/api/v1/public/scan/test-token",
            "raw_path": b"/api/v1/public/scan/test-token",
            "query_string": b"",
            "headers": [(b"accept", accept.encode("ascii"))],
            "server": ("testserver", 80),
            "client": ("127.0.0.1", 1234),
        }
    )


def _item():
    return SimpleNamespace(
        id=1,
        code="TEST-001",
        title="Obra sem espaço",
        author=None,
        year=None,
        category=None,
        image_url=None,
        audio_url=None,
        short_description=None,
        audio_description="Audiodescrição de teste.",
        is_reviewed=True,
        scan_count=0,
        space=None,
        organization=SimpleNamespace(id=1, name="Museu de teste", slug="museu"),
    )


class PublicScanTests(unittest.TestCase):
    def _scan(self, accept):
        item = _item()
        response = public_scan_item(
            request=_request(accept),
            qr_token="test-token",
            token=None,
            format=None,
            db=_FakeDatabase(item),
        )
        return response

    def test_mobile_api_request_gets_json(self):
        response = self._scan("application/json")

        self.assertIsInstance(response, JSONResponse)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Obra sem espa\xc3\xa7o", response.body)

    def test_browser_qr_request_renders_when_item_has_no_space(self):
        response = self._scan("text/html,application/xhtml+xml")

        self.assertIsInstance(response, HTMLResponse)
        self.assertEqual(response.status_code, 200)
        page = response.body.decode("utf-8")
        self.assertIn("Exposição Geral", page)
        self.assertIn('aria-label="Parar áudio"', page)
        self.assertIn('aria-label="Avançar uma frase"', page)
        self.assertIn('aria-label="Voltar uma frase"', page)
        self.assertIn("Escanear outro QR Code", page)
        self.assertIn("Fotografar QR Code", page)
        self.assertIn("Falar com a Lumi", page)


if __name__ == "__main__":
    unittest.main()
