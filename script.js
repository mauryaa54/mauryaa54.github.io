const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');
const menuLabel = menuButton?.querySelector('.sr-only');

const setMenuState = (open) => {
  menuButton?.setAttribute('aria-expanded', String(open));
  nav?.classList.toggle('is-open', open);
  if (menuLabel) menuLabel.textContent = open ? 'Close navigation' : 'Open navigation';
};

menuButton?.addEventListener('click', () => {
  setMenuState(menuButton.getAttribute('aria-expanded') !== 'true');
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenuState(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  setMenuState(false);
  menuButton?.focus();
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 790) setMenuState(false);
});

const sectionLinks = [...document.querySelectorAll('#primary-nav a[href^="#"]')];
const sections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach((link) => {
        const current = link.getAttribute('href') === `#${entry.target.id}`;
        if (current) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  sections.forEach((section) => sectionObserver.observe(section));
}

const revealItems = [...document.querySelectorAll('[data-reveal]')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  document.body.classList.add('reveal-ready');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  revealItems.forEach((item) => revealObserver.observe(item));
}

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());

const projectFilters = [...document.querySelectorAll('.project-filter')];
const projectCards = [...document.querySelectorAll('.atlas-card')];
const projectFilterStatus = document.querySelector('#project-filter-status');

projectFilters.forEach((button) => {
  button.addEventListener('click', () => {
    const selectedCategory = button.dataset.filter || 'all';
    let visibleProjects = 0;

    projectFilters.forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle('is-active', active);
      candidate.setAttribute('aria-pressed', String(active));
    });

    projectCards.forEach((card) => {
      const visible = selectedCategory === 'all' || card.dataset.category === selectedCategory;
      card.hidden = !visible;
      if (visible) visibleProjects += 1;
    });

    if (projectFilterStatus) {
      const categoryLabel = selectedCategory === 'all'
        ? 'all'
        : button.textContent.replace(/\d+/g, '').trim().toLowerCase();
      projectFilterStatus.textContent = `Showing ${visibleProjects} ${categoryLabel} project${visibleProjects === 1 ? '' : 's'}.`;
    }
  });
});

const signalCanvas = document.querySelector('#signal-canvas');
const spectrumCanvas = document.querySelector('#spectrum-canvas');
const frequencyInput = document.querySelector('#frequency');
const amplitudeInput = document.querySelector('#amplitude');
const noiseInput = document.querySelector('#noise');
const frequencyValue = document.querySelector('#frequency-value');
const amplitudeValue = document.querySelector('#amplitude-value');
const noiseValue = document.querySelector('#noise-value');
const rmsValue = document.querySelector('#rms-value');
const peakValue = document.querySelector('#peak-value');
const windowButtons = [...document.querySelectorAll('.window-button')];

const labState = { window: 'hann', phase: 0 };

const fitCanvas = (canvas) => {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
    canvas.width = width * ratio;
    canvas.height = height * ratio;
  }
  const context = canvas.getContext('2d');
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { context, width, height };
};

const drawGrid = (context, width, height, columns, rows) => {
  context.clearRect(0, 0, width, height);
  context.strokeStyle = 'rgba(255,255,255,.08)';
  context.lineWidth = 1;
  context.beginPath();
  for (let column = 1; column < columns; column += 1) {
    const x = (width / columns) * column;
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }
  for (let row = 1; row < rows; row += 1) {
    const y = (height / rows) * row;
    context.moveTo(0, y);
    context.lineTo(width, y);
  }
  context.stroke();
};

const noiseAt = (index, phase) => {
  const first = Math.sin(index * 8.731 + phase * 0.37);
  const second = Math.sin(index * 21.173 - phase * 0.19) * 0.45;
  return (first + second) / 1.45;
};

const values = () => ({
  frequency: Number(frequencyInput?.value || 4.2),
  amplitude: Number(amplitudeInput?.value || 0.74),
  noise: Number(noiseInput?.value || 0.16),
});

const drawSignal = () => {
  if (!signalCanvas) return;
  const { context, width, height } = fitCanvas(signalCanvas);
  const { frequency, amplitude, noise } = values();
  drawGrid(context, width, height, 10, 6);

  const center = height / 2;
  const scale = height * 0.39;
  context.beginPath();
  for (let x = 0; x <= width; x += 2) {
    const t = x / width;
    const windowGain = labState.window === 'hann' ? 0.5 - 0.5 * Math.cos(2 * Math.PI * t) : 1;
    const fundamental = Math.sin((2 * Math.PI * frequency * t) + labState.phase);
    const secondHarmonic = 0.13 * Math.sin((4 * Math.PI * frequency * t) + labState.phase * 1.4);
    const sample = ((fundamental + secondHarmonic) * amplitude * windowGain) + (noiseAt(x, labState.phase) * noise);
    const y = center - sample * scale;
    if (x === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.strokeStyle = '#44d7e8';
  context.lineWidth = 2;
  context.shadowColor = 'rgba(68,215,232,.7)';
  context.shadowBlur = 8;
  context.stroke();
  context.shadowBlur = 0;

  context.strokeStyle = 'rgba(255,118,95,.5)';
  context.lineWidth = 1;
  context.setLineDash([5, 7]);
  context.beginPath();
  context.moveTo(0, center);
  context.lineTo(width, center);
  context.stroke();
  context.setLineDash([]);
};

const sinc = (value) => value === 0 ? 1 : Math.sin(Math.PI * value) / (Math.PI * value);

const drawSpectrum = () => {
  if (!spectrumCanvas) return;
  const { context, width, height } = fitCanvas(spectrumCanvas);
  const { frequency, amplitude, noise } = values();
  drawGrid(context, width, height, 10, 4);

  const bins = 48;
  const gap = 3;
  const barWidth = Math.max(2, (width - gap * bins) / bins);
  for (let bin = 0; bin < bins; bin += 1) {
    const binFrequency = (bin / (bins - 1)) * 12;
    const distance = Math.abs(binFrequency - frequency);
    const main = labState.window === 'hann'
      ? Math.exp(-(distance * distance) / 0.32)
      : Math.abs(sinc(distance * 1.35));
    const harmonicDistance = Math.abs(binFrequency - Math.min(frequency * 2, 12));
    const harmonic = 0.16 * Math.exp(-(harmonicDistance * harmonicDistance) / 0.25);
    const floor = noise * (0.08 + Math.abs(noiseAt(bin * 9, labState.phase)) * 0.24);
    const magnitude = Math.min(1, main * amplitude + harmonic * amplitude + floor);
    const barHeight = magnitude * (height - 18);
    const x = gap + bin * (barWidth + gap);
    const gradient = context.createLinearGradient(0, height - barHeight, 0, height);
    gradient.addColorStop(0, distance < 0.35 ? '#44d7e8' : '#2465ed');
    gradient.addColorStop(1, 'rgba(36,101,237,.18)');
    context.fillStyle = gradient;
    context.fillRect(x, height - barHeight, barWidth, barHeight);
  }
};

const updateLabReadouts = () => {
  const { frequency, amplitude, noise } = values();
  if (frequencyValue) frequencyValue.textContent = `${frequency.toFixed(1)} cycles`;
  if (amplitudeValue) amplitudeValue.textContent = amplitude.toFixed(2);
  if (noiseValue) noiseValue.textContent = noise.toFixed(2);
  const signalRms = labState.window === 'hann' ? amplitude * Math.sqrt(3 / 8) : amplitude / Math.sqrt(2);
  const combinedRms = Math.sqrt((signalRms ** 2) + ((noise * 0.55) ** 2));
  if (rmsValue) rmsValue.textContent = combinedRms.toFixed(2);
  if (peakValue) peakValue.textContent = frequency.toFixed(1);
};

const redrawLab = () => {
  updateLabReadouts();
  drawSignal();
  drawSpectrum();
};

[frequencyInput, amplitudeInput, noiseInput].forEach((input) => {
  input?.addEventListener('input', redrawLab);
});

windowButtons.forEach((button) => {
  button.addEventListener('click', () => {
    labState.window = button.dataset.window;
    windowButtons.forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle('is-active', active);
      candidate.setAttribute('aria-pressed', String(active));
    });
    redrawLab();
  });
});

if (signalCanvas && spectrumCanvas) {
  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(redrawLab) : null;
  resizeObserver?.observe(signalCanvas);
  resizeObserver?.observe(spectrumCanvas);
  window.addEventListener('resize', redrawLab);
  redrawLab();

  if (!reduceMotion) {
    let lastFrame = 0;
    const animateLab = (timestamp) => {
      if (!document.hidden && timestamp - lastFrame >= 33) {
        lastFrame = timestamp;
        labState.phase += 0.018;
        drawSignal();
        drawSpectrum();
      }
      window.requestAnimationFrame(animateLab);
    };
    window.requestAnimationFrame(animateLab);
  }
}
