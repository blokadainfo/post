import type { AspectKey } from "./aspects";

export type FieldKey = "bg" | "paragraph" | "credit" | "shade";

export type Field =
  | { key: "bg"; type: "image"; label?: string; required?: boolean }
  | {
      key: "paragraph";
      type: "textarea";
      label?: string;
      required?: boolean;
      rows?: number;
    }
  | { key: "credit"; type: "text"; label?: string; required?: boolean }
  | {
      key: "shade";
      type: "range";
      label?: string;
      min?: number;
      max?: number;
      step?: number;
      default?: number;
    };

export type TemplateDef = {
  name: string;
  path: string;
  aspect: AspectKey;
  fields: Field[];
};

const DEFAULTS = {
  labels: {
    bg: "Background image",
    paragraph: "Paragraph",
    credit: "Picture source / credit",
    shade: "Darken picture",
  },
  shade: { min: 0, max: 100, step: 1, default: 40 },
};

const f = {
  bg(opt: Partial<Extract<Field, { key: "bg" }>> = {}): Field {
    return {
      key: "bg",
      type: "image",
      label: DEFAULTS.labels.bg,
      required: false,
      ...opt,
    };
  },
  paragraph(opt: Partial<Extract<Field, { key: "paragraph" }>> = {}): Field {
    return {
      key: "paragraph",
      type: "textarea",
      label: DEFAULTS.labels.paragraph,
      rows: 6,
      required: true,
      ...opt,
    };
  },
  credit(opt: Partial<Extract<Field, { key: "credit" }>> = {}): Field {
    return {
      key: "credit",
      type: "text",
      label: DEFAULTS.labels.credit,
      required: true,
      ...opt,
    };
  },
  shade(opt: Partial<Extract<Field, { key: "shade" }>> = {}): Field {
    return {
      key: "shade",
      type: "range",
      label: DEFAULTS.labels.shade,
      ...DEFAULTS.shade,
      ...opt,
    };
  },
};

type TemplateInit = Omit<TemplateDef, "aspect">;

const RAW_TEMPLATES: TemplateInit[] = [
  {
    name: "Text Upper /w Grayscale Bg Photo",
    path: "/templates/portrait/text-upper",
    fields: [f.bg(), f.shade(), f.paragraph(), f.credit()],
  },
  {
    name: "Text Lower /w Grayscale Bg Photo",
    path: "/templates/portrait/text-lower",
    fields: [f.bg(), f.shade(), f.paragraph(), f.credit()],
  },
];

function deriveAspect(path: string): AspectKey {
  if (path.includes("/portrait/")) return "portrait";
  if (path.includes("/square/")) return "square";
  if (path.includes("/story/")) return "story";

  return "portrait";
}

export const TEMPLATES: TemplateDef[] = RAW_TEMPLATES.map((t) => ({
  ...t,
  aspect: deriveAspect(t.path),
}));

export function templateHas(t: TemplateDef | undefined, key: FieldKey) {
  return !!t?.fields.some((f) => f.key === key);
}

export function getField<T extends FieldKey>(
  t: TemplateDef | undefined,
  key: T
): Extract<Field, { key: T }> | undefined {
  return t?.fields.find((f): f is Extract<Field, { key: T }> => f.key === key);
}
