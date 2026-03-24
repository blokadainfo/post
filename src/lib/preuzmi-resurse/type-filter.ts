export function initAssetTypeFilter(root: ParentNode = document) {
  const typeTrigger = root.querySelector<HTMLElement>('#asset-type-trigger');
  const typeValue = root.querySelector<HTMLElement>('#asset-type-value');
  const typeMenu = root.querySelector<HTMLElement>('#asset-type-menu');
  const typeOptions = Array.from(root.querySelectorAll<HTMLElement>('[data-asset-type-option]'));
  const resetButton = root.querySelector<HTMLElement>('#asset-filter-reset');
  const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-asset-section]'));
  let selectedType = '';
  let highlightedTypeIndex = -1;

  function applyAssetFilters() {
    const hasSelection = selectedType !== '';

    sections.forEach((section) => {
      const sectionKey = section.getAttribute('data-section-key') ?? '';
      const categoryGroups = Array.from(section.querySelectorAll('[data-asset-category-group]'));
      const matchesType = hasSelection && sectionKey === selectedType;

      let visibleGroupCount = 0;
      categoryGroups.forEach((group) => {
        const show = matchesType;
        group.toggleAttribute('hidden', !show);
        if (show) visibleGroupCount += 1;
      });

      section.toggleAttribute('hidden', !(matchesType && visibleGroupCount > 0));
    });
  }

  function syncTypeMenu() {
    if (typeValue instanceof HTMLElement) {
      typeValue.textContent =
        selectedType === ''
          ? 'Select type'
          : ((
              typeOptions.find(
                (option) => option instanceof HTMLElement && option.dataset.value === selectedType
              ) as HTMLElement | undefined
            )?.dataset.label ?? 'Select type');
    }

    typeOptions.forEach((option) => {
      if (!(option instanceof HTMLElement)) return;
      const active = option.dataset.value === selectedType;
      option.setAttribute('aria-selected', active ? 'true' : 'false');
      option.classList.toggle('bg-neutral-100', active);
      option.classList.toggle('text-neutral-950', active);
      option.classList.toggle('hover:bg-white/8', !active);
    });
  }

  function syncHighlightedTypeOption() {
    if (!(typeTrigger instanceof HTMLElement)) return;

    const activeOption =
      highlightedTypeIndex >= 0 && typeOptions[highlightedTypeIndex] instanceof HTMLElement
        ? (typeOptions[highlightedTypeIndex] as HTMLElement)
        : null;

    if (activeOption) {
      typeTrigger.setAttribute('aria-activedescendant', activeOption.id);
    } else {
      typeTrigger.removeAttribute('aria-activedescendant');
    }

    typeOptions.forEach((option, index) => {
      if (!(option instanceof HTMLElement)) return;
      const highlighted = index === highlightedTypeIndex;
      option.tabIndex = highlighted ? 0 : -1;
      option.classList.toggle('bg-white/8', highlighted && option.dataset.value !== selectedType);
    });
  }

  function setHighlightedTypeIndex(index: number) {
    if (typeOptions.length === 0) {
      highlightedTypeIndex = -1;
      syncHighlightedTypeOption();
      return;
    }

    highlightedTypeIndex = Math.max(0, Math.min(index, typeOptions.length - 1));
    syncHighlightedTypeOption();
  }

  function selectType(value: string) {
    selectedType = value;
    syncTypeMenu();
    applyAssetFilters();
  }

  function closeTypeMenu() {
    if (!(typeMenu instanceof HTMLElement) || !(typeTrigger instanceof HTMLElement)) return;
    typeMenu.classList.add('hidden');
    typeTrigger.setAttribute('aria-expanded', 'false');
    highlightedTypeIndex = -1;
    syncHighlightedTypeOption();
    typeTrigger.focus();
  }

  function openTypeMenu() {
    if (!(typeMenu instanceof HTMLElement) || !(typeTrigger instanceof HTMLElement)) return;
    typeMenu.classList.remove('hidden');
    typeTrigger.setAttribute('aria-expanded', 'true');
    const selectedIndex = typeOptions.findIndex(
      (option) => option instanceof HTMLElement && option.dataset.value === selectedType
    );
    setHighlightedTypeIndex(selectedIndex >= 0 ? selectedIndex : 0);
    queueMicrotask(() => {
      if (highlightedTypeIndex >= 0 && typeOptions[highlightedTypeIndex] instanceof HTMLElement) {
        (typeOptions[highlightedTypeIndex] as HTMLElement).focus();
      } else {
        typeMenu.focus();
      }
    });
  }

  typeTrigger?.addEventListener('click', () => {
    if (!(typeMenu instanceof HTMLElement)) return;
    if (typeMenu.classList.contains('hidden')) openTypeMenu();
    else closeTypeMenu();
  });

  typeTrigger?.addEventListener('keydown', (event) => {
    if (!(typeMenu instanceof HTMLElement)) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (typeMenu.classList.contains('hidden')) openTypeMenu();
      else {
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        setHighlightedTypeIndex(
          highlightedTypeIndex >= 0
            ? highlightedTypeIndex + delta
            : delta > 0
              ? 0
              : typeOptions.length - 1
        );
        if (highlightedTypeIndex >= 0 && typeOptions[highlightedTypeIndex] instanceof HTMLElement) {
          (typeOptions[highlightedTypeIndex] as HTMLElement).focus();
        }
      }
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (typeMenu.classList.contains('hidden')) openTypeMenu();
      else closeTypeMenu();
    }

    if (event.key === 'Escape' && !typeMenu.classList.contains('hidden')) {
      event.preventDefault();
      closeTypeMenu();
    }
  });

  typeMenu?.addEventListener('keydown', (event) => {
    if (!(event instanceof KeyboardEvent)) return;
    if (!(typeMenu instanceof HTMLElement) || typeMenu.classList.contains('hidden')) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      setHighlightedTypeIndex(
        highlightedTypeIndex >= 0
          ? highlightedTypeIndex + delta
          : delta > 0
            ? 0
            : typeOptions.length - 1
      );
      if (highlightedTypeIndex >= 0 && typeOptions[highlightedTypeIndex] instanceof HTMLElement) {
        (typeOptions[highlightedTypeIndex] as HTMLElement).focus();
      }
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setHighlightedTypeIndex(0);
      if (typeOptions[0] instanceof HTMLElement) (typeOptions[0] as HTMLElement).focus();
    }

    if (event.key === 'End') {
      event.preventDefault();
      setHighlightedTypeIndex(typeOptions.length - 1);
      const last = typeOptions[typeOptions.length - 1];
      if (last instanceof HTMLElement) last.focus();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeTypeMenu();
    }

    if (event.key === 'Tab') {
      closeTypeMenu();
    }
  });

  typeOptions.forEach((option) => {
    option.addEventListener('focus', () => {
      const nextIndex = typeOptions.indexOf(option);
      if (nextIndex >= 0) setHighlightedTypeIndex(nextIndex);
    });

    option.addEventListener('click', () => {
      if (!(option instanceof HTMLElement)) return;
      selectType(option.dataset.value ?? '');
      closeTypeMenu();
    });

    option.addEventListener('keydown', (event) => {
      if (!(event instanceof KeyboardEvent)) return;
      if (!(option instanceof HTMLElement)) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectType(option.dataset.value ?? '');
        closeTypeMenu();
      }
    });
  });

  resetButton?.addEventListener('click', () => {
    selectType('');
    closeTypeMenu();
  });

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Node)) return;
    if (
      typeMenu instanceof HTMLElement &&
      typeTrigger instanceof HTMLElement &&
      !typeMenu.contains(event.target) &&
      !typeTrigger.contains(event.target)
    ) {
      closeTypeMenu();
    }
  });

  syncTypeMenu();
  applyAssetFilters();
}
