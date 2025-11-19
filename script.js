const API_URL = "https://ari-e-stock.runasp.net/api/products?page=1&pageSize=100";
const maxProductsToShow = 12; // number of products to show initially
let allProducts = [];



// Render products into the container
function renderProducts(productsToRender, isFullList = false) {
    const container = document.getElementById("products-container");
    const moreBtn = document.getElementById("more-products-btn");
    container.innerHTML = "";

    const list = isFullList ? productsToRender : productsToRender.slice(0, maxProductsToShow);

    if (list.length === 0) {
        container.innerHTML = "<p class='col-span-full text-center text-red-500'>Nuk u gjetën produkte.</p>";
    } else {
        // Use project CSS grid class so styles are consistent
        container.className = "products-grid";
        list.forEach(product => {
            container.insertAdjacentHTML('beforeend', generateProductCard(product));
        });
    }

    moreBtn.style.display = (productsToRender.length > maxProductsToShow && !isFullList) ? "inline-block" : "none";
}

// Expose renderProducts globally so non-module scripts can call it
window.renderProducts = renderProducts;


// Fetch products from your API
async function fetchProducts() {
    try {
        let response = null;
        const maxRetries = 3;

        for (let i = 0; i < maxRetries; i++) {
            const delay = Math.pow(2, i) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));

            response = await fetch(API_URL);
            if (response.ok) break;

            if (i === maxRetries - 1)
                throw new Error("Gabim gjatë marrjes së produkteve");
        }

        const data = await response.json();
        allProducts = data.items || [];
        renderProducts(allProducts);
    } catch (error) {
        console.error(error);
        document.getElementById("products-container").innerHTML =
            "<p class='text-red-600 font-medium'>Gabim gjatë ngarkimit të produkteve</p>";
    }
}

// Run when the page finishes loading
window.onload = function() {
    fetchProducts();

    const moreBtn = document.getElementById("more-products-btn");
    if (moreBtn) {
        moreBtn.addEventListener("click", () => {
            renderProducts(allProducts, true);
        });
    }
};
