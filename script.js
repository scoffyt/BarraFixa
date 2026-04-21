const hero = document.querySelector(".hero");
const stage = document.querySelector("[data-tilt]");
const heroProduct = document.querySelector(".hero-product");
const stageGlow = document.querySelector(".stage-glow");
const floatingTags = document.querySelectorAll(".floating-tag");
const cards = document.querySelectorAll("[data-card-tilt]");

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

if (hero && stage) {
  let pointerX = 0;
  let pointerY = 0;
  let scrollY = 0;
  let scrollLift = 0;
  let currentX = 0;
  let currentY = 0;
  let isInteracting = false;

  const render = () => {
    const targetX = pointerX;
    const targetY = pointerY + scrollY;

    currentX += (targetX - currentX) * 0.16;
    currentY += (targetY - currentY) * 0.16;

    if (Math.abs(currentX) > 0.02 || Math.abs(currentY) > 0.02 || Math.abs(scrollLift) > 0.02) {
      stage.style.animation = "none";
      stage.style.transform =
        `perspective(1400px) rotateX(${currentX}deg) rotateY(${currentY}deg) translateY(${scrollLift}px) scale(${isInteracting ? 1.04 : 1})`;

      if (heroProduct) {
        heroProduct.style.transform =
          `translate3d(-50%, calc(-50% + ${scrollLift * 0.55}px), ${130 + Math.abs(currentY) * 2.4}px) rotate(${(-6 + currentY * 0.35).toFixed(2)}deg) scale(${isInteracting ? 1.08 : 1.02})`;
      }

      if (stageGlow) {
        stageGlow.style.transform =
          `translate3d(calc(-50% + ${currentY * 1.2}px), calc(-50% + ${currentX * -1.2}px), 20px) scale(${1.08 + Math.abs(currentY) * 0.012})`;
      }

      floatingTags.forEach((tag, index) => {
        const depth = 105 + index * 34;
        const drift = index + 1;
        tag.style.transform =
          `translate3d(${currentY * drift * 1.4}px, ${currentX * drift * -1.1}px, ${depth}px) rotate(${currentY * 0.18}deg)`;
      });
    } else {
      stage.style.animation = "";
      stage.style.transform = "";

      if (heroProduct) {
        heroProduct.style.transform = "";
      }

      if (stageGlow) {
        stageGlow.style.transform = "";
      }

      floatingTags.forEach((tag) => {
        tag.style.transform = "";
      });
    }

    requestAnimationFrame(render);
  };

  document.addEventListener("mousemove", (event) => {
    const rect = hero.getBoundingClientRect();
    const isInsideHero =
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom &&
      event.clientX >= rect.left &&
      event.clientX <= rect.right;

    const x = event.clientX / (window.innerWidth || document.documentElement.clientWidth);
    const y = event.clientY / (window.innerHeight || document.documentElement.clientHeight);

    isInteracting = isInsideHero;
    pointerY = isInsideHero ? clamp((x - 0.5) * 52, -26, 26) : 0;
    pointerX = isInsideHero ? clamp((0.5 - y) * 38, -19, 19) : 0;
  });

  hero.addEventListener("mouseleave", () => {
    isInteracting = false;
    pointerX = 0;
    pointerY = 0;
  });

  const updateScroll = () => {
    const rect = hero.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const progress = clamp((viewport - rect.top) / (viewport + rect.height), 0, 1);

    scrollY = -8 + progress * 16;
    scrollLift = -20 + progress * 40;
  };

  window.addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();
  render();
}

cards.forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = clamp((x - 0.5) * 26, -13, 13);
    const rotateX = clamp((0.5 - y) * 20, -10, 10);

    card.style.transform =
      `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-12px) scale(1.035)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});
