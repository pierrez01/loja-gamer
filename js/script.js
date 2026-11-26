const menuToggle = document.getElementById("menu-toggle");
const nav = document.getElementById("nav");

menuToggle.addEventListener("click", function () {

    nav.classList.toggle("active");

    const menuAberto = nav.classList.contains("active");

    menuToggle.setAttribute("aria-expanded", menuAberto);

    menuToggle.setAttribute(
        "aria-label",
        menuAberto ? "Fechar menu" : "Abrir menu"
    );

});

// CARROSSEL ANIMADO

const carouselTrack = document.getElementById("carousel-track");
const carousel = document.getElementById("carousel");
const carouselDots = document.getElementById("carousel-dots");
const slides = document.querySelectorAll(".carousel-slide");

let slideAtual = 0;
let intervaloCarrossel = null;

function irParaSlide(indice) {

    slideAtual = (indice + slides.length) % slides.length;

    carouselTrack.style.transform =
        "translateX(-" + (slideAtual * 100) + "%)";

    slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === slideAtual);
    });

    document.querySelectorAll(".carousel-dot").forEach(function (dot, i) {
        dot.classList.toggle("active", i === slideAtual);
    });

}

function iniciarCarrossel() {
    pararCarrossel();
    intervaloCarrossel = setInterval(function () {
        irParaSlide(slideAtual + 1);
    }, 5000);
}

function pararCarrossel() {
    clearInterval(intervaloCarrossel);
}

slides.forEach(function (slide, i) {
    const dot = document.createElement("button");
    dot.classList.add("carousel-dot");
    dot.setAttribute("aria-label", "Ir para o slide " + (i + 1));
    dot.addEventListener("click", function () {
        irParaSlide(i);
        iniciarCarrossel();
    });
    carouselDots.appendChild(dot);
});

document.getElementById("carousel-prev").addEventListener("click", function () {
    irParaSlide(slideAtual - 1);
    iniciarCarrossel();
});

document.getElementById("carousel-next").addEventListener("click", function () {
    irParaSlide(slideAtual + 1);
    iniciarCarrossel();
});

carousel.addEventListener("mouseenter", pararCarrossel);
carousel.addEventListener("mouseleave", iniciarCarrossel);

irParaSlide(0);
iniciarCarrossel();

// CATÁLOGO DE PRODUTOS

const API_URLS = [
    "https://dummyjson.com/products/category/laptops?limit=30",

    "https://dummyjson.com/products/category/smartphones?limit=30",

    "https://dummyjson.com/products/category/mobile-accessories?limit=30",

    "https://dummyjson.com/products/category/tablets?limit=30",

    "https://dummyjson.com/products/category/headphones?limit=30"
];

const PRODUTOS_POR_PAGINA = 12;

const productsContainer = document.getElementById(
    "products-container"
);

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchStatus = document.getElementById("search-status");
const categoryButtons = document.querySelectorAll(".category-btn");
const loadMoreBtn = document.getElementById("load-more");

let catalogo = [];       // todos os produtos (API + complementares)
let listaAtual = [];     // produtos do filtro/busca atual
let exibidos = 0;        // quantos já aparecem na tela

function mostrarMensagem(texto) {

    productsContainer.innerHTML = "";
    loadMoreBtn.hidden = true;

    const mensagem = document.createElement("p");
    mensagem.classList.add("loading");
    mensagem.textContent = texto;

    productsContainer.appendChild(mensagem);

}

function criarCard(produto) {

    const card = document.createElement("article");
    card.classList.add("product-card");

    const imagem = document.createElement("img");
    imagem.src = produto.thumbnail;
    imagem.alt = produto.title;
    imagem.loading = "lazy";

    const nome = document.createElement("h3");
    nome.textContent = produto.title;

    const descricao = document.createElement("p");
    descricao.textContent = produto.description;

    const preco = document.createElement("span");
    preco.classList.add("product-price");

    preco.textContent = produto.price.toLocaleString(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }
    );

    card.appendChild(imagem);
    card.appendChild(nome);
    card.appendChild(descricao);
    card.appendChild(preco);

    return card;

}

function mostrarMais() {

    const proximos = listaAtual.slice(
        exibidos,
        exibidos + PRODUTOS_POR_PAGINA
    );

    proximos.forEach(function (produto) {
        productsContainer.appendChild(criarCard(produto));
    });

    exibidos += proximos.length;

    loadMoreBtn.hidden = exibidos >= listaAtual.length;

}

function exibirLista(lista) {

    listaAtual = lista;
    exibidos = 0;

    if (lista.length === 0) {
        mostrarMensagem("Nenhum produto encontrado.");
        return;
    }

    productsContainer.innerHTML = "";
    mostrarMais();

}

function normalizarCategoria(categoria) {
    return categoria === "mobile-accessories" ? "acessorios" : categoria;
}

async function buscarNaApi(url) {

    const resposta = await fetch(url);

    if (!resposta.ok) {
        throw new Error("Erro ao consultar a API");
    }

    const dados = await resposta.json();

    return dados.products;

}

async function carregarProdutos() {

    mostrarMensagem("Carregando produtos...");

    const resultados = await Promise.allSettled(
        API_URLS.map(buscarNaApi)
    );

    let produtosApi = [];
    let falhas = 0;

    resultados.forEach(function (resultado) {

        if (resultado.status === "fulfilled") {

            produtosApi = produtosApi.concat(
                resultado.value.map(function (produto) {
                    return {
                        title: produto.title,
                        description: produto.description,
                        price: produto.price,
                        thumbnail: produto.thumbnail,
                        category: normalizarCategoria(produto.category)
                    };
                })
            );

        } else {
            falhas++;
            console.error("Erro:", resultado.reason);
        }

    });

    catalogo = produtosApi.concat(PRODUTOS_EXTRAS);

    if (falhas > 0) {
        searchStatus.textContent =
            "Alguns produtos da API não puderam ser carregados.";
    }

    exibirLista(catalogo);

}

// BUSCA DE PRODUTOS

function pesquisarProdutos(termo) {

    const consulta = termo.toLowerCase();

    const resultados = catalogo.filter(function (produto) {

        const rotulo = ROTULOS_CATEGORIAS[produto.category] || "";

        return (
            produto.title.toLowerCase().includes(consulta) ||
            produto.description.toLowerCase().includes(consulta) ||
            rotulo.toLowerCase().includes(consulta)
        );

    });

    searchStatus.textContent =
        resultados.length === 0
            ? 'Nenhum resultado para "' + termo + '".'
            : resultados.length + ' resultado(s) para "' + termo + '".';

    exibirLista(resultados);

}

function ativarCategoria(categoria) {
    categoryButtons.forEach(function (botao) {
        botao.classList.toggle(
            "active",
            botao.dataset.category === categoria
        );
    });
}

function filtrarCategoria(categoria) {

    const filtrados = categoria === "todos"
        ? catalogo
        : catalogo.filter(function (produto) {
            return produto.category === categoria;
        });

    exibirLista(filtrados);

}

searchForm.addEventListener("submit", function (evento) {

    evento.preventDefault();

    const termo = searchInput.value.trim();

    if (termo === "") {
        searchStatus.textContent = "";
        ativarCategoria("todos");
        filtrarCategoria("todos");
        return;
    }

    ativarCategoria(null);
    pesquisarProdutos(termo);

});

// FILTRO POR CATEGORIAS

categoryButtons.forEach(function (botao) {

    botao.addEventListener("click", function () {

        const categoria = botao.dataset.category;

        searchInput.value = "";
        searchStatus.textContent = "";

        ativarCategoria(categoria);
        filtrarCategoria(categoria);

    });

});

loadMoreBtn.addEventListener("click", mostrarMais);

carregarProdutos();
// CATÁLOGO COMPLEMENTAR (produtos locais)
// A API do DummyJSON tem poucos eletrônicos por categoria (cerca de 38 no total).
// Para chegar perto de 150 produtos, estes itens locais são somados aos da API.
// Formato: [nome, preço em USD, especificação]

const EXTRAS_DADOS = {

    teclados: {
        emoji: "⌨️",
        cor: "#7e22ce",
        itens: [
            ["Redragon Kumara K552", 39.99, "Teclado mecânico TKL com switches blue e iluminação LED"],
            ["Logitech G213 Prodigy", 49.99, "Teclado de membrana com RGB e resistência a respingos"],
            ["Logitech G Pro X", 129.99, "Teclado mecânico TKL com switches GX trocáveis"],
            ["Logitech G915 TKL", 229.99, "Teclado mecânico sem fio de baixo perfil com RGB"],
            ["Razer BlackWidow V4", 169.99, "Teclado mecânico com switches green e apoio de pulso"],
            ["Razer Huntsman Mini", 119.99, "Teclado 60% com switches ópticos ultrarrápidos"],
            ["HyperX Alloy Origins", 99.99, "Teclado mecânico com estrutura de alumínio e RGB"],
            ["HyperX Alloy Core RGB", 59.99, "Teclado com 5 zonas de iluminação e resistência a líquidos"],
            ["Corsair K70 RGB Pro", 139.99, "Teclado mecânico com switches Cherry MX e modo torneio"],
            ["Corsair K55 RGB", 49.99, "Teclado com teclas de macro dedicadas e RGB dinâmico"],
            ["SteelSeries Apex Pro", 199.99, "Switches com ponto de atuação ajustável"],
            ["SteelSeries Apex 3", 59.99, "Teclado com certificação IP32 e iluminação RGB"],
            ["Keychron K2", 89.99, "Teclado mecânico compacto sem fio com Bluetooth"],
            ["Keychron Q1", 169.99, "Teclado 75% com corpo em alumínio e hot-swap"],
            ["Asus ROG Strix Scope", 109.99, "Teclado mecânico com switches ROG RX e Aura Sync"],
            ["Redragon Draconic K530", 54.99, "Teclado 60% sem fio com Bluetooth e switches red"]
        ]
    },

    mouses: {
        emoji: "🖱️",
        cor: "#9333ea",
        itens: [
            ["Logitech G203 Lightsync", 29.99, "Mouse com sensor de 8.000 DPI e RGB"],
            ["Logitech G502 Hero", 49.99, "Sensor Hero 25K, 11 botões e pesos ajustáveis"],
            ["Logitech G Pro X Superlight", 149.99, "Mouse sem fio com apenas 63 gramas"],
            ["Razer DeathAdder V3", 69.99, "Mouse ergonômico com sensor óptico de 30.000 DPI"],
            ["Razer Viper Mini", 29.99, "Mouse leve e compacto com cabo flexível"],
            ["Razer Basilisk V3", 69.99, "Mouse com roda de rolagem inteligente e 11 botões"],
            ["HyperX Pulsefire Haste", 49.99, "Mouse ultraleve com design vazado"],
            ["HyperX Pulsefire Surge", 59.99, "Mouse com iluminação RGB de 360 graus"],
            ["Corsair M65 RGB Elite", 59.99, "Mouse FPS com sensor de 18.000 DPI e peso ajustável"],
            ["Corsair Dark Core RGB Pro", 89.99, "Mouse sem fio com carregamento Qi"],
            ["SteelSeries Rival 3", 29.99, "Mouse com sensor TrueMove Core e 6 botões"],
            ["SteelSeries Aerox 5", 99.99, "Mouse com 9 botões programáveis e design vazado"],
            ["Redragon Cobra M711", 24.99, "Mouse com 10.000 DPI e iluminação RGB"],
            ["Redragon Griffin M607", 19.99, "Mouse de entrada com 7.200 DPI e 7 botões"],
            ["Asus ROG Gladius III", 79.99, "Mouse com switches ópticos-mecânicos e sensor de 19.000 DPI"],
            ["Glorious Model O", 49.99, "Mouse ultraleve com sensor BAMF e cabo Ascended"]
        ]
    },

    headsets: {
        emoji: "🎧",
        cor: "#a855f7",
        itens: [
            ["HyperX Cloud II", 99.99, "Headset com som surround 7.1 virtual e almofadas em espuma"],
            ["HyperX Cloud Stinger", 49.99, "Headset leve com microfone giratório"],
            ["HyperX Cloud Alpha", 99.99, "Drivers de câmara dupla para graves mais definidos"],
            ["Razer BlackShark V2", 99.99, "Headset com THX Spatial Audio e microfone removível"],
            ["Razer Kraken X", 59.99, "Headset ultraleve com som surround 7.1"],
            ["Razer Barracuda X", 99.99, "Headset sem fio multiplataforma com 50 horas de bateria"],
            ["Logitech G733 Lightspeed", 129.99, "Headset sem fio com RGB e apenas 278 gramas"],
            ["Logitech G435", 69.99, "Headset sem fio leve com Bluetooth e Lightspeed"],
            ["Logitech G Pro X", 99.99, "Headset com microfone Blue VO!CE e áudio de alta fidelidade"],
            ["Corsair HS80 RGB", 109.99, "Headset sem fio com áudio Dolby Atmos"],
            ["Corsair HS35", 39.99, "Headset estéreo com microfone omnidirecional"],
            ["SteelSeries Arctis Nova 7", 179.99, "Headset sem fio com bateria dupla e 38 horas de uso"],
            ["SteelSeries Arctis 1", 59.99, "Headset multiplataforma com microfone ClearCast"],
            ["Asus ROG Delta S", 189.99, "Headset USB-C com tecnologia Hi-Res e microfone AI"],
            ["Redragon Zeus X H510", 49.99, "Headset com som 7.1 e iluminação RGB"],
            ["Astro A50 Gen 4", 299.99, "Headset sem fio premium com base de carregamento"]
        ]
    },

    monitores: {
        emoji: "🖥️",
        cor: "#6b21a8",
        itens: [
            ["LG UltraGear 24GN600", 169.99, "Monitor IPS de 24 polegadas, 144Hz e 1ms"],
            ["LG UltraGear 27GP850", 349.99, "Monitor QHD Nano IPS de 27 polegadas e 180Hz"],
            ["Samsung Odyssey G5", 299.99, "Monitor curvo QHD de 27 polegadas e 144Hz"],
            ["Samsung Odyssey G7", 549.99, "Monitor curvo QHD de 32 polegadas e 240Hz"],
            ["Samsung Odyssey G3", 199.99, "Monitor Full HD de 24 polegadas e 144Hz"],
            ["AOC Hero 24G2", 159.99, "Monitor IPS de 24 polegadas com 144Hz e FreeSync"],
            ["AOC Agon AG274QZM", 599.99, "Monitor QHD de 27 polegadas e 240Hz"],
            ["Asus TUF Gaming VG249Q", 189.99, "Monitor IPS de 23,8 polegadas, 144Hz e ELMB"],
            ["Asus ROG Swift PG279QM", 699.99, "Monitor QHD de 27 polegadas com 240Hz e G-Sync"],
            ["BenQ Zowie XL2411K", 249.99, "Monitor de 24 polegadas e 144Hz focado em eSports"],
            ["Alienware AW2523HF", 349.99, "Monitor Full HD de 24,5 polegadas e 360Hz"],
            ["Dell S2721DGF", 379.99, "Monitor QHD de 27 polegadas com 165Hz"],
            ["Acer Nitro VG271", 179.99, "Monitor IPS de 27 polegadas com FreeSync"],
            ["Acer Predator XB273", 479.99, "Monitor QHD de 27 polegadas com 240Hz"],
            ["MSI Optix G27C", 199.99, "Monitor curvo Full HD de 27 polegadas e 165Hz"],
            ["Gigabyte G24F", 169.99, "Monitor IPS de 23,8 polegadas e 165Hz"]
        ]
    },

    "placas-de-video": {
        emoji: "🎮",
        cor: "#c026d3",
        itens: [
            ["NVIDIA GeForce RTX 4060", 299.99, "8 GB GDDR6 com DLSS 3 e ray tracing"],
            ["NVIDIA GeForce RTX 4060 Ti", 399.99, "8 GB GDDR6 para jogos em 1080p e 1440p"],
            ["NVIDIA GeForce RTX 4070", 549.99, "12 GB GDDR6X com excelente eficiência energética"],
            ["NVIDIA GeForce RTX 4070 Super", 599.99, "12 GB GDDR6X com desempenho elevado em 1440p"],
            ["NVIDIA GeForce RTX 4080 Super", 999.99, "16 GB GDDR6X para jogos em 4K"],
            ["NVIDIA GeForce RTX 4090", 1599.99, "24 GB GDDR6X, a placa mais potente da linha"],
            ["NVIDIA GeForce RTX 3060", 279.99, "12 GB GDDR6 com ray tracing e DLSS"],
            ["NVIDIA GeForce RTX 3050", 219.99, "8 GB GDDR6, ideal para entrada em jogos modernos"],
            ["NVIDIA GeForce GTX 1650", 149.99, "4 GB GDDR6 para jogos competitivos leves"],
            ["AMD Radeon RX 7600", 269.99, "8 GB GDDR6 para jogos em 1080p"],
            ["AMD Radeon RX 7700 XT", 449.99, "12 GB GDDR6 com ótimo desempenho em 1440p"],
            ["AMD Radeon RX 7800 XT", 499.99, "16 GB GDDR6 para jogos em 1440p de alto nível"],
            ["AMD Radeon RX 7900 XT", 699.99, "20 GB GDDR6 com arquitetura RDNA 3"],
            ["AMD Radeon RX 7900 XTX", 899.99, "24 GB GDDR6, topo de linha da AMD"],
            ["AMD Radeon RX 6600", 199.99, "8 GB GDDR6 com ótimo custo-benefício"],
            ["Intel Arc A750", 189.99, "8 GB GDDR6 com suporte a ray tracing e XeSS"]
        ]
    },

    computadores: {
        emoji: "💻",
        cor: "#5b21b6",
        itens: [
            ["Alienware Aurora R16", 1899.99, "Desktop gamer com Intel Core i7 e RTX 4070"],
            ["Lenovo Legion Tower 5", 1499.99, "Desktop com AMD Ryzen 7 e RTX 4060 Ti"],
            ["Acer Predator Orion 3000", 1299.99, "Desktop com Intel Core i5 e RTX 4060"],
            ["MSI MAG Infinite S3", 1199.99, "Desktop compacto com Core i5 e RTX 4060"],
            ["Asus ROG Strix G16CH", 2199.99, "Desktop com Intel Core i7 e RTX 4070 Super"],
            ["HP Omen 25L", 1399.99, "Desktop com AMD Ryzen 5 e RTX 3060"],
            ["Corsair Vengeance i7400", 3499.99, "Desktop com Core i9 e RTX 4080 Super"],
            ["NZXT Player One", 1699.99, "Desktop com gabinete de vidro e RTX 4060 Ti"],
            ["CyberPowerPC Gamer Xtreme", 1099.99, "Desktop com Ryzen 5 e RTX 3050"],
            ["iBuyPower Y40", 1599.99, "Desktop com Core i7 e RTX 4060"],
            ["GameZone Start", 699.99, "PC de entrada com Ryzen 5, 16 GB de RAM e GTX 1650"],
            ["GameZone Plus", 899.99, "PC com Ryzen 5, 16 GB de RAM e RTX 3050"],
            ["GameZone Pro", 1299.99, "PC com Core i5, 16 GB de RAM e RTX 4060"],
            ["GameZone Elite", 1799.99, "PC com Ryzen 7, 32 GB de RAM e RTX 4070"],
            ["GameZone Master", 2499.99, "PC com Core i9, 32 GB de RAM e RTX 4080 Super"],
            ["GameZone Ultra", 3999.99, "PC topo de linha com Core i9, 64 GB de RAM e RTX 4090"]
        ]
    },

    acessorios: {
        emoji: "🕹️",
        cor: "#86198f",
        itens: [
            ["Razer Gigantus V2 XXL", 24.99, "Mousepad gigante com base antiderrapante"],
            ["SteelSeries QcK Heavy", 29.99, "Mousepad espesso com superfície de microtecido"],
            ["Redragon Kunlun P006", 19.99, "Mousepad speed grande com bordas costuradas"],
            ["Logitech G840 XL", 39.99, "Mousepad extra grande com base de borracha"],
            ["Logitech C922 Pro Stream", 99.99, "Webcam Full HD 1080p com microfones estéreo"],
            ["Elgato HD60 X", 139.99, "Placa de captura 4K para streaming e gravação"],
            ["HyperX QuadCast", 129.99, "Microfone USB condensador com 4 padrões polares"],
            ["Blue Yeti USB", 109.99, "Microfone USB com 3 cápsulas de alta qualidade"],
            ["Controle Xbox Wireless", 59.99, "Controle sem fio compatível com PC e consoles"],
            ["Controle DualSense", 69.99, "Controle com gatilhos adaptáveis e feedback tátil"],
            ["8BitDo Pro 2", 49.99, "Controle Bluetooth com botões traseiros programáveis"],
            ["Razer Base Station V2", 59.99, "Suporte de headset com USB e iluminação RGB"],
            ["Cougar Armor One", 249.99, "Cadeira gamer ergonômica com ajuste de inclinação"],
            ["Cooler Master Hyper 212", 39.99, "Cooler de CPU com heat pipes de contato direto"],
            ["Samsung 980 SSD 1TB", 79.99, "SSD NVMe de 1 TB com alta velocidade de leitura"],
            ["Logitech G29 Driving Force", 249.99, "Volante com pedais e force feedback para PC e consoles"]
        ]
    }

};

const ROTULOS_CATEGORIAS = {
    laptops: "Notebooks",
    smartphones: "Smartphones",
    tablets: "Tablets",
    teclados: "Teclados",
    mouses: "Mouses",
    headsets: "Headsets",
    monitores: "Monitores",
    "placas-de-video": "Placas de vídeo",
    computadores: "Computadores",
    acessorios: "Acessórios"
};

// Gera uma imagem SVG (data URI) para os produtos locais
function gerarImagemProduto(emoji, nome, cor) {

    const nomeSeguro = nome
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#f3e8ff"/>' +
        '<stop offset="1" stop-color="' + cor + '" stop-opacity="0.45"/>' +
        '</linearGradient></defs>' +
        '<rect width="400" height="300" fill="url(#g)"/>' +
        '<text x="200" y="150" font-size="96" text-anchor="middle">' + emoji + '</text>' +
        '<text x="200" y="240" font-size="20" font-family="Arial, sans-serif" ' +
        'font-weight="bold" fill="#3b0764" text-anchor="middle">' + nomeSeguro + '</text>' +
        '</svg>';

    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);

}

const PRODUTOS_EXTRAS = [];

Object.keys(EXTRAS_DADOS).forEach(function (categoria) {

    const grupo = EXTRAS_DADOS[categoria];

    grupo.itens.forEach(function (item) {

        PRODUTOS_EXTRAS.push({
            title: item[0],
            description: item[2] + ".",
            price: item[1],
            category: categoria,
            thumbnail: gerarImagemProduto(grupo.emoji, item[0], grupo.cor)
        });

    });

});
