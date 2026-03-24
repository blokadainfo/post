import { ASPECTS, type AspectKey } from '@lib/aspects';
import { TEMPLATES, getField, templateHas, type FieldKey, type TemplateDef } from '@lib/templates';

export type MobilePanel = 'input' | 'settings' | 'export' | null;

export type StudioState = ReturnType<typeof createStudioState>;

const initialAspectKey: AspectKey = ASPECTS[1]?.key ?? ASPECTS[0].key;
const initialTemplatePath =
  TEMPLATES.find((template) => template.aspect === initialAspectKey)?.path ?? '';

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function createStudioState() {
  return {
    bgDataURL: null as string | null,
    aspectKey: initialAspectKey,
    templatePath: initialTemplatePath,
    paragraph: '',
    textSize: 48,
    textSizeDirty: false,
    credit: '',
    generate2x: true,
    darken: 20,
    isGenerating: false,
    fileName: '',
    pendingImageSrc: null as string | null,
    pendingFileName: '',
    cropDialogOpen: false,
    mobilePanel: null as MobilePanel,
    isMobileDrawerOpen: false,
    mobileDrawerCloseTimer: null as ReturnType<typeof setTimeout> | null,
  };
}

export function getTemplateOptions(state: StudioState) {
  return TEMPLATES.filter((template) => template.aspect === state.aspectKey);
}

export function getActiveTemplate(state: StudioState): TemplateDef | undefined {
  return getTemplateOptions(state).find((template) => template.path === state.templatePath);
}

export function getActiveAspect(state: StudioState) {
  return ASPECTS.find((aspect) => aspect.key === state.aspectKey) ?? ASPECTS[0];
}

export function syncTemplateSelection(state: StudioState) {
  const templateOptions = getTemplateOptions(state);
  const belongs = templateOptions.some((template) => template.path === state.templatePath);
  if (!belongs) {
    state.templatePath = templateOptions[0]?.path ?? '';
  }
}

export function hasField(state: StudioState, key: FieldKey) {
  return templateHas(getActiveTemplate(state), key);
}

export function fieldConfig<K extends FieldKey>(state: StudioState, key: K) {
  return getField(getActiveTemplate(state), key);
}

export function syncTextSize(state: StudioState) {
  const config = fieldConfig(state, 'textSize');
  if (!config) return;

  const min = config.min ?? 12;
  const max = config.max ?? 128;
  const fallback = config.default ?? 48;
  state.textSize = state.textSizeDirty
    ? clamp(state.textSize, min, max)
    : clamp(fallback, min, max);
}

export function getRequiredMissing(state: StudioState) {
  const activeTemplate = getActiveTemplate(state);
  if (!activeTemplate) return true;

  return activeTemplate.fields.some((field) => {
    if (!field.required) return false;
    if (field.key === 'bg') return !state.bgDataURL;
    if (field.key === 'paragraph') return !state.paragraph.trim();
    if (field.key === 'credit') return !state.credit.trim();
    return false;
  });
}

export function clearImage(state: StudioState) {
  state.bgDataURL = null;
  state.fileName = '';
}

export function handleFiles(state: StudioState, files?: FileList | null) {
  const file = files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please choose an image file.');
    return;
  }

  if (file.size > 25 * 1024 * 1024) {
    alert('Max file size is 25MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    state.pendingFileName = file.name;
    state.pendingImageSrc = reader.result as string;
    state.cropDialogOpen = true;
  };
  reader.readAsDataURL(file);
}

export function closeCropDialog(state: StudioState) {
  state.cropDialogOpen = false;
  state.pendingImageSrc = null;
  state.pendingFileName = '';
}

export function applyCroppedImage(state: StudioState, dataUrl: string) {
  state.bgDataURL = dataUrl;
  state.fileName = state.pendingFileName;
  closeCropDialog(state);
}

export function clearMobileDrawerCloseTimer(state: StudioState) {
  if (state.mobileDrawerCloseTimer !== null) {
    clearTimeout(state.mobileDrawerCloseTimer);
    state.mobileDrawerCloseTimer = null;
  }
}

export function openMobilePanel(state: StudioState, panel: Exclude<MobilePanel, null>) {
  clearMobileDrawerCloseTimer(state);
  state.mobilePanel = panel;
  state.isMobileDrawerOpen = true;
}

export function closeMobilePanel(state: StudioState) {
  if (!state.mobilePanel) return;
  clearMobileDrawerCloseTimer(state);
  state.isMobileDrawerOpen = false;
  state.mobileDrawerCloseTimer = setTimeout(() => {
    state.mobilePanel = null;
    state.mobileDrawerCloseTimer = null;
  }, 200);
}

export function toggleMobilePanel(state: StudioState, panel: Exclude<MobilePanel, null>) {
  if (state.mobilePanel === panel && state.isMobileDrawerOpen) {
    closeMobilePanel(state);
    return;
  }

  openMobilePanel(state, panel);
}

export function handleAspectChange(state: StudioState, next: AspectKey) {
  state.aspectKey = next;
  state.textSizeDirty = false;
}

export function handleTemplateChange(state: StudioState, next: string) {
  state.templatePath = next;
}

export function handleTextSizeChange(state: StudioState, next: number) {
  const config = fieldConfig(state, 'textSize');
  state.textSize = clamp(next, config?.min ?? 12, config?.max ?? 128);
  state.textSizeDirty = state.textSize !== (config?.default ?? 48);
}
