import asyncio
import io
import os
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException
from starlette.datastructures import Headers, UploadFile

from app.config import settings
from app.routers.core import get_showcase_images, upload_showcase_image


class ShowcaseImageTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.settings_patch = patch.object(settings, "storage_path", "uploads")
        self.settings_patch.start()
        self.cwd_patch = patch("app.routers.core.os.getcwd", return_value=self.temp_dir.name)
        self.cwd_patch.start()

    def tearDown(self):
        self.cwd_patch.stop()
        self.settings_patch.stop()
        self.temp_dir.cleanup()

    def test_public_listing_contains_empty_image_slots_by_default(self):
        images = get_showcase_images()

        self.assertEqual(set(images), {"hero", "cultural", "guia"})
        self.assertEqual(images["hero"], {"url": "", "alt": ""})

    def test_system_admin_can_upload_image_with_alt_text(self):
        os.makedirs(os.path.join(self.temp_dir.name, "uploads"))
        content = b"\x89PNG\r\n\x1a\nimage content"
        uploaded_file = UploadFile(
            filename="museum.png",
            file=io.BytesIO(content),
            headers=Headers({"content-type": "image/png"}),
        )

        result = asyncio.run(
            upload_showcase_image(
                "hero",
                uploaded_file,
                "Visitante observa uma obra em exposição.",
                SimpleNamespace(role="superadmin"),
            )
        )

        self.assertTrue(result["url"].startswith("/uploads/showcase_hero_"))
        self.assertEqual(result["alt"], "Visitante observa uma obra em exposição.")
        self.assertEqual(get_showcase_images()["hero"], result)
        self.assertTrue(os.path.isfile(os.path.join(self.temp_dir.name, result["url"].lstrip("/"))))

    def test_non_system_admin_cannot_upload_public_site_image(self):
        uploaded_file = UploadFile(
            filename="museum.png",
            file=io.BytesIO(b"\x89PNG\r\n\x1a\nimage content"),
            headers=Headers({"content-type": "image/png"}),
        )

        with self.assertRaises(HTTPException) as error:
            asyncio.run(
                upload_showcase_image(
                    "hero",
                    uploaded_file,
                    "Visitante observa uma obra em exposição.",
                    SimpleNamespace(role="admin"),
                )
            )

        self.assertEqual(error.exception.status_code, 403)

    def test_svg_disguised_as_png_is_rejected(self):
        uploaded_file = UploadFile(
            filename="image.png",
            file=io.BytesIO(b"<svg xmlns='http://www.w3.org/2000/svg'/>"),
            headers=Headers({"content-type": "image/png"}),
        )

        with self.assertRaises(HTTPException) as error:
            asyncio.run(
                upload_showcase_image(
                    "hero",
                    uploaded_file,
                    "Ilustração colorida de um museu e visitantes.",
                    SimpleNamespace(role="superadmin"),
                )
            )

        self.assertEqual(error.exception.status_code, 415)


if __name__ == "__main__":
    unittest.main()
