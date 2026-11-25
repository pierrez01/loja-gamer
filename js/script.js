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
    
// CATÁLOGO DE PRODUTOS

const productsContainer = document.getElementById(
    "products-container"
);

async function carregarProdutos() {

    try {

        const resposta = await fetch(
            "https://dummyjson.com/products/category/laptops?limit=9"
        );

        if (!resposta.ok) {
            throw new Error("Erro ao consultar a API");
        }

        const dados = await resposta.json();

        productsContainer.innerHTML = "";

        if (dados.products.length === 0) {
            productsContainer.textContent =
                "Nenhum produto encontrado.";
            return;
        }

        dados.products.forEach(produto => {

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

    } catch (erro) {

        productsContainer.textContent =
            "Não foi possível carregar os produtos. Tente novamente.";

        console.error("Erro:", erro);

    }

}

carregarProdutos();
});