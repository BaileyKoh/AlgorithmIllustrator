document.addEventListener("DOMContentLoaded", () => {
  const reveals = document.querySelectorAll(".reveal");
  reveals.forEach((el, i) => {
    el.style.animationDelay = `${i * 90}ms`;
  });
});
