import imaplib
import email
import re
import os
from bs4 import BeautifulSoup
import time
from email.utils import parsedate_to_datetime

from dotenv import load_dotenv

load_dotenv()
EMAIL_USER = os.getenv("EMAIL_REMETENTE")
EMAIL_PASS = os.getenv("EMAIL_SENHA")
IMAP_SERVER = "imap.gmail.com"
IMAP_PORT = 993

mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
mail.login(EMAIL_USER, EMAIL_PASS)
mail.select("inbox")

status, messages = mail.search(None, '(FROM "crm.acesso@copasa.com.br")')
mail_ids = messages[0].split()

for mail_id in mail_ids:
    mail.store(mail_id, '+FLAGS', '\\Deleted')

mail.expunge() 
print(f"Deleted {len(mail_ids)} emails.")

email_infos = []
def get_token_email(start_time, timeout=60):
    import time

    print("⏳ Aguardando chegada do código...")

    start = time.time()
    while time.time() - start < timeout:
        # Recarrega a lista de e-mails mais recentes
        mail.select("inbox")
        status, messages = mail.search(None, '(FROM "crm.acesso@copasa.com.br")')
        mail_ids = messages[0].split()

        for email_id in reversed(mail_ids[-30:]):
            status, data = mail.fetch(email_id, "(RFC822)")
            raw_email = data[0][1]
            msg = email.message_from_bytes(raw_email)

            try:
                date_header = msg.get("Date")
                email_datetime = parsedate_to_datetime(date_header)
            except Exception:
                continue

            # if email_datetime < start_time:
            #     continue  # pula e-mails antigos

            # Extrair corpo
            body_text = ""
            body_html = ""
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    charset = part.get_content_charset() or "utf-8"
                    content = part.get_payload(decode=True).decode(charset, errors="ignore")
                    if content_type == "text/plain":
                        body_text = content
                    elif content_type == "text/html":
                        body_html = content
            else:
                content_type = msg.get_content_type()
                charset = msg.get_content_charset() or "utf-8"
                content = msg.get_payload(decode=True).decode(charset, errors="ignore")
                if content_type == "text/plain":
                    body_text = content
                elif content_type == "text/html":
                    body_html = content

            # Tenta extrair o código
            match = re.search(r"\b\d{6}\b", body_text)
            if match:
                print("✅ Código encontrado (texto):", match.group())
                return match.group()

            if body_html:
                soup = BeautifulSoup(body_html, "html.parser")
                full_text = soup.get_text(separator=" ", strip=True)
                print(full_text)
                print("🔍 Texto extraído do HTML:", full_text)

                match = re.search(r"\b\d{6}\b", full_text)
                if match:
                    token = match.group()
                    print("✅ Código encontrado (HTML):", token)
                    return token
                
                mail.store(mail_id, '+FLAGS', '\\Deleted')
                mail.delete()



        time.sleep(5)  # espera antes de tentar de novo

    raise Exception("❌ Token de verificação não encontrado no tempo limite.")

#get_token_email()