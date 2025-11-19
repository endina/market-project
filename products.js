const API_URL = "https://ari-e-stock.runasp.net/api/products?page=1&pageSize=100";
const maxProductsToShow = 12; // number of products to show initially
let allProducts = [];


const countryFlags = {
    '868': 'flags/xk.png',
    '869': 'flags/mk.png',
    '531': 'flags/tr.png',
   
    
};

// Category keyword definitions (edit keywords to improve matching)
const categoryDefinitions = {
  ushqim: ['ushqim','mish','bukë','buke','brumë','brume','qumësht','qumesht','ost','djath','pije ushqim','vaj','vajra','perime','fruta','biskota','kek','djath'],
  pije: ['pije','ujë','uj','lëng','leng','birrë','birre','verë','vere','kafe','kafe','çaj','caj','soda','energji'],
  higjena: ['higjena','sapun','shamp','shampo','dezinfekt','pastë','pasta','tualet','higjenike','xhaketë'],
  vegla: ['vegla','çekiç','cekic','sharr','sharrë','sharre','furçë','furce','instrument','mjete','vegël'],
  lodra: ['lodra','lojë','loje','lojera','play','toy','figurë','figure','lodrash'],
  shkolle: ['laps','leter','fletore','shkoll','libër','liber','pen','stilolaps','stilolapsi','ngjyra']
};

// Determine whether a product matches a category key
function productMatchesCategory(product, categoryKey) {
  if (!product) return false;
  // If product has an explicit category field, use it (normalize)
  if (product.category && String(product.category).toLowerCase() === categoryKey) return true;

  const title = (product.emri_produktit || '').toLowerCase();
  const desc = (product.description || product.pershkrimi || '').toLowerCase();

  const keywords = categoryDefinitions[categoryKey] || [];
  return keywords.some(k => title.includes(k) || desc.includes(k));
}

// Apply filtering and update UI
function applyCategoryFilter(categoryKey) {
  if (!categoryKey) return renderProducts(allProducts);

  const filtered = allProducts.filter(p => productMatchesCategory(p, categoryKey));
  // show all matches (no limit) when filtering
  renderProducts(filtered, true);
  // scroll to products section for better UX
  const section = document.querySelector('.products-section') || document.getElementById('products-container');
  if (section && section.scrollIntoView) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// expose the filter function for other pages
window.applyCategoryFilter = applyCategoryFilter;

// Setup click handlers for category elements
function setupCategoryFilters() {
  const elems = document.querySelectorAll('.category');
  if (!elems || elems.length === 0) return;

  elems.forEach(el => {
    const key = el.getAttribute('data-category');
    el.addEventListener('click', () => {
      const already = el.classList.contains('active');
      // clear all active
      elems.forEach(e => e.classList.remove('active'));
      if (!already) {
        el.classList.add('active');
        applyCategoryFilter(key);
      } else {
        // toggling off -> show all
        renderProducts(allProducts);
      }
    });

    // keyboard accessibility (Enter key)
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        el.click();
      }
    });
  });
}

// Generate a single product card
// Generate a single product card (uses project CSS classes)
function generateProductCard(product) {
  const code = product.barcode ? String(product.barcode).slice(0, 3) : "";
  const flagSrc = countryFlags[code] || 'flags/default.png';
  const imgSrc = product.imageUrl || 'WhatsApp_Image_2025-07-16_at_20.51.20_1bb258ab-removebg-preview.png';
  const price = (typeof product.cmimi === 'number') ? product.cmimi.toFixed(2) : product.cmimi || '0.00';
  const quantity = product.sasia ?? product.quantity ?? '-';

  return `
    <article class="product-card">
      <div class="product-image-container">
        <img src="${imgSrc}" alt="${product.emri_produktit || 'Produkt'}" onerror="this.src='https://placehold.co/600x400/e5e7eb/6b7280?text=Pa+Foto'">
        <div class="product-flag">
          <img src="${flagSrc}" alt="Origjina">
        </div>
      </div>

      <div class="product-info">
        <h3 class="product-title">${product.emri_produktit || 'Pa emër'}</h3>
        <div class="product-meta">
          <div class="product-price">${price} €</div>
          <div class="product-quantity">Sasia: <span>${quantity}</span></div>
        </div>

        

        <button class="product-btn">Shiko Detajet</button>
      </div>
    </article>
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

        // Load custom category mappings from localStorage (admin tags)
        let customMap = {};
        try { customMap = JSON.parse(localStorage.getItem('customCategories') || '{}'); } catch (e) { customMap = {}; }
        allProducts.forEach(p => {
          const key = p.id ?? p.barcode ?? p.emri_produktit;
          if (customMap[key]) p.category = customMap[key];
        });

        renderProducts(allProducts);
        // wire up category click handlers after products load
        if (typeof setupCategoryFilters === 'function') setupCategoryFilters();
        // if the page was opened with a ?cat=... parameter, auto-apply that filter
        try {
          const urlCat = new URLSearchParams(window.location.search).get('cat');
          if (urlCat) applyCategoryFilter(urlCat);
        } catch (e) {
          // ignore if URL parsing fails (shouldn't happen on normal pages)
        }

        // expose helpers for admin UI: save mapping and get current custom map
        window.saveCustomCategory = function(productKey, category) {
          try {
            const map = JSON.parse(localStorage.getItem('customCategories') || '{}');
            if (category) map[productKey] = category; else delete map[productKey];
            localStorage.setItem('customCategories', JSON.stringify(map));
            // update in-memory product
            const p = allProducts.find(x => (x.id ?? x.barcode ?? x.emri_produktit) == productKey);
            if (p) p.category = category;
            return true;
          } catch (e) { return false; }
        };

        window.getCustomCategoryMap = function(){
          try { return JSON.parse(localStorage.getItem('customCategories') || '{}'); } catch(e){ return {}; }
        };

        // notify other pages (admin) that products are loaded
        try { document.dispatchEvent(new CustomEvent('products:loaded', { detail: { products: allProducts } })); } catch(e){}
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
