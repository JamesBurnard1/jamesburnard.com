// Indicate the current section without changing the reader's scroll position.
const contentsLinks = [...document.querySelectorAll('.project-contents nav a')];
const contentsSections = contentsLinks.map(link => document.querySelector(link.getAttribute('href')));
let contentsFrame = null;
function updateContents() {
  contentsFrame = null;
  const threshold = window.innerWidth <= 600 ? 132 : 80;
  let current = 0;
  contentsSections.forEach((section, index) => {
    if (section && section.getBoundingClientRect().top <= threshold) current = index;
  });
  contentsLinks.forEach((link, index) => {
    if (index === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function scheduleContentsUpdate() {
  if (contentsFrame === null) contentsFrame = requestAnimationFrame(updateContents);
}
window.addEventListener('scroll', scheduleContentsUpdate, { passive: true });
window.addEventListener('resize', scheduleContentsUpdate);
updateContents();


// Opening Write-up also takes the reader to its introduction; closing stays put.
const writeupContents = document.querySelector('.writeup-contents');
writeupContents?.addEventListener('toggle', () => {
  if (!writeupContents.open) return;
  document.getElementById('writeup').scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
  });
});


// Ordinary wheel gestures inside the embedded explorer continue page scrolling.
const networkFrame = document.querySelector('#network iframe');
window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin || event.source !== networkFrame?.contentWindow) return;
  if (event.data?.type !== 'baltimore-page-scroll' || !Number.isFinite(event.data.deltaY)) return;
  window.scrollBy({ top: Math.max(-window.innerHeight, Math.min(window.innerHeight, event.data.deltaY)), behavior: 'instant' });
});
