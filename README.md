# 💧 Copasa Invoice Downloader

Sistema automatizado para download em massa de faturas da Copasa para múltiplos condomínios. Utiliza autenticação segura via Playwright e processamento em lote com Axios.

## 🚀 Funcionalidades

- 🔐 **Autenticação Automática** com captura de cookies e tokens via Playwright
- 📋 **Processamento em Lote** para múltiplos condomínios
- 💾 **Download Organizado** de faturas em PDF
- 🔄 **Sistema de Retry** inteligente (até 50 tentativas)
- 📧 **Integração com E-mail** para captura automática de tokens
- 🛡️ **Gestão Segura** de credenciais sensíveis
- ⏰ **Validação de Datas** para evitar downloads duplicados

---

## 📁 Estrutura do Projeto

```
📁 copasa-invoice-downloader/
├── 🐍 obter_credenciais.py       # Autenticação com Playwright
├── ⚡ index.js                   # Script principal de download
├── 📧 token_email.py            # Captura de token via e-mail
├── 📋 condominios.js            # Lista de condomínios
├── 🔐 config.json               # Credenciais de sessão (NÃO versionar!)
├── 📄 requirements.txt          # Dependências Python
├── 📄 package.json              # Dependências Node.js
└── 📁 Faturas/                  # Pasta de destino dos downloads
```

---

## ⚙️ Configuração

### 1. Pré-requisitos
- **Node.js** (v16 ou superior)
- **Python** (3.8 ou superior)
- **Conta Copasa** com acesso ao portal
- **E-mail Gmail** para recebimento de tokens

### 2. Instalação

```bash
# Instalar dependências Node.js
npm install

# Instalar dependências Python
pip install -r requirements.txt

# Instalar browsers para Playwright
playwright install
```

### 3. Configuração de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Credenciais Copasa
CPF=seu_cpf_aqui
SENHA=sua_senha_copasa

# Configurações de E-mail (Gmail)
EMAIL_REMETENTE=seu_email@gmail.com
EMAIL_SENHA=sua_senha_app_gmail
```

### 4. Configuração dos Condomínios

Edite `condominios.js`:

```javascript
const condominios = [
    {
        nome: 'Condomínio Exemplo',
        identifier: '123456789',
        registration: 'MAT001'
    },
    {
        nome: 'Meu Condomínio', 
        identifier: '987654321',
        registration: 'MAT002'
    }
];
```

---

## 🎯 Como Usar

### Fluxo Completo:

```bash
# 1. Capturar credenciais e cookies (Python + Playwright)
python obter_credenciais.py

# 2. Baixar faturas (Node.js + Axios)
node index.js
```

---

## 🔄 Fluxo de Execução Detalhado

### 1. **Autenticação** (`obter_credenciais.py`)
- 🌐 Acessa portal Copasa via Playwright
- 🔑 Realiza login com CPF/senha do `.env`
- 📧 Aguarda token de verificação via e-mail
- 🍪 Extrai cookies de sessão e userSID
- 💾 Salva configuração em `config.json`

### 2. **Captura de Token** (`token_email.py`)
- 📨 Monitora caixa postal Gmail via IMAP
- 🔍 Busca e-mails do `crm.acesso@copasa.com.br`
- 📝 Extrai código de 6 dígitos automaticamente
- 🗑️ Limpa e-mails processados

### 3. **Download de Faturas** (`index.js`)
- 📋 Itera sobre cada condomínio em `condominios.js`
- 🔁 Sistema de retry com 50 tentativas e delay
- 📊 Consulta API para faturas pendentes
- 💰 Obtém valor total e detalhes
- 📄 Baixa PDF de cada fatura
- 🗂️ Salva com nome padronizado

### 4. **Estrutura de Saída**
```
Faturas/
├── Condomínio Exemplo Vencimento 15-12-2024   123456.pdf
├── Meu Condomínio Vencimento 20-12-2024   789012.pdf
└── ...
```

---

## ⚡ Scripts Principais

### `obter_credenciais.py` (Python)
```python
# Funcionalidades:
# - Autenticação interativa no portal Copasa
# - Captura de userSID das requisições HTTP
# - Integração com token_email.py para verificação
# - Salvamento seguro das credenciais
```

### `index.js` (Node.js)
```javascript
// Funcionalidades:
// - Processamento em lote assíncrono
// - Sistema de retry robusto (50 tentativas)
// - Validação de faturas existentes
// - Download e decodificação de PDFs base64
// - Logs detalhados do processo
```

### `token_email.py` (Python)
```python
# Funcionalidades:
# - Conexão IMAP segura com Gmail
# - Parse inteligente de e-mails HTML/texto
# - Extração regex de tokens numéricos
# - Limpeza automática de caixa postal
```

---

## 🛡️ Segurança e Boas Práticas

### Arquivos Sensíveis (NÃO VERSIONAR)
```gitignore
# .gitignore
config.json
.env
node_modules/
__pycache__/
*.pyc
```

### Configuração Segura
- Use **senhas de aplicativo** no Gmail
- Revise periodicamente as permissões
- Mantenha as dependências atualizadas
- Armazene `.env` localmente apenas

### Gerenciamento de Sessão
- As credenciais em `config.json` expiram periodicamente
- Execute `obter_credenciais.py` quando necessário
- Monitore logs para erros de autenticação

---

## 🔧 Solução de Problemas

### Erro de Autenticação
```bash
# Limpar configuração e recapturar
rm config.json
python obter_credenciais.py
```

### Token Não Encontrado
- Verifique se o e-mail está acessível via IMAP
- Confirme se o remetente é `crm.acesso@copasa.com.br`
- Verifique a pasta de spam
- Teste conexão IMAP manualmente

### Download Falhando
```bash
# Executar com logs detalhados
DEBUG=true node index.js

# Verificar conectividade API
curl -X POST "https://copasaproddyn365api.azurewebsites.net/api/Ocorrencia/MyAccount_GetPdf"
```

### Problemas de Playwright
```bash
# Reinstalar browsers
playwright install

# Verificar dependências
python -c "import playwright; print('Playwright OK')"
```

---

## 📋 Dependências

### Python (`requirements.txt`)
```
playwright==1.53.0
beautifulsoup4==4.13.4
python-dotenv==1.1.1
greenlet==3.2.3
```

### Node.js (`package.json`)
```json
{
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

---

## 🚨 Limitações Conhecidas

- ⏰ Sessões Copasa expiram periodicamente (requer reautenticação)
- 📧 Configuração de e-mail limitada ao Gmail (IMAP)
- 🔌 Dependente da estabilidade da API da Copasa
- 🌐 Requer conexão internet estável para autenticação

---

## 📞 Suporte

### Logs e Debug
- Verifique `config.json` para credenciais capturadas
- Monitore console para erros detalhados
- Valide dados em `condominios.js`

### Validação Rápida
```bash
# Testar autenticação
python obter_credenciais.py

# Testar lista de condomínios
node -e "console.log(require('./condominios.js'))"

# Testar configuração
node -e "console.log(require('./config.json'))"
```

---

## 👨‍💻 Autor

Desenvolvido para automação de processos administrativos de condomínios.

**⚠️ Aviso:** Este projeto é para uso interno. Mantenha credenciais seguras e não as compartilhe publicamente.

---

**💡 Dica:** Execute mensalmente para manter as faturas organizadas e evitar pendências financeiras!