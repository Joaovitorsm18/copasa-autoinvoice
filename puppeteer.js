const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

(async () => {
	const browser = await puppeteer.launch({ headless: false }); // Headless false para ver o navegador em ação
	const page = await browser.newPage();

	let userSID = null;
	let formattedCookies = null;

	// Vá até a página de login da Copasa
	await page.goto("https://copasaportalprd.azurewebsites.net/Copasa.Portal/Login/index");

	// Preencher login e senha
	await page.type("#cpfInput", "");
	await page.type("#passwordInput", "");
	await page.click('button[type="submit"]');

	// Seletor do elemento <img>
	const selector = 'img[src="/Copasa.Portal/icons/logo_copasa_agencia_virtual.png"]';

	// Aguarda o elemento estar visível na página
	await page.waitForSelector(selector, { visible: true });
	// Clica no elemento
	await page.click(selector);

	// Aguarde até que o login seja concluído
	await page.waitForNavigation();

	await page.goto("https://copasaportalprd.azurewebsites.net/Copasa.Portal/Services/MyAccount_ListIdentifiers");

	//await new Promise(resolve => setTimeout(resolve, 1000)); // Aguarda 9 segundos
	page.on("request", async (request) => {
		const url = request.url();

		// Verificar se a requisição é para a URL desejada
		if (url === "https://copasaportalprd.azurewebsites.net/Copasa.Portal/Services/MyAccount_DuplicateOfAccounts_GetOpenInvoices") {
			console.log("Requisição Capturada:");
			console.log("URL:", url);

			// Capturar o Post Data
			const postData = request.postData();
			if (postData) {
				const params = new URLSearchParams(postData);
				userSID = params.get("userSID");
			}
			const cookies = await page.cookies();
			formattedCookies = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
		}
	});

	await page.waitForSelector('input[name="RadioName"][id="RadioID"]', { visible: true });
	await page.click('input[name="RadioName"][id="RadioID"]');
	//await page.click('input[id="RadioID"]');
	await page.click('button[id="btnproceed"]');

	// Aguarda tempo necessário para capturar as requisições
	await new Promise((resolve) => setTimeout(resolve, 9000));

	if (!userSID || !formattedCookies) {
		throw new Error("userSID ou cookies não foram capturados.");
	}

	// Salva o userSID e os cookies em um arquivo
	const configPath = path.resolve(__dirname, "config.json");
	fs.writeFileSync(configPath, JSON.stringify({ userSID, formattedCookies }, null, 2));

	console.log("userSID e Cookies salvos com sucesso!");
	await new Promise((resolve) => setTimeout(resolve, 6000));
	await browser.close();
})();
