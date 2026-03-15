document.addEventListener("DOMContentLoaded", () => {
  const categoryGrid = document.getElementById("homeCategoryGrid");
  if (!categoryGrid) return;

  const escapeHtml = (value) => {
    const div = document.createElement("div");
    div.textContent = value || "";
    return div.innerHTML;
  };

  const renderFallback = () => {
    categoryGrid.innerHTML = [
      { name: "Varmeløsninger & energi", count: "1,000+ products" },
      { name: "Teknisk VVS", count: "6,000+ products" },
      { name: "Synlig VVS", count: "2,000+ products" },
      { name: "Industri", count: "4,000+ products" }
    ].map((item) => (
      `<article class="card"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.count)}</p></article>`
    )).join("");
  };

  fetch("Data/catalog.json")
    .then((response) => {
      if (!response.ok) throw new Error("Failed to load catalog");
      return response.json();
    })
    .then((catalog) => {
      if (!Array.isArray(catalog) || catalog.length === 0) {
        renderFallback();
        return;
      }

      const categoryCount = new Map();
      catalog.forEach((dataset) => {
        const categories = Array.isArray(dataset.dahl_main_categories)
          ? dataset.dahl_main_categories
          : [];
        categories.forEach((category) => {
          const current = categoryCount.get(category) || 0;
          categoryCount.set(category, current + (dataset.count || 0));
        });
      });

      const topCategories = Array.from(categoryCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      if (topCategories.length === 0) {
        renderFallback();
        return;
      }

      categoryGrid.innerHTML = topCategories.map(([name, count]) => (
        `<article class="card"><h3>${escapeHtml(name)}</h3><p>${new Intl.NumberFormat("en-US").format(count)} products</p></article>`
      )).join("");
    })
    .catch(() => {
      renderFallback();
    });
});
