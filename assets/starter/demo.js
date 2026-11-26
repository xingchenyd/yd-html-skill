// Replace these parameters and event handlers with ones for the new subject.
window.ydMotionOptions = {
  book: {
    cover: {
      emblem: "R", eyebrow: "FIELD NOTEBOOK",
      title: ["Roofwater","Ledger"], subtitle: "AN ILLUSTRATIVE STUDY", footer: "RAIN LOG  /  01"
    },
    pages: {
      left: {eyebrow:"FIELD LOG · A", heading:"Rainfall", rows:["Single example event","100 liters reaching the roof","Two water destinations"]},
      right: {eyebrow:"FIELD LOG · B", heading:"Destinations", rows:["Collection vessel","Overflow outlet","Collection + overflow = 100 L"]},
      under: {eyebrow:"FIELD LOG · C", heading:"Comparison", rows:["Layout A: 35 L collected","Layout B: 55 L collected","100 L input in each layout"], checks:true}
    },
    materials: {
      cover: ["#386071","#294957","#142d3c"],
      liner: ["#537c88","#345663","#25404e"],
      left: ["#edf1e0","#d2ded2","#a9c0b2"],
      right: ["#edf1e0","#d2ded2","#a9c0b2"],
      under: ["#eaf5e9","#cde2d7","#a7c1bb"],
      foil: ["#7cbbc4","#eaf6eb","#abdadb","#71adb6","#b6dad6"],
      binding: ["#456e78","#213e4a","#244a56","#18323d"],
      edges: ["#6b969a","#a0bec2","#adcccc","#537d81"],
      ink: "#223d49", accent: "#2a5f61", rule: "#57747250", halo: [109,185,199]
    }
  }
};

(() => {
  const choices = [...document.querySelectorAll("[data-layout]")];
  const chart = document.querySelector("#pour");
  const capture = document.querySelector("#capture-value");
  const overflow = document.querySelector("#overflow-value");
  const values = [35,55];
  function showLayout(index) {
    const collected = values[index];
    const remaining = 100 - collected;
    chart.style.setProperty("--capture", `${collected}%`);
    chart.setAttribute("aria-label", `布置 ${["A","B"][index]}。收集 ${collected} 升，溢流 ${remaining} 升。`);
    capture.textContent = collected;
    overflow.textContent = remaining;
    choices.forEach((button,buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === index)));
  }
  choices.forEach((button,index) => button.addEventListener("click", () => showLayout(index)));
  document.addEventListener("yd:beat", ({detail}) => {
    if (detail.slide.classList.contains("results")) showLayout(detail.beat === 2 ? 1 : 0);
  });
})();
