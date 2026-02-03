declare module 'jspdf' {
    export default class jsPDF {
        constructor(options?: any);
        internal: {
            pageSize: {
                getWidth(): number;
                getHeight(): number;
            };
            pages: any[];
        };
        setFillColor(r: number, g: number, b: number): void;
        setTextColor(r: number, g: number, b: number): void;
        setFontSize(size: number): void;
        setFont(font: string, style: string): void;
        text(text: string, x: number, y: number, options?: any): void;
        rect(x: number, y: number, w: number, h: number, style?: string): void;
        roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string): void;
        circle(x: number, y: number, r: number, style?: string): void;
        addPage(): void;
        setPage(page: number): void;
        save(filename: string): void;
        autoTable(options: any): void;
        lastAutoTable?: {
            finalY: number;
        };
    }
}

declare module 'jspdf-autotable' { }
