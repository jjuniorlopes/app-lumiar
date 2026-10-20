import unittest
from unittest.mock import patch

from app.config import settings
from app.services.ai_service import ask_lumi_assistant, generate_audiodescription


class _GeminiResponse:
    status_code = 200

    def raise_for_status(self):
        return None

    def json(self):
        return {
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": "A ficha informa que a peça é de aço."}]
                    }
                }
            ]
        }


class _GeminiClient:
    last_timeout = None
    last_url = None
    last_payload = None

    def __init__(self, timeout):
        type(self).last_timeout = timeout

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        return None

    async def post(self, url, json):
        type(self).last_url = url
        type(self).last_payload = json
        return _GeminiResponse()


class _ChatCompletionsResponse:
    def raise_for_status(self):
        return None

    def json(self):
        return {
            "choices": [
                {"message": {"content": "Posso ajudar com informações confirmadas da obra."}}
            ]
        }


class _OpenAiCompatibleClient:
    last_timeout = None
    last_url = None
    last_payload = None
    last_headers = None

    def __init__(self, timeout):
        type(self).last_timeout = timeout

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        return None

    async def post(self, url, json, headers):
        type(self).last_url = url
        type(self).last_payload = json
        type(self).last_headers = headers
        return _ChatCompletionsResponse()


class AiServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_chat_without_api_key_reports_missing_confirmed_information(self):
        with (
            patch.object(settings, "ai_provider", "auto"),
            patch.object(settings, "google_api_key", ""),
            patch.object(settings, "groq_api_key", ""),
            patch.object(settings, "openai_api_key", ""),
        ):
            answer = await ask_lumi_assistant(
                question="Qual era a função?",
                item_title="Peça do acervo",
                item_description="",
            )

        self.assertIn("ainda não está configurada", answer)
        self.assertNotIn("preservação e detalhes estruturais", answer)

    async def test_chat_uses_configured_model_timeout_and_token_limit(self):
        with (
            patch.object(settings, "ai_provider", "google"),
            patch.object(settings, "google_api_key", "test-key"),
            patch.object(settings, "groq_api_key", ""),
            patch.object(settings, "openai_api_key", ""),
            patch.object(settings, "ai_model", "gemini-test"),
            patch.object(settings, "ai_timeout_seconds", 17),
            patch.object(settings, "ai_chat_max_output_tokens", 256),
            patch("app.services.ai_service.httpx.AsyncClient", _GeminiClient),
        ):
            answer = await ask_lumi_assistant(
                question="Qual o material?",
                item_title="Peça do acervo",
                item_description="",
                conversation_history=[
                    {"role": "user", "text": "Estou visitando o museu."},
                    {"role": "assistant", "text": "Posso ajudar com a visita."},
                ],
            )

        self.assertEqual(answer, "A ficha informa que a peça é de aço.")
        self.assertIn("/models/gemini-test:generateContent", _GeminiClient.last_url)
        self.assertEqual(_GeminiClient.last_timeout, 17)
        self.assertEqual(_GeminiClient.last_payload["generationConfig"]["maxOutputTokens"], 256)
        self.assertIn("systemInstruction", _GeminiClient.last_payload)
        self.assertEqual(
            _GeminiClient.last_payload["contents"][:2],
            [
                {"role": "user", "parts": [{"text": "Estou visitando o museu."}]},
                {"role": "assistant", "parts": [{"text": "Posso ajudar com a visita."}]},
            ],
        )

    async def test_description_fallback_does_not_invent_object_characteristics(self):
        with patch.object(settings, "google_api_key", ""):
            description = await generate_audiodescription(
                title="Peça do acervo",
                category="Instrumento",
            )

        self.assertIn("não há uma audiodescrição validada disponível", description)
        self.assertNotIn("dimensões", description)
        self.assertNotIn("época de confecção", description)

    async def test_chat_uses_groq_chat_completions_api(self):
        with (
            patch.object(settings, "ai_provider", "groq"),
            patch.object(settings, "groq_api_key", "groq-test-key"),
            patch.object(settings, "groq_ai_model", "llama-test"),
            patch.object(settings, "ai_timeout_seconds", 14),
            patch("app.services.ai_service.httpx.AsyncClient", _OpenAiCompatibleClient),
        ):
            answer = await ask_lumi_assistant(
                question="Qual o material?",
                item_title="Peça do acervo",
                item_description="A ficha informa aço.",
            )

        self.assertEqual(answer, "Posso ajudar com informações confirmadas da obra.")
        self.assertEqual(
            _OpenAiCompatibleClient.last_url,
            "https://api.groq.com/openai/v1/chat/completions",
        )
        self.assertEqual(_OpenAiCompatibleClient.last_payload["model"], "llama-test")
        self.assertEqual(_OpenAiCompatibleClient.last_timeout, 14)
        self.assertEqual(
            _OpenAiCompatibleClient.last_headers["Authorization"],
            "Bearer groq-test-key",
        )

    async def test_chat_reports_selected_provider_without_its_api_key(self):
        with (
            patch.object(settings, "ai_provider", "groq"),
            patch.object(settings, "groq_api_key", ""),
        ):
            answer = await ask_lumi_assistant(
                question="Qual o material?",
                item_title="Peça do acervo",
                item_description="",
            )

        self.assertIn("Groq", answer)
        self.assertIn("chave de API não foi configurada", answer)


if __name__ == "__main__":
    unittest.main()
