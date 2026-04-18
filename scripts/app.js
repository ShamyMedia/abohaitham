document.addEventListener("DOMContentLoaded", () => {
    fetchMenuData();
    updateCartUI();
});

async function fetchMenuData() {
    try {
        const res = await fetch("menu.json");
        const data = await res.json();

        window.menuDataCache = data;

        renderMenu(data);
    } catch (e) {
        document.getElementById("menu-container").innerHTML =
            "<p>حدث خطأ في تحميل المنيو</p>";
    }
}

function renderMenu(data) {
    const container = document.getElementById("menu-container");
    container.innerHTML = "";

    data.categories.forEach(cat => {
        const section = document.createElement("section");
        section.innerHTML = `<h2>${cat.name}</h2>`;

        cat.items.forEach(item => {
            section.innerHTML += `
                <div class="menu-card" data-id="${item.id}">
                    <h3>${item.name}</h3>
                    <p>${item.price}</p>
                    <button onclick="addToCart('${item.id}','${item.name}',${item.price})">
                        أضف
                    </button>
                </div>
            `;
        });

        container.appendChild(section);
    });
}