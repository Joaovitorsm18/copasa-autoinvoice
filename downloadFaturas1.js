// Importações e Configurações
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");
const config = require("./config.json");

const condominios = require("./condominios");

// Substitua com o valor real de idCpfCnpj e company
const idCpfCnpj = "";
const company = "Copasa";
const url = "https://copasaproddyn365api.azurewebsites.net";
const { userSID, formattedCookies } = config;

// Configurações do HTTPS
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Constantes para re-tentativa
const MAX_RETRIES = 50; // Número máximo de tentativas
const RETRY_DELAY = 100; // Tempo de espera entre tentativas (em milissegundos)

// Utilitários
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatDate = (dateString) => {
	if (!dateString || dateString.length !== 8) {
		console.error(`Data inválida ou no formato incorreto: ${dateString}`);
		return "Data_Invalida";
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
			"https://copasaportalprd.azurewebsites.net/Copasa.Portal/Services/MyAccount_DuplicateOfAccounts_GetOpenInvoices",
			{
				Identifier: identifier,
				Registration: registration,
				url: url,
				Company: company,
				userSID: userSID,
			},
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
					Cookie: formattedCookies,
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
	const sanitizedVencimento = vencimento.replace(/\//g, "-");
	const filePath = path.resolve("./Faturas", `${nomeCondominio} Vencimento ${sanitizedVencimento}   ${fatura.numeroFatura}.pdf`);

	try {
		if (fs.existsSync(filePath)) {
			console.log(`A fatura de vencimento ${sanitizedVencimento} já existe para ${nomeCondominio}. O download não será realizado.`);
			return;
		}

		const response = await axios.get(
			`https://wwwapp.copasa.com.br/servicos/WebServiceAPI/Prd/CopasaAtende/api/fatura/download/PDF/Copasa/${fatura.numeroFatura}`,
			{ responseType: "stream", httpsAgent }
		);

		const writer = fs.createWriteStream(filePath);
		response.data.pipe(writer);
		writer.on("finish", () => console.log(`Fatura ${fatura.numeroFatura} baixada com sucesso para ${nomeCondominio}!`));
		writer.on("error", () => console.log(`Erro ao baixar a fatura ${fatura.numeroFatura} para ${nomeCondominio}`));
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

	const { valorTotalDebito, faturas } = faturasData;
	console.log(`Valor total do débito ${nome}: ${valorTotalDebito}`);

	if (!faturas || faturas.length === 0) {
		console.log(`Nenhuma fatura encontrada para o identificador ${identifier} e matrícula ${registration}`);
		return;
	}

	for (const fatura of faturas) {
		const vencimento = formatDate(fatura.dataVencimento);
		if (!dataBase || new Date(vencimento.split("-").reverse().join("-")) >= dataBase) {
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
start().then(() => console.log("Processo concluído."));
