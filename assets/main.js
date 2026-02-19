(function(){
  const yearEl = document.getElementById("year");
  if(yearEl) yearEl.textContent = String(new Date().getFullYear());
  const page = (document.body.getAttribute("data-page")||"").trim();
  document.querySelectorAll("[data-page]").forEach(a=>{
    if(a.getAttribute("data-page")===page) a.classList.add("active");
  });
})();