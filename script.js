const tabButtons = document.querySelectorAll(".tab-button");
const panels = document.querySelectorAll(".tab-panel");
const networkCanvas = document.querySelector("[data-network-canvas]");
const projectLinks = document.querySelectorAll(".project-card > a[href]");
const heroSection = document.querySelector(".hero");
const heroEyebrow = document.querySelector("[data-hero-eyebrow]");
const heroTitle = document.querySelector("[data-hero-title]");
const heroCopy = document.querySelector("[data-hero-copy]");
const heroActions = document.querySelector("[data-hero-actions]");
const initialHeroContent = {
  eyebrow: heroEyebrow?.textContent || "",
  title: heroTitle?.textContent || "James Burnard",
  copy: heroCopy?.textContent.trim() || "",
  actions: heroActions?.innerHTML || "",
};

const heroContent = {
  about: initialHeroContent,
  projects: {
    eyebrow: "Selected Work · Data Systems · Interactive Analysis",
    title: "Projects",
    copy:
      "A collection of applied data projects.",
    actions: `
      <a class="button primary" href="#projects-panel">View Projects</a>
      <a class="button secondary" href="#about">About Me</a>
    `,
  },
};

function updateHero(tabName) {
  const content = heroContent[tabName] || heroContent.about;

  if (heroEyebrow) {
    heroEyebrow.textContent = content.eyebrow;
  }

  if (heroTitle) {
    heroTitle.textContent = content.title;
  }

  if (heroCopy) {
    heroCopy.textContent = content.copy;
  }

  if (heroActions) {
    heroActions.innerHTML = content.actions;
  }
}

function activateTab(tabName) {
  document.body.dataset.activeTab = tabName;

  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  panels.forEach((panel) => {
    const isActive = panel.dataset.panel === tabName;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });

  updateHero(tabName);
}

function activateTabFromHash() {
  const requestedTab = window.location.hash.replace("#", "");
  const tabName = requestedTab === "projects-panel" ? "projects" : requestedTab;

  if (tabName === "projects" || tabName === "about") {
    activateTab(tabName);

    if (requestedTab === "projects-panel") {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById("projects-panel")?.scrollIntoView();
        });
      });
    }

    return;
  }

  activateTab("about");
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activateTab(button.dataset.tab);
    const hash = button.dataset.tab;
    window.history.replaceState(null, "", `#${hash}`);

    if (button.dataset.tab === "projects") {
      requestAnimationFrame(() => {
        heroSection?.scrollIntoView();
      });
    }
  });
});

document.addEventListener("click", (event) => {
  const projectsLink = event.target.closest("[data-hero-projects-link]");

  if (!projectsLink) {
    return;
  }

  activateTab("projects");
  window.history.replaceState(null, "", "#projects-panel");
  requestAnimationFrame(() => {
    document.getElementById("projects-panel")?.scrollIntoView();
  });
});

projectLinks.forEach((link) => {
  if (link.getAttribute("href") === "#") {
    return;
  }

  const card = link.closest(".project-card");
  card.classList.add("is-clickable");
  card.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      return;
    }

    link.click();
  });
});

function updateHeaderSocials() {
  if (!heroSection) {
    return;
  }

  const showHeaderSocials = window.scrollY > heroSection.offsetHeight - 120;
  document.body.classList.toggle("is-past-hero", showHeaderSocials);
}

window.addEventListener("scroll", updateHeaderSocials, { passive: true });
window.addEventListener("resize", updateHeaderSocials);

function startHeroNetwork(canvas) {
  const context = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const photoSources = Array.from(
    { length: 37 },
    (_, index) => `assets/hero-photo-nodes/node-${String(index + 1).padStart(2, "0")}.jpg`
  );
  const colors = ["#8a99c9", "#c05f9e", "#6f83b9", "#aeb8dc", "#7e8fb5"];
  const pointer = { active: false, x: 0, y: 0 };
  const photos = photoSources.map((source) => {
    const image = new Image();
    image.src = source;
    return image;
  });
  const projectHeroImage = new Image();
  projectHeroImage.src = "assets/projects-normal-mountain.png";
  let width = 0;
  let height = 0;
  let animationFrame = null;
  let nodes = [];
  let edges = [];
  let hoveredNode = null;
  let selectedNode = null;
  let lastTime = 0;

  function getHeroMode() {
    return document.body.dataset.activeTab === "projects" ? "projects" : "about";
  }

  function getMotionScale() {
    return reduceMotion.matches ? 0.35 : 1;
  }

  function createScene() {
    nodes = photoSources.map((_, index) => {
      const ring = index % 4;
      const angle = (index / photoSources.length) * Math.PI * 2 * 2.35 + ring * 0.72;
      const radius = [0.48, 0.66, 0.84, 1.03][ring];

      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(index * 1.67) * 0.42 + (ring - 1.5) * 0.1,
        z: Math.sin(angle) * radius,
        bobPhase: index * 0.83,
        color: colors[index % colors.length],
        image: photos[index],
        importance: index % 9 === 0 ? 1.18 : index % 5 === 0 ? 1.08 : 1,
        emphasis: 0,
        screen: { x: 0, y: 0, z: 0, radius: 0, scale: 1 },
      };
    });

    edges = [];

    nodes.forEach((_, index) => {
      edges.push([index, (index + 1) % nodes.length]);
      edges.push([index, (index + 5) % nodes.length]);

      if (index % 3 === 0) {
        edges.push([index, (index + 13) % nodes.length]);
      }
    });
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    createScene();
  }

  function getSceneScale() {
    return Math.min(width, height) * (width < 700 ? 0.52 : 0.64);
  }

  function projectPoint(x, y, z, time) {
    const sceneScale = getSceneScale();
    const motionScale = getMotionScale();
    const centerX = width < 760 ? width * 0.52 : width * 0.61;
    const centerY = height * 0.51;
    const rotationY = time * 0.00018 * motionScale - 0.34;
    const rotationX = Math.sin(time * 0.00011 * motionScale) * 0.13 - 0.1;
    const worldX = x * sceneScale;
    const worldY = y * sceneScale;
    const worldZ = z * sceneScale;
    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);
    const rotatedX = worldX * cosY - worldZ * sinY;
    const rotatedZ = worldX * sinY + worldZ * cosY;
    const rotatedY = worldY * cosX - rotatedZ * sinX;
    const tiltedZ = worldY * sinX + rotatedZ * cosX;
    const camera = Math.max(760, sceneScale * 1.95);
    const scale = camera / (camera + tiltedZ);

    return {
      x: centerX + rotatedX * scale,
      y: centerY + rotatedY * scale,
      z: tiltedZ,
      scale,
    };
  }

  function drawGrid(time) {
    context.save();
    context.lineWidth = 1;
    context.strokeStyle = "rgba(152, 162, 201, 0.12)";

    for (let ring = 0; ring < 4; ring += 1) {
      const radius = 0.42 + ring * 0.22;
      context.beginPath();

      for (let step = 0; step <= 96; step += 1) {
        const angle = (step / 96) * Math.PI * 2;
        const point = projectPoint(
          Math.cos(angle) * radius,
          Math.sin(angle * 2 + ring) * 0.06,
          Math.sin(angle) * radius,
          time
        );

        if (step === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      }

      context.stroke();
    }

    for (let ray = 0; ray < 18; ray += 1) {
      const angle = (ray / 18) * Math.PI * 2;
      const start = projectPoint(Math.cos(angle) * 0.18, 0, Math.sin(angle) * 0.18, time);
      const end = projectPoint(Math.cos(angle) * 1.12, 0, Math.sin(angle) * 1.12, time);

      context.strokeStyle = "rgba(152, 162, 201, 0.07)";
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }

    context.restore();
  }

  function drawMicroNetwork(time) {
    context.save();

    for (let index = 0; index < 260; index += 1) {
      const angle = index * 2.399 + time * 0.000035 * getMotionScale();
      const radius = 0.12 + ((index * 37) % 100) / 112;
      const y = Math.sin(index * 1.23 + time * 0.00045 * getMotionScale()) * 0.44;
      const point = projectPoint(Math.cos(angle) * radius, y, Math.sin(angle) * radius, time);
      const nextAngle = angle + 0.19 + (index % 5) * 0.04;
      const nextRadius = radius * (0.86 + (index % 7) * 0.025);
      const nextPoint = projectPoint(
        Math.cos(nextAngle) * nextRadius,
        y * 0.92,
        Math.sin(nextAngle) * nextRadius,
        time
      );
      const isAccent = index % 8 === 0;
      const alpha = Math.max(0.14, Math.min(0.52, point.scale - 0.38));

      if (index % 3 !== 0) {
        context.strokeStyle = isAccent
          ? `rgba(192, 95, 158, ${alpha * 0.36})`
          : `rgba(126, 143, 181, ${alpha * 0.26})`;
        context.lineWidth = 0.75;
        context.beginPath();
        context.moveTo(point.x, point.y);
        context.lineTo(nextPoint.x, nextPoint.y);
        context.stroke();
      }

      context.fillStyle = isAccent
        ? `rgba(210, 111, 174, ${alpha})`
        : `rgba(152, 162, 201, ${alpha * 0.9})`;
      context.beginPath();
      context.arc(point.x, point.y, isAccent ? 1.55 : 1.05, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();
  }

  function updateNodeProjection(node, time) {
    const bob = Math.sin(time * 0.0013 * getMotionScale() + node.bobPhase) * 0.042;
    const point = projectPoint(node.x, node.y + bob, node.z, time);
    const baseRadius = (width < 700 ? 16 : 21) * node.importance;

    node.screen.x = point.x;
    node.screen.y = point.y;
    node.screen.z = point.z;
    node.screen.scale = point.scale;
    node.screen.radius = baseRadius * point.scale + node.emphasis * 10;
  }

  function updateHover() {
    if (!pointer.active) {
      hoveredNode = null;
      return;
    }

    hoveredNode =
      nodes.reduce((closest, node) => {
        const distance = Math.hypot(pointer.x - node.screen.x, pointer.y - node.screen.y);
        const hitRadius = node.screen.radius + 16;

        if (distance > hitRadius) {
          return closest;
        }

        if (!closest || distance < closest.distance) {
          return { node, distance };
        }

        return closest;
      }, null)?.node || null;

    canvas.style.cursor = hoveredNode ? "pointer" : "crosshair";
  }

  function drawEdges() {
    edges.forEach(([sourceIndex, targetIndex], edgeIndex) => {
      const source = nodes[sourceIndex];
      const target = nodes[targetIndex];
      const depth = 1 - Math.min(1, Math.max(0, (source.screen.z + target.screen.z) / 1100 + 0.5));
      const alpha = 0.07 + depth * 0.24;
      context.strokeStyle =
        edgeIndex % 6 === 0
        ? `rgba(192, 95, 158, ${alpha})`
        : `rgba(139, 154, 199, ${alpha})`;
      context.lineWidth = Math.max(0.45, source.screen.scale * 0.72);
      context.beginPath();
      context.moveTo(source.screen.x, source.screen.y);
      context.lineTo(target.screen.x, target.screen.y);
      context.stroke();
    });
  }

  function drawNode(node) {
    const { x, y, radius, scale } = node.screen;
    const haloRadius = radius + 5 + node.emphasis * 5;
    context.fillStyle =
      node === hoveredNode || node === selectedNode
        ? "rgba(230, 235, 247, 0.22)"
        : "rgba(126, 143, 181, 0.08)";
    context.beginPath();
    context.arc(x, y, haloRadius, 0, Math.PI * 2);
    context.fill();

    context.save();
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.clip();

    if (node.image.complete && node.image.naturalWidth > 0) {
      const imageRatio = node.image.naturalWidth / node.image.naturalHeight;
      let drawWidth = radius * 2;
      let drawHeight = radius * 2;

      if (imageRatio > 1) {
        drawWidth = drawHeight * imageRatio;
      } else {
        drawHeight = drawWidth / imageRatio;
      }

      context.drawImage(node.image, x - drawWidth / 2, y - drawHeight / 2, drawWidth, drawHeight);
    } else {
      context.fillStyle = node.color;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    context.restore();

    context.strokeStyle = node === hoveredNode || node === selectedNode ? "#eef2f6" : node.color;
    context.lineWidth = node === hoveredNode || node === selectedNode ? 2.4 : Math.max(1, scale * 1.1);
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.stroke();
  }

  function drawSelectedPreview() {
    if (!selectedNode || !selectedNode.image.complete || selectedNode.image.naturalWidth === 0) {
      return;
    }

    const panelWidth = Math.min(560, width < 760 ? width * 0.82 : width * 0.42);
    const panelHeight = Math.min(430, height < 680 ? height * 0.56 : height * 0.48);
    const margin = width < 760 ? 18 : 42;
    const x = width - panelWidth - margin;
    const y = Math.max(96, height * 0.14);
    const imagePadding = 12;
    const imageWidth = panelWidth - imagePadding * 2;
    const imageHeight = panelHeight - imagePadding * 2 - 30;
    const imageRatio = selectedNode.image.naturalWidth / selectedNode.image.naturalHeight;
    const frameRatio = imageWidth / imageHeight;
    let drawWidth = imageWidth;
    let drawHeight = imageHeight;

    if (imageRatio > frameRatio) {
      drawHeight = drawWidth / imageRatio;
    } else {
      drawWidth = drawHeight * imageRatio;
    }

    const imageX = x + imagePadding + (imageWidth - drawWidth) / 2;
    const imageY = y + 34 + (imageHeight - drawHeight) / 2;

    context.save();
    context.shadowColor = "rgba(0, 0, 0, 0.34)";
    context.shadowBlur = 28;
    context.fillStyle = "rgba(22, 27, 37, 0.88)";
    context.strokeStyle = "rgba(211, 218, 232, 0.24)";
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(x, y, panelWidth, panelHeight, 12);
    context.fill();
    context.stroke();
    context.shadowBlur = 0;

    context.fillStyle = "rgba(238, 242, 246, 0.72)";
    context.font = "700 11px Inter, system-ui, sans-serif";
    context.fillText("SELECTED PHOTO NODE", x + imagePadding, y + 22);

    context.drawImage(selectedNode.image, imageX, imageY, drawWidth, drawHeight);

    context.strokeStyle = selectedNode.color;
    context.lineWidth = 2;
    context.strokeRect(imageX, imageY, drawWidth, drawHeight);
    context.restore();
  }

  function drawPhotoNodeHint() {
    if (selectedNode || width < 680) {
      return;
    }

    const x = width < 760 ? 24 : width - 270;
    const y = height - 88;

    context.save();
    context.fillStyle = "rgba(22, 27, 37, 0.68)";
    context.strokeStyle = "rgba(211, 218, 232, 0.22)";
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(x, y, 220, 42, 999);
    context.fill();
    context.stroke();

    context.fillStyle = "rgba(238, 242, 246, 0.82)";
    context.font = "700 12px Inter, system-ui, sans-serif";
    context.fillText("Click a photo node to preview", x + 18, y + 26);
    context.restore();
  }

  function drawSketchLine(x1, y1, x2, y2, jitter = 1.6) {
    const midX = (x1 + x2) / 2 + Math.sin(x1 * 0.013 + y2 * 0.017) * jitter;
    const midY = (y1 + y2) / 2 + Math.cos(y1 * 0.011 + x2 * 0.019) * jitter;

    context.beginPath();
    context.moveTo(x1, y1);
    context.quadraticCurveTo(midX, midY, x2, y2);
    context.stroke();
  }

  function drawSketchPanel(x, y, panelWidth, panelHeight, title, accent = "rgba(104, 190, 138, 0.75)") {
    context.save();
    context.strokeStyle = "rgba(20, 20, 20, 0.55)";
    context.lineWidth = 1.25;
    for (let pass = 0; pass < 2; pass += 1) {
      const wobble = pass * 1.8;
      drawSketchLine(x + wobble, y + 2, x + panelWidth - 4, y - wobble, 3.2);
      drawSketchLine(x + panelWidth - 2, y + wobble, x + panelWidth + wobble, y + panelHeight - 3, 3.2);
      drawSketchLine(x + panelWidth - wobble, y + panelHeight - 1, x + 2, y + panelHeight + wobble, 3.2);
      drawSketchLine(x - 1, y + panelHeight - wobble, x + wobble, y + 2, 3.2);
    }

    context.strokeStyle = accent;
    context.lineWidth = 1.35;
    drawSketchLine(x + 16, y + 14, x + panelWidth - 18, y + 12, 2.6);

    context.fillStyle = "rgba(20, 20, 20, 0.82)";
    context.font = "800 13px 'Bradley Hand', 'Marker Felt', Georgia, serif";
    context.fillText(title.toUpperCase(), x + 16, y + 34);
    context.restore();
  }

  function drawProjectSketchBackground(time) {
    const motionScale = getMotionScale();

    context.save();
    context.fillStyle = "#070808";
    context.fillRect(0, 0, width, height);

    const gradient = context.createRadialGradient(width * 0.62, height * 0.48, 80, width * 0.62, height * 0.48, width * 0.7);
    gradient.addColorStop(0, "rgba(55, 62, 58, 0.36)");
    gradient.addColorStop(0.52, "rgba(18, 22, 21, 0.72)");
    gradient.addColorStop(1, "rgba(3, 4, 4, 0.98)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.globalAlpha = 0.18;
    for (let index = 0; index < 900; index += 1) {
      const x = (index * 97) % width;
      const y = (index * 53) % height;
      const size = 0.4 + ((index * 17) % 13) / 16;
      context.fillStyle = index % 5 === 0 ? "rgba(255, 255, 255, 0.5)" : "rgba(210, 218, 214, 0.24)";
      context.fillRect(x, y, size, size);
    }
    context.globalAlpha = 1;

    context.strokeStyle = "rgba(255, 255, 255, 0.05)";
    context.lineWidth = 1;
    for (let y = 40; y < height; y += 54) {
      drawSketchLine(0, y, width, y + Math.sin(y * 0.02) * 8, 2.8);
    }

    context.strokeStyle = "rgba(255, 255, 255, 0.07)";
    for (let x = width * 0.48; x < width; x += 84) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }

    context.font = "700 18px 'Bradley Hand', 'Marker Felt', Georgia, serif";
    const formulas = [
      "P(A|B) = P(B|A)P(A) / P(B)",
      "E[X] = sum x p(x)",
      "Var(X) = E[X^2] - mu^2",
      "z = (xbar - mu) / (sigma / sqrt(n))",
      "CI = theta_hat +/- 1.96 SE",
      "H0: beta1 = 0",
      "p-value < alpha",
      "R^2 = 1 - SSE/SST",
      "Cov(X,Y) / sigma_x sigma_y",
      "LL(theta) = sum log f(x_i | theta)",
      "Bayes risk",
      "bootstrap B = 1000",
    ];

    formulas.forEach((formula, index) => {
      const x = width * (0.1 + ((index * 31) % 78) / 100);
      const y = height * (0.12 + ((index * 23) % 74) / 100);
      if (x < 520 && y > height * 0.28 && y < height * 0.72) {
        return;
      }

      context.save();
      context.translate(x, y);
      context.rotate(Math.sin(index * 1.7) * 0.08);
      context.fillStyle = index % 4 === 0 ? "rgba(255, 255, 255, 0.32)" : "rgba(255, 255, 255, 0.2)";
      context.fillText(formula, 0, 0);
      context.restore();
    });

    const cx = width * 0.66;
    const cy = height * 0.5;
    const radius = Math.min(width, height) * 0.32;

    context.strokeStyle = "rgba(255, 255, 255, 0.84)";
    context.lineWidth = 2.3;
    context.beginPath();
    context.arc(cx, cy, radius, Math.PI * 0.84, Math.PI * 2.12);
    context.stroke();

    context.strokeStyle = "rgba(255, 255, 255, 0.74)";
    context.lineWidth = 2;
    drawSketchLine(cx - radius * 1.05, cy + radius * 0.08, cx + radius * 1.05, cy + radius * 0.08, 4);

    context.beginPath();
    for (let index = 0; index <= 140; index += 1) {
      const t = index / 140;
      const x = cx - radius * 0.92 + t * radius * 1.72;
      const z = (t - 0.5) * 5.2;
      const y = cy + radius * 0.78 - Math.exp(-0.5 * z * z) * radius * 1.05;

      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.stroke();

    context.strokeStyle = "rgba(255, 255, 255, 0.22)";
    context.lineWidth = 1;
    for (let index = 0; index < 7; index += 1) {
      const x = cx - radius * 0.72 + index * radius * 0.24;
      drawSketchLine(x, cy + radius * 0.86, x + radius * 0.1, cy - radius * 0.8, 3);
    }

    const scatterX = width * 0.77;
    const scatterY = height * 0.2;
    context.strokeStyle = "rgba(255, 255, 255, 0.44)";
    context.lineWidth = 1.2;
    drawSketchLine(scatterX, scatterY + 132, scatterX + 230, scatterY + 132, 1.4);
    drawSketchLine(scatterX, scatterY + 132, scatterX, scatterY, 1.4);
    drawSketchLine(scatterX + 18, scatterY + 112, scatterX + 210, scatterY + 20, 2.2);
    for (let index = 0; index < 45; index += 1) {
      const t = index / 44;
      const px = scatterX + 22 + t * 190;
      const py = scatterY + 110 - t * 86 + Math.sin(index * 2.4 + time * 0.0005 * motionScale) * 17;
      context.fillStyle = "rgba(255, 255, 255, 0.45)";
      context.beginPath();
      context.arc(px, py, index % 9 === 0 ? 2.8 : 1.8, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = "rgba(255, 255, 255, 0.38)";
    context.font = "700 14px 'Bradley Hand', 'Marker Felt', Georgia, serif";
    context.fillText("linear model", scatterX + 52, scatterY - 10);

    const histX = width * 0.11;
    const histY = height * 0.78;
    context.strokeStyle = "rgba(255, 255, 255, 0.34)";
    context.lineWidth = 1.2;
    for (let index = 0; index < 9; index += 1) {
      const barHeight = 24 + Math.sin(index * 0.9) * 18 + index * 5;
      context.strokeRect(histX + index * 22, histY - barHeight, 16, barHeight);
    }
    context.fillStyle = "rgba(255, 255, 255, 0.32)";
    context.fillText("sample distribution", histX, histY + 28);

    context.strokeStyle = "rgba(255, 255, 255, 0.24)";
    context.lineWidth = 1;
    context.beginPath();
    context.ellipse(width * 0.86, height * 0.79, 104, 58, -0.24, 0, Math.PI * 2);
    context.stroke();
    context.fillText("95% region", width * 0.81, height * 0.88);

    context.restore();
  }

  function drawStatsProblemScribbles(time) {
    void time;
  }

  function drawRegressionSketch(x, y, panelWidth, panelHeight, time) {
    const motionScale = getMotionScale();
    const left = x + 28;
    const bottom = y + panelHeight - 26;
    const plotWidth = panelWidth - 54;
    const plotHeight = panelHeight - 72;

    context.save();
    drawSketchPanel(x, y, panelWidth, panelHeight, "linear regression", "rgba(20, 20, 20, 0.82)");

    context.strokeStyle = "rgba(20, 20, 20, 0.46)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(left, bottom - plotHeight);
    context.lineTo(left, bottom);
    context.lineTo(left + plotWidth, bottom);
    context.stroke();

    for (let index = 0; index < 52; index += 1) {
      const t = index / 51;
      const trend = 0.78 - t * 0.58;
      const noise = Math.sin(index * 2.15 + time * 0.0013 * motionScale) * 0.08;
      const pointX = left + t * plotWidth;
      const pointY = bottom - (1 - (trend + noise)) * plotHeight;
      const isAccent = index % 9 === 0;

      context.fillStyle = isAccent ? "rgba(20, 20, 20, 0.82)" : "rgba(20, 20, 20, 0.45)";
      context.beginPath();
      context.arc(pointX, pointY, isAccent ? 3 : 2, 0, Math.PI * 2);
      context.fill();
    }

    context.strokeStyle = "rgba(20, 20, 20, 0.78)";
    context.lineWidth = 2;
    drawSketchLine(
      left + 12,
      bottom - plotHeight * 0.19,
      left + plotWidth - 10,
      bottom - plotHeight * (0.78 + Math.sin(time * 0.001 * motionScale) * 0.02),
      2.4
    );

    context.fillStyle = "rgba(20, 20, 20, 0.66)";
    context.font = "700 11px Georgia, 'Times New Roman', serif";
    context.fillText("y = beta0 + beta1*x", x + 18, y + panelHeight - 8);
    context.restore();
  }

  function drawClusterSketch(x, y, panelWidth, panelHeight, time) {
    const motionScale = getMotionScale();
    const centers = [
      { x: 0.34, y: 0.38, color: "rgba(20, 20, 20, 0.72)" },
      { x: 0.67, y: 0.42, color: "rgba(20, 20, 20, 0.55)" },
      { x: 0.52, y: 0.72, color: "rgba(20, 20, 20, 0.42)" },
    ];

    context.save();
    drawSketchPanel(x, y, panelWidth, panelHeight, "k-means clusters", "rgba(20, 20, 20, 0.82)");

    centers.forEach((center, centerIndex) => {
      const cx = x + center.x * panelWidth;
      const cy = y + center.y * panelHeight;

      context.strokeStyle = "rgba(20, 20, 20, 0.34)";
      context.lineWidth = 1.4;
      context.beginPath();
      context.ellipse(cx, cy, 54, 34, Math.sin(centerIndex) * 0.4, 0, Math.PI * 2);
      context.stroke();

      for (let index = 0; index < 24; index += 1) {
        const angle = index * 2.399 + centerIndex * 0.7;
        const radius = 8 + ((index * 17) % 42);
        const wobble = Math.sin(time * 0.0012 * motionScale + index + centerIndex) * 2.4;
        const px = cx + Math.cos(angle) * (radius + wobble);
        const py = cy + Math.sin(angle) * (radius * 0.62 + wobble);

        context.fillStyle = center.color;
        context.beginPath();
        context.arc(px, py, index % 7 === 0 ? 4 : 2.7, 0, Math.PI * 2);
        context.fill();
      }

      context.fillStyle = "rgba(20, 20, 20, 0.9)";
      context.beginPath();
      context.arc(cx, cy, 5, 0, Math.PI * 2);
      context.fill();
    });

    context.fillStyle = "rgba(20, 20, 20, 0.66)";
    context.font = "700 11px Georgia, 'Times New Roman', serif";
    context.fillText("minimize within-cluster SSE", x + 18, y + panelHeight - 8);
    context.restore();
  }

  function drawDecisionTreeSketch(x, y, panelWidth, panelHeight, time) {
    const motionScale = getMotionScale();
    const nodesTree = [
      { x: 0.5, y: 0.25, label: "x1 < 0.42" },
      { x: 0.28, y: 0.5, label: "x3 < 1.8" },
      { x: 0.72, y: 0.5, label: "gini=.31" },
      { x: 0.16, y: 0.75, label: "class A" },
      { x: 0.42, y: 0.75, label: "class B" },
      { x: 0.62, y: 0.75, label: "class C" },
      { x: 0.84, y: 0.75, label: "class D" },
    ];
    const links = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];

    context.save();
    drawSketchPanel(x, y, panelWidth, panelHeight, "decision tree", "rgba(20, 20, 20, 0.82)");

    context.strokeStyle = "rgba(20, 20, 20, 0.5)";
    context.lineWidth = 1.4;
    links.forEach(([sourceIndex, targetIndex]) => {
      const source = nodesTree[sourceIndex];
      const target = nodesTree[targetIndex];
      drawSketchLine(
        x + source.x * panelWidth,
        y + source.y * panelHeight,
        x + target.x * panelWidth,
        y + target.y * panelHeight,
        2
      );
    });

    nodesTree.forEach((node, index) => {
      const nodeX = x + node.x * panelWidth;
      const nodeY = y + node.y * panelHeight + Math.sin(time * 0.001 * motionScale + index) * 1.4;
      const isLeaf = index > 2;

      context.fillStyle = isLeaf ? "rgba(255, 255, 255, 0.2)" : "rgba(20, 20, 20, 0.035)";
      context.strokeStyle = "rgba(20, 20, 20, 0.62)";
      context.lineWidth = 1.2;
      context.beginPath();
      context.roundRect(nodeX - (isLeaf ? 38 : 48), nodeY - 14, isLeaf ? 76 : 96, 28, 7);
      context.fill();
      context.stroke();

      context.fillStyle = "rgba(20, 20, 20, 0.8)";
      context.font = "700 10px Georgia, 'Times New Roman', serif";
      context.textAlign = "center";
      context.fillText(node.label, nodeX, nodeY + 4);
    });

    context.textAlign = "left";
    context.restore();
  }

  function drawNetworkSketch(x, y, panelWidth, panelHeight, time) {
    const motionScale = getMotionScale();
    const graphNodes = Array.from({ length: 18 }, (_, index) => {
      const ring = index % 3;
      const angle = index * 2.13 + ring * 0.32;
      return {
        x: x + panelWidth * (0.5 + Math.cos(angle) * (0.16 + ring * 0.095)),
        y: y + panelHeight * (0.56 + Math.sin(angle) * (0.18 + ring * 0.08)),
      };
    });

    context.save();
    drawSketchPanel(x, y, panelWidth, panelHeight, "network graph", "rgba(20, 20, 20, 0.82)");

    context.strokeStyle = "rgba(20, 20, 20, 0.26)";
    context.lineWidth = 1;
    graphNodes.forEach((node, index) => {
      [index + 2, index + 5, index + 9].forEach((targetIndex) => {
        const target = graphNodes[targetIndex % graphNodes.length];
        if ((index + targetIndex) % 3 !== 0) {
          drawSketchLine(node.x, node.y, target.x, target.y, 1.2);
        }
      });
    });

    graphNodes.forEach((node, index) => {
      const pulse = Math.sin(time * 0.0015 * motionScale + index) * 1.6;
      const radius = index % 6 === 0 ? 7 + pulse : 4 + pulse * 0.3;
      context.fillStyle = index % 6 === 0 ? "rgba(20, 20, 20, 0.86)" : "rgba(20, 20, 20, 0.52)";
      context.beginPath();
      context.arc(node.x, node.y, radius, 0, Math.PI * 2);
      context.fill();
    });

    context.fillStyle = "rgba(20, 20, 20, 0.66)";
    context.font = "700 11px Georgia, 'Times New Roman', serif";
    context.fillText("centrality | density | edges", x + 18, y + panelHeight - 8);
    context.restore();
  }

  function drawForecastSketch(x, y, panelWidth, panelHeight, time) {
    const motionScale = getMotionScale();
    const left = x + 22;
    const bottom = y + panelHeight - 26;
    const plotWidth = panelWidth - 46;
    const plotHeight = panelHeight - 70;

    context.save();
    drawSketchPanel(x, y, panelWidth, panelHeight, "forecasting", "rgba(20, 20, 20, 0.82)");

    context.strokeStyle = "rgba(20, 20, 20, 0.44)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(left, bottom - plotHeight);
    context.lineTo(left, bottom);
    context.lineTo(left + plotWidth, bottom);
    context.stroke();

    context.strokeStyle = "rgba(20, 20, 20, 0.8)";
    context.lineWidth = 2;
    context.beginPath();
    for (let index = 0; index <= 42; index += 1) {
      const t = index / 42;
      const px = left + t * plotWidth;
      const trend = 0.58 - t * 0.28;
      const season = Math.sin(index * 0.72 + time * 0.001 * motionScale) * 0.12;
      const py = bottom - (0.34 + trend + season) * plotHeight;

      if (index === 0) {
        context.moveTo(px, py);
      } else {
        context.lineTo(px, py);
      }
    }
    context.stroke();

    context.strokeStyle = "rgba(20, 20, 20, 0.38)";
    context.setLineDash([6, 5]);
    context.beginPath();
    context.moveTo(left + plotWidth * 0.68, bottom - plotHeight * 0.52);
    context.lineTo(left + plotWidth, bottom - plotHeight * (0.7 + Math.sin(time * 0.001 * motionScale) * 0.05));
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = "rgba(20, 20, 20, 0.66)";
    context.font = "700 11px Georgia, 'Times New Roman', serif";
    context.fillText("ARIMA / trend / seasonality", x + 18, y + panelHeight - 8);
    context.restore();
  }

  function drawProjectAnnotations(time) {
    const motionScale = getMotionScale();
    const labels = [
      "pandas.pipe(clean)",
      "train_test_split",
      "PCA -> latent space",
      "ROC AUC",
      "confidence interval",
      "feature_importances_",
      "cross validation",
      "OCR -> tokens",
      "dashboard metrics",
      "causal inference",
      "GIS joins",
      "standardize(X)",
    ];

    context.save();
    context.font = "700 15px 'Bradley Hand', 'Marker Felt', Georgia, serif";
    labels.forEach((label, index) => {
      const x = width * (0.43 + (index % 4) * 0.135) + Math.sin(index * 2.1) * 12;
      const y = height * (0.1 + Math.floor(index / 4) * 0.07) + Math.sin(time * 0.001 * motionScale + index) * 3;
      context.fillStyle = index % 3 === 0 ? "rgba(20, 20, 20, 0.34)" : "rgba(20, 20, 20, 0.24)";
      context.fillText(label, x, y);
    });

    const arrowStartX = width * 0.49;
    const arrowStartY = height * 0.39;
    const arrowEndX = width * 0.62;
    const arrowEndY = height * 0.47;
    context.strokeStyle = "rgba(20, 20, 20, 0.42)";
    context.lineWidth = 1.4;
    drawSketchLine(arrowStartX, arrowStartY, arrowEndX, arrowEndY, 5);
    context.beginPath();
    context.moveTo(arrowEndX, arrowEndY);
    context.lineTo(arrowEndX - 15, arrowEndY - 4);
    context.moveTo(arrowEndX, arrowEndY);
    context.lineTo(arrowEndX - 7, arrowEndY - 14);
    context.stroke();

    context.save();
    context.translate(width * 0.77, height * 0.2);
    context.rotate(-0.08);
    context.strokeStyle = "rgba(20, 20, 20, 0.35)";
    context.beginPath();
    context.ellipse(0, 0, 82, 23, 0.08, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = "rgba(20, 20, 20, 0.46)";
    context.fillText("compare models", -54, 5);
    context.restore();

    context.save();
    context.translate(width * 0.55, height * 0.63);
    context.rotate(0.1);
    context.fillStyle = "rgba(20, 20, 20, 0.38)";
    context.fillText("not independent?", 0, 0);
    context.strokeStyle = "rgba(20, 20, 20, 0.28)";
    context.beginPath();
    context.moveTo(0, 8);
    context.lineTo(112, 3);
    context.stroke();
    context.restore();
    context.restore();
  }

  function drawChalkLine(x1, y1, x2, y2, opacity = 0.58, widthScale = 1) {
    context.save();
    context.strokeStyle = `rgba(245, 245, 238, ${opacity})`;
    context.lineWidth = 1.35 * widthScale;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(
      (x1 + x2) / 2 + Math.sin(x1 * 0.01 + y2 * 0.02) * 3,
      (y1 + y2) / 2 + Math.cos(y1 * 0.01 + x2 * 0.02) * 3
    );
    context.lineTo(x2, y2);
    context.stroke();

    context.strokeStyle = `rgba(245, 245, 238, ${opacity * 0.3})`;
    context.lineWidth = 3 * widthScale;
    context.stroke();
    context.restore();
  }

  function drawChalkText(text, x, y, size = 18, opacity = 0.38, rotation = 0) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.fillStyle = `rgba(245, 245, 238, ${opacity})`;
    context.font = `700 ${size}px 'Bradley Hand', 'Marker Felt', Georgia, serif`;
    context.fillText(text, 0, 0);
    context.restore();
  }

  function drawChalkNormalCurve(x, y, w, h, opacity = 0.5) {
    context.save();
    context.strokeStyle = `rgba(245, 245, 238, ${opacity})`;
    context.lineWidth = 1.7;
    context.beginPath();
    for (let index = 0; index <= 110; index += 1) {
      const t = index / 110;
      const z = (t - 0.5) * 5.4;
      const px = x + t * w;
      const py = y + h - Math.exp(-0.5 * z * z) * h;
      if (index === 0) {
        context.moveTo(px, py);
      } else {
        context.lineTo(px, py);
      }
    }
    context.stroke();
    drawChalkLine(x, y + h, x + w, y + h, opacity * 0.55, 0.75);
    drawChalkLine(x + w * 0.5, y + h + 10, x + w * 0.5, y + 12, opacity * 0.45, 0.7);
    drawChalkText("mu", x + w * 0.48, y + h + 30, 15, opacity * 0.9);
    drawChalkText("sigma", x + w * 0.68, y + h * 0.48, 15, opacity * 0.8);
    context.restore();
  }

  function drawChalkScatter(x, y, w, h, time) {
    const motionScale = getMotionScale();
    context.save();
    drawChalkLine(x, y + h, x + w, y + h, 0.42, 0.85);
    drawChalkLine(x, y + h, x, y, 0.42, 0.85);

    for (let index = 0; index < 46; index += 1) {
      const t = index / 45;
      const px = x + 12 + t * (w - 24);
      const trend = y + h - 28 - t * (h - 52);
      const py = trend + Math.sin(index * 1.9 + time * 0.0004 * motionScale) * 22;
      context.fillStyle = "rgba(245, 245, 238, 0.5)";
      context.beginPath();
      context.arc(px, py, index % 8 === 0 ? 3 : 2, 0, Math.PI * 2);
      context.fill();
    }

    drawChalkLine(x + 12, y + h - 34, x + w - 10, y + 28, 0.7, 1.15);
    drawChalkText("y = beta0 + beta1 x + epsilon", x + 8, y + h + 28, 14, 0.44);
    context.restore();
  }

  function drawChalkHistogram(x, y, w, h) {
    const bars = [0.18, 0.34, 0.52, 0.78, 0.92, 0.71, 0.48, 0.3, 0.16];
    const gap = 4;
    const barWidth = (w - gap * (bars.length - 1)) / bars.length;

    context.save();
    drawChalkLine(x, y + h, x + w, y + h, 0.42, 0.8);
    drawChalkLine(x, y + h, x, y, 0.42, 0.8);
    bars.forEach((bar, index) => {
      const bx = x + index * (barWidth + gap);
      const bh = bar * h;
      context.strokeStyle = "rgba(245, 245, 238, 0.48)";
      context.lineWidth = 1.4;
      context.strokeRect(bx, y + h - bh, barWidth, bh);
      context.fillStyle = "rgba(245, 245, 238, 0.07)";
      context.fillRect(bx, y + h - bh, barWidth, bh);
    });
    drawChalkText("sampling distribution", x - 8, y - 12, 15, 0.34, -0.035);
    context.restore();
  }

  function drawChalkNetwork(x, y, radius, time) {
    const motionScale = getMotionScale();
    const graphNodes = Array.from({ length: 18 }, (_, index) => {
      const angle = index * 2.399 + Math.sin(time * 0.00025 * motionScale) * 0.08;
      const ring = index % 3;
      return {
        x: x + Math.cos(angle) * radius * (0.28 + ring * 0.19),
        y: y + Math.sin(angle) * radius * (0.2 + ring * 0.16),
      };
    });

    context.save();
    graphNodes.forEach((node, index) => {
      [index + 2, index + 5].forEach((targetIndex) => {
        const target = graphNodes[targetIndex % graphNodes.length];
        drawChalkLine(node.x, node.y, target.x, target.y, 0.16, 0.45);
      });
    });

    graphNodes.forEach((node, index) => {
      context.fillStyle = index % 5 === 0 ? "rgba(245, 245, 238, 0.66)" : "rgba(245, 245, 238, 0.38)";
      context.beginPath();
      context.arc(node.x, node.y, index % 5 === 0 ? 4 : 2.5, 0, Math.PI * 2);
      context.fill();
    });
    drawChalkText("graph density / centrality", x - radius * 0.42, y + radius * 0.62, 14, 0.34);
    context.restore();
  }

  function drawStatisticsChalkboard(time) {
    const motionScale = getMotionScale();
    const centerX = width < 900 ? width * 0.64 : width * 0.68;
    const centerY = height * 0.52;
    const scale = Math.min(width, height) / 900;
    const bigRadius = Math.max(230, Math.min(430, Math.min(width, height) * 0.42));

    context.save();
    context.fillStyle = "#080909";
    context.fillRect(0, 0, width, height);

    const grainCount = Math.round((width * height) / 9000);
    for (let index = 0; index < grainCount; index += 1) {
      const px = (index * 73) % width;
      const py = (index * 151) % height;
      const alpha = 0.025 + ((index * 17) % 20) / 1000;
      context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      context.fillRect(px, py, 1, 1);
    }

    const formulas = [
      ["P(A|B)=P(B|A)P(A)/P(B)", width * 0.12, height * 0.13, 20, -0.03],
      ["E[X] = sum x p(x)", width * 0.37, height * 0.1, 18, 0.05],
      ["Var(X)=E[X^2]-mu^2", width * 0.72, height * 0.14, 20, -0.04],
      ["z = (xbar - mu)/(sigma/sqrt(n))", width * 0.12, height * 0.78, 17, 0.04],
      ["CI: theta_hat +/- 1.96 SE", width * 0.52, height * 0.83, 17, -0.05],
      ["H0: beta1 = 0", width * 0.83, height * 0.62, 18, 0.06],
      ["p < 0.05 ?", width * 0.78, height * 0.78, 22, -0.1],
      ["R^2 = 1 - SSE/SST", width * 0.28, height * 0.88, 18, 0.02],
      ["LL(theta)=sum log f(x_i|theta)", width * 0.58, height * 0.24, 16, 0.04],
      ["CLT: xbar -> N(mu, sigma^2/n)", width * 0.18, height * 0.28, 17, -0.035],
    ];

    formulas.forEach(([text, x, y, size, rotation], index) => {
      const drift = Math.sin(time * 0.00025 * motionScale + index) * 1.6;
      drawChalkText(text, x, y + drift, size, index % 2 === 0 ? 0.26 : 0.18, rotation);
    });

    context.strokeStyle = "rgba(245, 245, 238, 0.72)";
    context.lineWidth = 2.1;
    context.beginPath();
    context.ellipse(centerX, centerY, bigRadius * 0.95, bigRadius * 0.58, -0.06, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = "rgba(245, 245, 238, 0.22)";
    context.lineWidth = 8;
    context.stroke();

    drawChalkLine(centerX - bigRadius * 0.98, centerY, centerX + bigRadius * 0.98, centerY, 0.76, 1.3);
    context.beginPath();
    context.strokeStyle = "rgba(245, 245, 238, 0.8)";
    context.lineWidth = 2.2;
    for (let index = 0; index <= 120; index += 1) {
      const t = index / 120;
      const px = centerX - bigRadius * 0.95 + t * bigRadius * 1.9;
      const py = centerY + bigRadius * 0.48 - Math.pow(t, 1.9) * bigRadius * 0.92;
      if (index === 0) {
        context.moveTo(px, py);
      } else {
        context.lineTo(px, py);
      }
    }
    context.stroke();

    context.strokeStyle = "rgba(245, 245, 238, 0.3)";
    context.lineWidth = 1.1;
    context.beginPath();
    context.arc(centerX + bigRadius * 0.23, centerY - bigRadius * 0.12, bigRadius * 0.12, 0, Math.PI * 2);
    context.stroke();
    for (let index = 0; index < 18; index += 1) {
      const angle = index * 0.34;
      drawChalkLine(
        centerX + bigRadius * 0.23,
        centerY - bigRadius * 0.12,
        centerX + bigRadius * 0.23 + Math.cos(angle) * bigRadius * 0.12,
        centerY - bigRadius * 0.12 + Math.sin(angle) * bigRadius * 0.12,
        0.16,
        0.45
      );
    }

    if (width >= 760) {
      drawChalkNormalCurve(width * 0.08, height * 0.65, 250 * scale + 90, 110 * scale + 26, 0.38);
      drawChalkScatter(width * 0.74, height * 0.31, 230 * scale + 110, 150 * scale + 40, time);
      drawChalkHistogram(width * 0.72, height * 0.68, 230 * scale + 80, 115 * scale + 20);
      drawChalkNetwork(width * 0.47, height * 0.28, 120 * scale + 30, time);
    }

    drawChalkLine(width * 0.04, height * 0.92, width * 0.22, height * 0.82, 0.18, 0.5);
    drawChalkLine(width * 0.05, height * 0.18, width * 0.22, height * 0.23, 0.16, 0.5);
    drawChalkLine(width * 0.86, height * 0.08, width * 0.97, height * 0.22, 0.2, 0.55);
    drawChalkLine(width * 0.97, height * 0.08, width * 0.86, height * 0.22, 0.2, 0.55);

    context.restore();
  }

  function drawProjectScene(time) {
    const motionScale = getMotionScale();
    let projectImageFrame = null;
    context.save();
    context.fillStyle = "#111b20";
    context.fillRect(0, 0, width, height);

    if (projectHeroImage.complete && projectHeroImage.naturalWidth > 0) {
      const sourceX = 0;
      const sourceY = 0;
      const sourceWidth = projectHeroImage.naturalWidth;
      const sourceHeight = projectHeroImage.naturalHeight;
      const imageRatio = sourceWidth / sourceHeight;
      const canvasRatio = width / height;
      let coverWidth = width;
      let coverHeight = height;
      let coverX = 0;
      let coverY = 0;

      if (imageRatio > canvasRatio) {
        coverHeight = height;
        coverWidth = height * imageRatio;
        coverX = (width - coverWidth) / 2;
      } else {
        coverWidth = width;
        coverHeight = width / imageRatio;
        coverY = (height - coverHeight) / 2;
      }

      const driftX = Math.sin(time * 0.00012 * motionScale) * width * 0.012;
      const driftY = Math.cos(time * 0.0001 * motionScale) * height * 0.008;
      const zoom = 1.018 + Math.sin(time * 0.00009 * motionScale) * 0.006;
      const drawWidth = coverWidth * zoom;
      const drawHeight = coverHeight * zoom;
      const drawX = coverX - (drawWidth - coverWidth) / 2 + driftX;
      const drawY = coverY - (drawHeight - coverHeight) / 2 + driftY;
      projectImageFrame = { drawX, drawY, drawWidth, drawHeight };

      context.drawImage(
        projectHeroImage,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );

      const sweepX = ((time * 0.018 * motionScale) % (width * 1.6)) - width * 0.35;
      const sweep = context.createLinearGradient(sweepX, 0, sweepX + width * 0.32, height);
      sweep.addColorStop(0, "rgba(255, 255, 255, 0)");
      sweep.addColorStop(0.48, "rgba(255, 255, 255, 0.055)");
      sweep.addColorStop(1, "rgba(255, 255, 255, 0)");
      context.fillStyle = sweep;
      context.fillRect(0, 0, width, height);
    }

    const textVeil = context.createLinearGradient(0, 0, width, 0);
    textVeil.addColorStop(0, "rgba(7, 8, 8, 0.48)");
    textVeil.addColorStop(0.34, "rgba(7, 8, 8, 0.34)");
    textVeil.addColorStop(0.58, "rgba(7, 8, 8, 0.08)");
    textVeil.addColorStop(1, "rgba(7, 8, 8, 0)");
    context.fillStyle = textVeil;
    context.fillRect(0, 0, width, height);

    if (projectImageFrame) {
      const { drawX, drawY, drawWidth, drawHeight } = projectImageFrame;
      const centerXPct = 0.5;
      const sigmaXPct = 0.104;
      const baseYPct = 0.665;
      const curveHeightPct = 0.368;
      const sigmaShapeScale = 0.79;
      const cycle = 9000;
      const cyclePosition = ((time * motionScale) % cycle) / cycle;
      const isForwardPass = cyclePosition < 0.5;
      const rawPassProgress = isForwardPass ? cyclePosition * 2 : (cyclePosition - 0.5) * 2;
      const drawPhaseEnd = 0.88;
      const isTraceFading = rawPassProgress > drawPhaseEnd;
      const fadeProgress = isTraceFading
        ? (rawPassProgress - drawPhaseEnd) / (1 - drawPhaseEnd)
        : 0;
      const passProgress = isTraceFading ? 1 : rawPassProgress / drawPhaseEnd;
      const traceOpacity = isTraceFading ? 1 - fadeProgress : 1;
      const sigma = isForwardPass ? -3 + passProgress * 6 : 3 - passProgress * 6;
      const segments = [
        { start: -3, end: -2, label: "2.35%" },
        { start: -2, end: -1, label: "13.5%" },
        { start: -1, end: 0, label: "34%" },
        { start: 0, end: 1, label: "34%" },
        { start: 1, end: 2, label: "13.5%" },
        { start: 2, end: 3, label: "2.35%" },
      ];
      const activeSegment =
        segments.find((segment) => sigma >= segment.start && sigma <= segment.end) ||
        segments[segments.length - 1];
      const segmentProgress = Math.max(
        0,
        Math.min(1, (sigma - activeSegment.start) / (activeSegment.end - activeSegment.start))
      );
      const activeAlpha = (0.12 + Math.sin(segmentProgress * Math.PI) * 0.18) * traceOpacity;
      const labelOpacity = Math.sin(segmentProgress * Math.PI) * traceOpacity;

      const pointForSigma = (value) => {
        const shapedValue = value * sigmaShapeScale;
        const x = drawX + (centerXPct + value * sigmaXPct) * drawWidth;
        const y =
          drawY +
          (baseYPct - Math.exp(-0.5 * shapedValue * shapedValue) * curveHeightPct) * drawHeight;
        return { x, y };
      };
      const baseY = drawY + baseYPct * drawHeight;

      context.save();
      context.beginPath();
      const startPoint = pointForSigma(activeSegment.start);
      context.moveTo(startPoint.x, baseY);
      context.lineTo(startPoint.x, startPoint.y);

      for (let index = 0; index <= 36; index += 1) {
        const t = index / 36;
        const value = activeSegment.start + (activeSegment.end - activeSegment.start) * t;
        const point = pointForSigma(value);
        context.lineTo(point.x, point.y);
      }

      const endPoint = pointForSigma(activeSegment.end);
      context.lineTo(endPoint.x, baseY);
      context.closePath();
      context.fillStyle = `rgba(255, 255, 255, ${activeAlpha})`;
      context.fill();

      const traceStart = isForwardPass ? -3 : 3;
      const traceEnd = sigma;
      const traceSteps = Math.max(4, Math.ceil(Math.abs(traceEnd - traceStart) * 18));
      context.strokeStyle = `rgba(255, 255, 255, ${0.86 * traceOpacity})`;
      context.lineWidth = Math.max(2.4, width * 0.0016);
      context.shadowColor = `rgba(255, 255, 255, ${0.28 * traceOpacity})`;
      context.shadowBlur = 8;
      context.beginPath();
      for (let index = 0; index <= traceSteps; index += 1) {
        const t = traceSteps === 0 ? 1 : index / traceSteps;
        const value = traceStart + (traceEnd - traceStart) * t;
        const point = pointForSigma(value);
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      }
      context.stroke();
      context.shadowBlur = 0;

      const labelMid = (activeSegment.start + activeSegment.end) / 2;
      const labelPoint = pointForSigma(labelMid);
      context.shadowColor = "rgba(0, 0, 0, 0.42)";
      context.shadowBlur = 10;
      context.fillStyle = `rgba(255, 255, 255, ${0.95 * labelOpacity})`;
      context.font = `800 ${Math.max(18, width * 0.017)}px Inter, system-ui, sans-serif`;
      context.textAlign = "center";
      context.fillText(activeSegment.label, labelPoint.x, labelPoint.y - drawHeight * 0.045);

      const dot = pointForSigma(sigma);
      context.shadowColor = "rgba(255, 255, 255, 0.45)";
      context.shadowBlur = 18;
      context.fillStyle = `rgba(255, 255, 255, ${0.96 * traceOpacity})`;
      context.beginPath();
      context.arc(dot.x, dot.y, Math.max(7, width * 0.006), 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = `rgba(30, 104, 206, ${0.82 * traceOpacity})`;
      context.lineWidth = 2;
      context.stroke();
      context.restore();
    }

    context.restore();
  }

  function render(time = 0) {
    const delta = Math.min(48, time - lastTime || 16);
    lastTime = time;
    context.clearRect(0, 0, width, height);

    if (getHeroMode() === "projects") {
      hoveredNode = null;
      selectedNode = null;
      canvas.style.cursor = "crosshair";
      drawProjectScene(time);
      animationFrame = requestAnimationFrame(render);
      return;
    }

    drawGrid(time);

    nodes.forEach((node) => {
      updateNodeProjection(node, time);
    });

    updateHover();

    nodes.forEach((node) => {
      const target = node === hoveredNode || node === selectedNode ? 1 : 0;
      node.emphasis += (target - node.emphasis) * Math.min(1, delta / 120);
      updateNodeProjection(node, time);
    });

    drawMicroNetwork(time);
    drawEdges();

    [...nodes]
      .sort((a, b) => a.screen.z - b.screen.z)
      .forEach((node) => {
        drawNode(node);
      });

    drawSelectedPreview();
    drawPhotoNodeHint();

    animationFrame = requestAnimationFrame(render);
  }

  function restart() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }

    resizeCanvas();
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(render);
  }

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.active = true;
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  });
  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
    hoveredNode = null;
    canvas.style.cursor = "crosshair";
  });
  canvas.addEventListener("click", () => {
    if (getHeroMode() === "projects") {
      return;
    }

    if (!hoveredNode) {
      selectedNode = null;
      return;
    }

    selectedNode = selectedNode === hoveredNode ? null : hoveredNode;
  });
  window.addEventListener("resize", restart);
  reduceMotion.addEventListener("change", restart);
  restart();
}

activateTabFromHash();
updateHeaderSocials();
if (networkCanvas) {
  startHeroNetwork(networkCanvas);
}

window.addEventListener("hashchange", activateTabFromHash);
window.addEventListener("pageshow", () => {
  activateTabFromHash();
  updateHeaderSocials();
});
