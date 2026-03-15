const fs = require("fs");
const path = require("path");

/* ---- Lazy-loaded product cache (persists across warm invocations) ---- */
let catalog = null;
let allProducts = null;
let skuIndex = null;

function dataPath(file) {
  return path.join(__dirname, "..", "..", "Data", file);
}

function loadAll() {
  if (allProducts) return;
  catalog = JSON.parse(fs.readFileSync(dataPath("catalog.json"), "utf8"));
  allProducts = [];
  catalog.forEach(function (entry) {
    var products = JSON.parse(fs.readFileSync(dataPath(entry.file), "utf8"));
    allProducts = allProducts.concat(products);
  });
  skuIndex = {};
  allProducts.forEach(function (p) {
    skuIndex[p.sku] = p;
  });
}

function cors(body, status) {
  return {
    statusCode: status || 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*"
    },
    body: typeof body === "string" ? body : JSON.stringify(body)
  };
}

exports.handler = async function (event) {
  try {
    loadAll();
    var params = event.queryStringParameters || {};

    /* ---- Single product lookup ---- */
    if (params.sku) {
      var product = skuIndex[params.sku] || null;
      if (!product) return cors({ error: "Produkt ikke funnet" }, 404);
      return cors({ product: product });
    }

    /* ---- Catalog metadata (areas, groups, counts) ---- */
    if (params.meta === "1") {
      var areas = {};
      allProducts.forEach(function (p) {
        var area = p.dahl_main_category || p.area_name || "Ukjent";
        if (!areas[area]) areas[area] = { count: 0, groups: {} };
        areas[area].count++;
        var group = p.dahl_sub_category || p.group_name || "";
        if (group) {
          if (!areas[area].groups[group]) areas[area].groups[group] = 0;
          areas[area].groups[group]++;
        }
      });
      return cors({ total: allProducts.length, areas: areas, catalog: catalog });
    }

    /* ---- Paginated product list ---- */
    var page = Math.max(1, parseInt(params.page, 10) || 1);
    var pageSize = Math.min(100, Math.max(1, parseInt(params.pageSize, 10) || 24));
    var area = params.area || "";
    var group = params.group || "";
    var q = (params.q || "").toLowerCase();

    var filtered = allProducts.filter(function (p) {
      if (area && (p.dahl_main_category || p.area_name) !== area) return false;
      if (group && (p.dahl_sub_category || p.group_name) !== group) return false;
      if (q) {
        var hay = (
          p.sku + " " + p.name + " " +
          (p.dahl_main_category || p.area_name || "") + " " +
          (p.dahl_sub_category || p.group_name || "") + " " +
          (p.dahl_sub_sub_category || "") + " " +
          (p.brand || "")
        ).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, totalPages);
    var start = (page - 1) * pageSize;
    var items = filtered.slice(start, start + pageSize);

    return cors({
      products: items,
      page: page,
      pageSize: pageSize,
      totalProducts: filtered.length,
      totalPages: totalPages
    });
  } catch (err) {
    return cors({ error: err.message }, 500);
  }
};
