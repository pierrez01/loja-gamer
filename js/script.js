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

const productsContainer = document.getElementById(
    "products-container"
);

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchStatus = document.getElementById("search-status");
const categoryButtons = document.querySelectorAll(".category-btn");

const CATEGORIAS_TODOS = [
    "laptops",
    "smartphones",
    "tablets",
    "mobile-accessories"
];

// Evita que uma resposta antiga sobrescreva uma mais recente
let requisicaoAtual = 0;

function mostrarMensagem(texto) {

    productsContainer.innerHTML = "";

    const mensagem = document.createElement("p");
    mensagem.classList.add("loading");
    mensagem.textContent = texto;

    productsContainer.appendChild(mensagem);

}

function renderizarProdutos(produtos) {

    productsContainer.innerHTML = "";

    produtos.forEach(produto => {

        const card = document.createElement("article");
        card.classList.add("product-card");

        const imagem = document.createElement("img");
        imagem.src = produto.thumbnail;
        imagem.alt = produto.title;

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

        productsContainer.appendChild(card);

    });

}

async function buscarNaApi(url) {

    const resposta = await fetch(url);

    if (!resposta.ok) {
        throw new Error("Erro ao consultar a API");
    }

    const dados = await resposta.json();

    return dados.products;

}

async function carregarProdutos(categoria = "laptops") {

    const idRequisicao = ++requisicaoAtual;

    mostrarMensagem("Carregando produtos...");

    try {

        let produtos;

        if (categoria === "todos") {

            const listas = await Promise.all(
                CATEGORIAS_TODOS.map(function (cat) {
                    return buscarNaApi(
                        "https://dummyjson.com/products/category/" + cat + "?limit=3"
                    );
                })
            );

            produtos = listas.flat();

        } else {

            produtos = await buscarNaApi(
                "https://dummyjson.com/products/category/" + categoria + "?limit=9"
            );

        }

        if (idRequisicao !== requisicaoAtual) return;

        if (produtos.length === 0) {
            mostrarMensagem("Nenhum produto encontrado.");
            return;
        }

        renderizarProdutos(produtos);

    } catch (erro) {

        if (idRequisicao !== requisicaoAtual) return;

        mostrarMensagem(
            "Não foi possível carregar os produtos. Tente novamente."
        );

        console.error("Erro:", erro);

    }

}

// BUSCA DE PRODUTOS

async function pesquisarProdutos(termo) {

    const idRequisicao = ++requisicaoAtual;

    mostrarMensagem("Buscando produtos...");

    try {

        const produtos = await buscarNaApi(
            "https://dummyjson.com/products/search?limit=9&q=" +
            encodeURIComponent(termo)
        );

        if (idRequisicao !== requisicaoAtual) return;

        if (produtos.length === 0) {
            searchStatus.textContent =
                'Nenhum resultado para "' + termo + '".';
            mostrarMensagem("Nenhum produto encontrado.");
            return;
        }

        searchStatus.textContent =
            produtos.length + " resultado(s) para \"" + termo + "\".";

        renderizarProdutos(produtos);

    } catch (erro) {

        if (idRequisicao !== requisicaoAtual) return;

        searchStatus.textContent = "";
        mostrarMensagem(
            "Não foi possível buscar os produtos. Tente novamente."
        );

        console.error("Erro:", erro);

    }

}

function ativarCategoria(categoria) {
    categoryButtons.forEach(function (botao) {
        botao.classList.toggle(
            "active",
            botao.dataset.category === categoria
        );
    });
}

searchForm.addEventListener("submit", function (evento) {

    evento.preventDefault();

    const termo = searchInput.value.trim();

    if (termo === "") {
        searchStatus.textContent = "";
        ativarCategoria("laptops");
        carregarProdutos("laptops");
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
        carregarProdutos(categoria);

    });

});

carregarProdutos();
