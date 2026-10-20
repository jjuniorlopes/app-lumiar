import httpx

BASE_URL = "http://localhost:8000/api/v1"

def test_full_cultural_flow():
    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Login
        login_res = client.post("/auth/login", json={
            "email": "admin@lumiar.dev",
            "password": "Lumiar@2026"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("1. Login OK -> Token obtido")

        # 2. Stats
        stats_res = client.get("/cultural/stats", headers=headers)
        assert stats_res.status_code == 200, f"Stats failed: {stats_res.text}"
        print(f"2. Stats OK -> {stats_res.json()}")

        # 3. Create Space
        space_res = client.post("/cultural/spaces", headers=headers, json={
            "name": "Galeria das Turbinas Hidráulicas",
            "description": "Espaço dedicado às máquinas e condutos forçados da primeira usina."
        })
        assert space_res.status_code == 200, f"Create space failed: {space_res.text}"
        space_id = space_res.json()["id"]
        print(f"3. Create Space OK -> ID {space_id}")

        # 4. Create Cultural Item
        item_res = client.post("/cultural/items", headers=headers, json={
            "space_id": space_id,
            "code": "MS-003",
            "title": "Manômetro Industrial Bourdon de Alta Pressão",
            "author": "Schaeffer & Budenberg",
            "year": "1905",
            "category": "Instrumentos de Medição",
            "short_description": "Manômetro mecânico circular em latão com ponteiro de precisão para vapor.",
            "curator_notes": "Preservado com mostrador original esmaltado."
        })
        assert item_res.status_code == 200, f"Create item failed: {item_res.text}"
        item_data = item_res.json()
        item_id = item_data["id"]
        qr_token = item_data["qr_token"]
        print(f"4. Create Item OK -> ID {item_id}, Token {qr_token}")

        # 5. Fetch Item Details
        get_res = client.get(f"/cultural/items/{item_id}", headers=headers)
        assert get_res.status_code == 200, f"Get item failed: {get_res.text}"
        item_detail = get_res.json()
        print(f"5. Get Item Details OK -> Audiodescrição provisória gerada: {item_detail['audio_description'][:80]}...")

        # 6. Curator Review & Approval
        review_res = client.post(f"/cultural/items/{item_id}/review", headers=headers, json={
            "audio_description": (
                "Instrumento circular de medição de pressão com carcaça espessa em latão dourado polido, "
                "medindo aproximadamente vinte e cinco centímetros de diâmetro. Na face frontal, sob visor de vidro "
                "plano, localiza-se o mostrador em esmalte branco graduado em atmosferas de zero a vinte e cinco. "
                "O ponteiro metálico preto fino aponta atualmente para o zero na posição inferior esquerda. "
                "Abaixo do mostrador projeta-se o bocal de latão sextavado com rosca padrão para conexão ao conduto."
            ),
            "curator_notes": "Revisão eMAG 3.0 concluída e homologada pela curadoria do museu."
        })
        assert review_res.status_code == 200, f"Review failed: {review_res.text}"
        print("6. Curadoria & Revisão eMAG 3.0 -> Aprovado com sucesso!")

        # 7. QR Code Generation
        qr_res = client.get(f"/cultural/items/{item_id}/qr", headers=headers)
        assert qr_res.status_code == 200, f"QR code failed: {qr_res.text}"
        assert qr_res.headers["content-type"] == "image/png"
        assert len(qr_res.content) > 100
        print(f"7. QR Code PNG gerado -> {len(qr_res.content)} bytes de imagem")

        # 8. Public Mobile Scan
        scan_res = client.get(f"/public/scan/{qr_token}")
        assert scan_res.status_code == 200, f"Public scan failed: {scan_res.text}"
        scan_data = scan_res.json()
        assert scan_data["title"] == "Manômetro Industrial Bourdon de Alta Pressão"
        assert scan_data["is_reviewed"] == True
        print(f"8. Leitor Mobile (Public Scan) OK -> Obra '{scan_data['title']}' validada pelo leitor!")

        # 9. Public Chat com a assistente Lumi
        chat_res = client.post("/public/chat", json={
            "qr_token": qr_token,
            "question": "Qual é a unidade de medida deste manômetro?"
        })
        assert chat_res.status_code == 200, f"Chat failed: {chat_res.text}"
        chat_data = chat_res.json()
        print(f"9. Chat com a Lumi OK -> Resposta: \"{chat_data['answer']}\"")

        # 10. Offline Pack
        slug = scan_data["organization"]["slug"]
        offline_res = client.get(f"/public/organization/{slug}/offline-pack")
        assert offline_res.status_code == 200, f"Offline pack failed: {offline_res.text}"
        offline_pack = offline_res.json()
        print(f"10. Pacote Offline do Museu OK -> {len(offline_pack['spaces'])} espaços, {len(offline_pack['items'])} itens baixados para cache do app.")

    print("\nTODOS OS 10 TESTES DE FLUXO CULTURAL, MULTI-ORGANIZAÇÃO E MOBILE PASSARAM COM 100% DE SUCESSO!")

if __name__ == "__main__":
    test_full_cultural_flow()

