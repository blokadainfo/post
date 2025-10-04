// src/lib/templates.ts
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

export const TEMPLATES: TemplateDef[] = [
  {
    name: "Text Upper /w Grayscale Bg Photo",
    path: "/templates/portrait/text-upper",
    aspect: "portrait",
    fields: [
      { key: "bg", type: "image", label: "Background image", required: true },
      {
        key: "shade",
        type: "range",
        label: "Darken picture",
        min: 0,
        max: 100,
        step: 1,
        default: 40,
      },
      {
        key: "paragraph",
        type: "textarea",
        label: "Paragraph",
        rows: 6,
        required: true,
      },
      {
        key: "credit",
        type: "text",
        label: "Picture source / credit",
        required: true,
      },
    ],
  },
  {
    name: "Text Lower /w Grayscale Bg Photo",
    path: "/templates/portrait/text-lower",
    aspect: "portrait",
    fields: [
      { key: "bg", type: "image", label: "Background image", required: true },
      {
        key: "shade",
        type: "range",
        label: "Darken picture",
        min: 0,
        max: 100,
        step: 1,
        default: 40,
      },
      {
        key: "paragraph",
        type: "textarea",
        label: "Paragraph",
        rows: 6,
        required: true,
      },
      {
        key: "credit",
        type: "text",
        label: "Picture source / credit",
        required: true,
      },
    ],
  },
];
