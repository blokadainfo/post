const typeFilter = document.querySelector('#asset-type-filter');
const resetButton = document.querySelector('#asset-filter-reset');
const sections = Array.from(document.querySelectorAll('[data-asset-section]'));
const previewButtons = Array.from(document.querySelectorAll('[data-preview-open]'));
const previewDialog = document.querySelector('#asset-preview-dialog');
const previewTitle = document.querySelector('#asset-preview-title');
const previewFilename = document.querySelector('#asset-preview-filename');
const previewImage = document.querySelector('#asset-preview-image');
const previewSurface = document.querySelector('#asset-preview-surface');
const previewBody = document.querySelector('#asset-preview-body');
const previewBodyInner = document.querySelector('#asset-preview-body-inner');
const previewDownload = document.querySelector('#asset-preview-download');
const previewClose = document.querySelector('#asset-preview-close');

function applyAssetFilters() {
  if (!(typeFilter instanceof HTMLSelectElement)) return;

  const typeValue = typeFilter.value;
  const hasSelection = typeValue !== '';

  sections.forEach((section) => {
    const sectionKey = section.getAttribute('data-section-key') ?? '';
    const categoryGroups = Array.from(section.querySelectorAll('[data-asset-category-group]'));
    const matchesType = hasSelection && sectionKey === typeValue;

    let visibleGroupCount = 0;
    categoryGroups.forEach((group) => {
      const show = matchesType;
      group.toggleAttribute('hidden', !show);
      if (show) visibleGroupCount += 1;
    });

    section.toggleAttribute('hidden', !(matchesType && visibleGroupCount > 0));
  });
}

typeFilter?.addEventListener('change', applyAssetFilters);
resetButton?.addEventListener('click', () => {
  if (typeFilter instanceof HTMLSelectElement) typeFilter.value = '';
  applyAssetFilters();
});

applyAssetFilters();

function openPreview(button: Element) {
  if (
    !(button instanceof HTMLElement) ||
    !(previewDialog instanceof HTMLDialogElement) ||
    !(previewTitle instanceof HTMLElement) ||
    !(previewFilename instanceof HTMLElement) ||
    !(previewImage instanceof HTMLImageElement)
  ) {
    return;
  }

  const href = button.dataset.previewHref ?? '';
  const name = button.dataset.previewName ?? 'Preview';
  const filename = button.dataset.previewFilename ?? '';
  const lowerFilename = filename.toLowerCase();
  const showCheckerboard = /\.(png|svg|webp|avif)$/i.test(lowerFilename);

  previewTitle.textContent = name;
  previewFilename.textContent = filename;
  previewImage.style.opacity = '0';
  previewImage.removeAttribute('src');
  previewImage.alt = name;
  if (previewSurface instanceof HTMLElement) {
    previewSurface.style.backgroundColor = showCheckerboard ? '#e5e7eb' : '#0a0a0a';
    previewSurface.style.backgroundImage = showCheckerboard
      ? 'repeating-conic-gradient(#e5e7eb 0 25%,#cfd4dc 0 50%,#e5e7eb 0 75%,#cfd4dc 0 100%)'
      : 'none';
    previewSurface.style.backgroundSize = showCheckerboard ? '24px 24px' : '';
    previewSurface.style.backgroundPosition = '';
  }
  if (previewDownload instanceof HTMLAnchorElement) {
    previewDownload.href = href;
    previewDownload.setAttribute('download', filename || '');
  }

  const onLoad = () => {
    previewImage.style.opacity = '1';
    previewImage.removeEventListener('load', onLoad);
  };
  previewImage.addEventListener('load', onLoad);
  previewImage.src = href;

  if (!previewDialog.open) previewDialog.showModal();
}

previewButtons.forEach((button) => {
  button.addEventListener('click', () => openPreview(button));
});

previewClose?.addEventListener('click', () => {
  if (previewDialog instanceof HTMLDialogElement) previewDialog.close();
});

previewDialog?.addEventListener('click', (event) => {
  if (!(previewDialog instanceof HTMLDialogElement)) return;
  if (!(event instanceof MouseEvent)) return;
  if (
    event.target === previewDialog ||
    event.target === previewBody ||
    event.target === previewBodyInner
  ) {
    previewDialog.close();
  }
});
