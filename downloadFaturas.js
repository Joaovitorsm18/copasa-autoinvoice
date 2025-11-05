// Importações e Configurações
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
const config = require('./config.json')

const condominios = require('./condominios');



// Substitua com o valor real de idCpfCnpj e company
const idCpfCnpj = '';
const company = 'Copasa';
const url = 'https://copasaproddyn365api.azurewebsites.net'
const {userSID, formattedCookies} = config;
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Constantes para re-tentativa
const MAX_RETRIES = 50; // Número máximo de tentativas
const RETRY_DELAY = 100; // Tempo de espera entre tentativas (em milissegundos)

// Utilitários
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const formatDate = (dateString) => {
    if (!dateString || dateString.length !== 8) {
        console.error(`Data inválida ou no formato incorreto: ${dateString}`);
        return 'Data_Invalida';
    }
    const year = dateString.slice(0, 4);
    const month = dateString.slice(4, 6);
    const day = dateString.slice(6, 8);
    return `${day}-${month}-${year}`;
};

// Funções principais


const obterFaturasComRetentativa = async (identifier, registration) => {
    for (let tentativa = 1; tentativa <= MAX_RETRIES; tentativa++) {
        const faturasData = await obterFaturas(identifier, registration);
        

        if (faturasData && faturasData.Message !== "Authorization has been denied for this request.") {
            console.log(`Tentativa ${tentativa}: Faturas obtidas com sucesso.`);
            return faturasData;
        }

       // console.log(`Tentativa ${tentativa} falhou. Retentando em ${RETRY_DELAY / 1000} segundos...`);
        if (tentativa < MAX_RETRIES) {
            await delay(RETRY_DELAY);
        }
    }

    console.log(`Erro após ${MAX_RETRIES} tentativas.`);
    return null;
};

const obterFaturas = async (identifier, registration) => {
    try {
        
        const response = await axios.post(
            'https://copasaportalprd.azurewebsites.net/Copasa.Portal/Services/MyAccount_DuplicateOfAccounts_GetOpenInvoices',
            {
                Identifier: identifier,
                Registration: registration,
                url: url,
                Company: company,
                userSID: userSID
            },
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Cookie': formattedCookies
                },
                
            }
        );
        return response.data;
        
    } catch (error) {
        console.error(`Erro ao obter faturas:`, error.message);
        return null;
    }
};

const baixarFatura = async (fatura, nomeCondominio, vencimento, descricao) => {
    const sanitizedVencimento = vencimento.replace(/\//g, '-');
    const filePath = path.resolve('G:/Meu Drive/T.I/AUTOMAÇÕES/Faturas', `${nomeCondominio} Vencimento ${sanitizedVencimento}   ${fatura.numeroFatura}.pdf`);

    try {
        if (fs.existsSync(filePath)) {
            console.log(`A fatura de vencimento ${sanitizedVencimento} já existe para ${nomeCondominio}. O download não será realizado.`);
            return;
        }

        const payload = {
            company: "COPASA",
            invoiceNumber: fatura.numeroFatura,
            IdentifierNumber: fatura.identificador, 
            Origem: "Web",
            matricula: fatura.matricula,    
            numeroprotocolo: '0'
        }
        
        //console.log(payload)
        const response = await axios.post(
            "https://copasaproddyn365api.azurewebsites.net/api/Ocorrencia/MyAccount_GetPdf",
            payload
        );

        // A API retorna Base64, então precisamos decodificar
        const pdfBase64 = response.data; 
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        fs.writeFileSync(filePath, pdfBuffer);
        console.log(`Fatura ${fatura.numeroFatura} baixada com sucesso para ${nomeCondominio}!`);

    } catch (error) {
        console.log(`Erro na requisição do download da fatura ${fatura.numeroFatura}:`, error.message);
    }
    await delay(1000);
};

const processarFaturas = async (condominio, dataBase = null) => {
    const { nome, identifier, registration } = condominio;
    console.log(`Processando ${nome}...`);

    const faturasData = await obterFaturasComRetentativa(identifier, registration);
    if (!faturasData) {
        console.log(`Erro persistente ao obter faturas para ${nome}`);
        return;
    }

    const { valorTotalDebito, faturas , descricaoRetorno} = faturasData;
    if (descricaoRetorno == 'Dados inconsistentes') {
        console.log("❌ ---------------- Dados inconsistentes -----------------❌")
    } else {
        console.log(`Valor total do débito ${nome}: ${valorTotalDebito}`);
    }

    if (!faturas || faturas.length === 0) {
        console.log(`Nenhuma fatura encontrada para o identificador ${identifier} e matrícula ${registration}`);
        return;
    }

    /*
    const reference = faturas[0].referencia;
    const response = await axios.post(
        'https://copasaproddyn365api.azurewebsites.net/api/Ocorrencia/MyAccount_DuplicateOfAccounts_GetInvoiceDetails',
        {
            Registration: registration,
            Reference: reference,
            Company: company
        },
        { httpsAgent }
    );

    const detalhes = response.data;
    let descricao = detalhes.descricaoFatura;
    if (descricao === 'CONSUMO REAL') {
        descricao = '';
    }
*/
    for (const fatura of faturas) {
        const vencimento = formatDate(fatura.dataVencimento);
        if (!dataBase || new Date(vencimento.split('-').reverse().join('-')) >= dataBase) {
            console.log(`Baixando fatura com vencimento em: ${vencimento}`);
            await baixarFatura(fatura, nome, vencimento);
        }
    }
};

// Função para iniciar o processamento
async function start() {
    for (const condominio of condominios) {
        console.log("");
        await processarFaturas(condominio);
    }
}

// Execução do processo
start().then(() => console.log('Processo concluído.'));
