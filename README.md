# Copasa Invoice Downloader

Este projeto automatiza o download de faturas da Copasa para múltiplos condomínios. Ele utiliza Puppeteer para autenticação e captura de cookies, e Axios para requisições de API.

## Requisitos
- Node.js instalado
- NPM ou Yarn

## Configuração
1. Clone este repositório

2. Instale as dependências:
   ```sh
   npm install
   ```
3. Configure os arquivos necessários:
   - `config.json` (criado automaticamente pelo script Puppeteer)
   - `condominios.js` (insira os identificadores e matrículas dos condomínios)

## Execução
### 1. Capturar credenciais e cookies
Execute o script Puppeteer para obter `userSID` e cookies necessários:
```sh
node puppeteer.js
```

### 2. Baixar faturas
Após capturar as credenciais, execute:
```sh
node index.js
```

## Estrutura do Projeto
```
.
├── config.json          # Armazena userSID e cookies (NÃO compartilhe este arquivo!)
├── condominios.js       # Lista dos condomínios a serem processados
├── puppeteer.js         # Captura credenciais e cookies
├── index.js             # Processa e baixa as faturas
├── Faturas/             # Pasta onde as faturas serão salvas
```

## Medidas de Segurança
- **NÃO** compartilhe `config.json`, pois contém credenciais sensíveis.
- Use um arquivo `.gitignore` para evitar que ele seja enviado ao GitHub:
  ```sh
  echo "config.json" >> .gitignore
  ```
- Considere usar variáveis de ambiente para armazenar credenciais em produção.



