from datetime import datetime, timezone
from playwright.sync_api import sync_playwright
import urllib.parse
from token_email import get_token_email
import json
import os
from dotenv import load_dotenv

load_dotenv()

def get_token(cpf, senha):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        # Prepara para capturar o userSID
        userSID_data = {}

        def handle_request(request):
            if "MyAccount_ListIdentifiers_GetIdentifiers" in request.url and request.method == "POST":
                post_data = request.post_data
                if post_data:
                    parsed = urllib.parse.parse_qs(post_data)
                    if "userSID" in parsed:
                        userSID_data["value"] = parsed["userSID"][0]
                        print("✅ userSID capturado:", userSID_data["value"])

        page.on("request", handle_request)

        page.goto("https://copasaportalprd.azurewebsites.net/Copasa.Portal/Login/index")

        # Aguarda o formulário de login carregar
        page.wait_for_selector("input[id='cpfInput']")

        # Preenche login e senha
        page.fill("input[id='cpfInput']", cpf)
        page.fill("input[id='passwordInput']", senha)

        # Envia o formulário
        page.click("button:has-text('Entrar')")

        # Aguarda o botão OK e clica
        page.wait_for_selector("button[id='btnOk']", timeout=10000)
        page.click("button[id='btnOk']")

        click_time = datetime.now(timezone.utc)

        page.wait_for_timeout(2000)

        token = get_token_email(click_time)

        page.wait_for_timeout(10000)
        
        # Preenche o token
        page.wait_for_selector("input[id='tokenInput']", timeout=15000)
        page.fill("input[id='tokenInput']", token)

        page.click("button:has-text('Validar')")

        # Aguarda o login ser concluído
        page.wait_for_selector("img[src='/Copasa.Portal/icons/logo_copasa_agencia_virtual.png']", timeout=15000)
        page.click("img[src='/Copasa.Portal/icons/logo_copasa_agencia_virtual.png']")
        
        # Aguarda a navegação completa
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(5000)

        print("Título da página após login:", page.title())
        
        # Navega para a página que contém as requisições com userSID
        page.goto("https://copasaportalprd.azurewebsites.net/Copasa.Portal/Services/MyAccount_ListIdentifiers")
        
        # Aguarda mais tempo para garantir que todas as requisições sejam feitas
        page.wait_for_timeout(15000)
        
        # Aguarda especificamente por uma requisição que contenha userSID
        try:
            page.wait_for_function("""
                () => {
                    return typeof window.userSID_captured !== 'undefined' && window.userSID_captured !== null;
                }
            """, timeout=30000)
        except:
            print("⚠️ userSID não capturado via wait_for_function, tentando alternativa...")

        # Captura TODOS os cookies após o login completo
        cookies = context.cookies()
        formattedCookies = "; ".join(f"{cookie['name']}={cookie['value']}" for cookie in cookies)
        
        print("🍪 Cookies capturados:")
        for cookie in cookies:
            print(f"  {cookie['name']}: {cookie['value'][:50]}...")
        
        # Salva as credenciais
        with open('config.json', 'w', encoding='utf-8') as f:
            json.dump(
                {
                    "userSID": userSID_data.get("value", "NÃO CAPTURADO"),
                    "formattedCookies": formattedCookies,
                    "cookies": cookies  # Salva todos os cookies detalhados
                },
                f,
                indent=2,
                ensure_ascii=False
            )
        
        print("✅ Configuração salva em config.json")
        
        # Fecha o browser
        browser.close()

get_token(os.getenv("CPF"), os.getenv("SENHA"))