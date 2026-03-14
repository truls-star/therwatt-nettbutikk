
document.addEventListener("DOMContentLoaded", () => {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-page]").forEach((el) => {
    if (el.getAttribute("data-page") === path) el.classList.add("active");
  });
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});
