const API_URL = "https://ari-e-stock.runasp.net/api/products?page=1&pageSize=100";
const maxProductsToShow = 12; // number of products to show initially
let allProducts = [];


const countryFlags = {
    '868': 'flags/xk.png',
    '869': 'flags/mk.png',
    '531': 'flags/tr.png',
   
    
};

// Generate a single product card
// --- Generate Tailwind-style product card ---fit
// --- Generate Tailwind-style product card ---
function generateProductCard(product) {
  const code = product.barcode ? product.barcode.slice(0, 3) : "";
  const flagSrc = countryFlags[code] || 'flags/default.png';

  return `
    <div class="product-card bg-white rounded-2xl shadow-md hover:shadow-xl transition-transform duration-300 hover:-translate-y-1 overflow-hidden flex flex-col">
      <!-- Product Image -->
      <div class="relative h-56 bg-gray-100 overflow-hidden">
        <img 
          src="${product.imageUrl || 'WhatsApp_Image_2025-07-16_at_20.51.20_1bb258ab-removebg-preview.png'}"
          alt="${product.emri_produktit}"
          class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onerror="this.src='https://placehold.co/600x400/e5e7eb/6b7280?text=Pa+Foto'">

        <!-- Flag Badge -->
        <div class="absolute top-2 left-2 bg-white/80 p-[2px] rounded-md shadow-sm">
          <img src="${flagSrc}" alt="Origjina" class="w-4 h-3 rounded-sm object-cover">
        </div>
      </div>

      <!-- Product Info -->
      <div class="flex flex-col flex-grow p-5">
        <h3 class="text-lg font-semibold text-gray-800 mb-2 leading-tight">${product.emri_produktit}</h3>
        <p class="text-indigo-600 font-bold text-xl mb-3">${product.cmimi.toFixed(2)} €</p>

        <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <span class="font-medium">Origjina:</span>
          <span>${product.region || 'Kosovë'}</span>
        </div>

        <p class="text-gray-600 text-sm mb-4">Sasia: ${product.sasia} copë</p>

        <button class="mt-auto w-full bg-indigo-500 text-white py-2 rounded-lg font-semibold shadow hover:bg-indigo-600 transition">
          Shiko Detajet
        </button>
      </div>
    </div>
  `;
}






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
                throw new Error("Gabim gjatë marrjes së produkteve pas provave të shumta.");
        }

        const data = await response.json();
        allProducts = data.items || [];
        renderProducts(allProducts);
    } catch (error) {
        console.error(error);
        const container = document.getElementById("products-container");
        container.innerHTML =
            "<p class='text-red-600 font-medium'>Gabim gjatë ngarkimit të produkteve. (Kontrolloni lidhjen e API-t)</p>";
    }
}

// Run when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();

    const moreBtn = document.getElementById("more-products-btn");
    if (moreBtn) {
        moreBtn.addEventListener("click", () => {
            renderProducts(allProducts, true);
        });
    }
});
