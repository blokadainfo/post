import { ASPECTS } from '@lib/aspects';
import {
  clearImage,
  fieldConfig,
  getActiveTemplate,
  getRequiredMissing,
  getTemplateOptions,
  handleAspectChange,
  handleFiles,
  handleTemplateChange,
  handleTextSizeChange,
  hasField,
  type StudioState,
} from './studio-state';

function buildExportState(state: StudioState, onGenerate: () => void) {
  const activeTemplate = getActiveTemplate(state);
  const requiredMissing = getRequiredMissing(state);

  return {
    activeTemplate,
    generate2x: state.generate2x,
    onToggleResolution: () => (state.generate2x = !state.generate2x),
    onGenerate,
    generateDisabled: !activeTemplate || requiredMissing || state.isGenerating,
    isGenerating: state.isGenerating,
  };
}

export function buildPresetSidebarProps(state: StudioState) {
  return {
    title: 'Preset',
    aspects: ASPECTS,
    aspectKey: state.aspectKey,
    onAspectChange: (next: (typeof ASPECTS)[number]['key']) => handleAspectChange(state, next),
    templatePath: state.templatePath,
    templateOptions: getTemplateOptions(state),
    onTemplateChange: (next: string) => handleTemplateChange(state, next),
    imageEnabled: hasField(state, 'bg'),
    imageLabel: fieldConfig(state, 'bg')?.label ?? 'Background image',
    fileName: state.fileName,
    hasImage: !!state.bgDataURL,
    onFiles: (files?: FileList | null) => handleFiles(state, files),
    onClearImage: () => clearImage(state),
  };
}

export function buildSettingsSidebarProps(state: StudioState, onGenerate: () => void) {
  const exportState = buildExportState(state, onGenerate);

  return {
    activeTemplate: exportState.activeTemplate,
    hasField: (key: Parameters<typeof hasField>[1]) => hasField(state, key),
    fieldConfig: <K extends Parameters<typeof fieldConfig>[1]>(key: K) => fieldConfig(state, key),
    paragraph: state.paragraph,
    credit: state.credit,
    textSize: state.textSize,
    darken: state.darken,
    onParagraph: (value: string) => (state.paragraph = value),
    onCredit: (value: string) => (state.credit = value),
    onTextSize: (value: number) => handleTextSizeChange(state, value),
    onDarken: (value: number) => (state.darken = value),
    generate2x: exportState.generate2x,
    onToggleResolution: exportState.onToggleResolution,
    onGenerate: exportState.onGenerate,
    generateDisabled: exportState.generateDisabled,
    isGenerating: exportState.isGenerating,
  };
}

export function buildExportSidebarProps(state: StudioState, onGenerate: () => void) {
  return buildExportState(state, onGenerate);
}
