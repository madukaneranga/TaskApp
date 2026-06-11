declare module "jspdf-autotable" {
  import type { jsPDF } from "jspdf";

  interface AutoTableOptions {
    startY?: number;
    head?: (string | number)[][];
    body?: (string | number)[][];
    styles?: { fontSize?: number };
    margin?: { left?: number; right?: number };
  }

  export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}
