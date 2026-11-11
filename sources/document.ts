import PDFDocument from 'pdfkit'
import fs from 'fs'








export class Document{
    doc:typeof PDFDocument
    margin:number
    wrapperWidth:number
    boldFont:string = './fonts/Open_Sans/static/OpenSans-Bold.ttf'
    headerFont:string = './fonts/Open_Sans/static/OpenSans-SemiBold.ttf'
    textFont:string = './fonts/Open_Sans/static/OpenSans-Regular.ttf'
    grayTextColor:string = '#555'
    fontH1:number = 32
    fontDefault:number = 9.15
    lineGap:number = 1.28

    private buffers: Buffer[] = [];
    public bufferPromise: Promise<Buffer>;

    constructor(){
        this.margin = 25
        this.wrapperWidth = 595-(this.margin*2)
        this.doc = new PDFDocument({
            size: 'A4',
            margin: this.margin
        })
        
        this.doc.on('data', (chunk: Buffer) => this.buffers.push(chunk));
        this.bufferPromise = new Promise((resolve, reject) => {
            this.doc.on('end', () => resolve(Buffer.concat(this.buffers)));
            this.doc.on('error', (err) => reject(err));
        });
    }
    
    async toBuffer(): Promise<Buffer> {
        this.doc.end();
        return this.bufferPromise;
    }

    writeLine(text:string,config:any={}){
        this.doc.font(config.font??this.textFont)

        this.doc.fillColor(this.grayTextColor)
        this.doc.fontSize(config.fontSize??this.fontDefault)
        this.doc.text(text.trim(), {
            width: config.wrapperWidth??this.wrapperWidth,      // szerokość kolumny
            align: config.align??'left',   // left / right / center / justify
            lineGap: this.lineGap       // odstęp między liniami
        })
    }
    writeBorderedLine(widths:any, aligns:any, texts:any, config:any={}) {
        const {doc} = this
        doc.font(config.font ?? this.textFont);
        doc.fontSize(config.fontSize ?? this.fontDefault);
        doc.fillColor(config.textColor ?? this.grayTextColor);

        // Obsługa osobnych paddingów z zachowaniem fallbacków
        const defaultPadding = config.padding ?? 6;
        const paddingTop = config.paddingTop ?? defaultPadding;
        const paddingBottom = config.paddingBottom ?? defaultPadding;
        const paddingLeft = config.paddingLeft ?? defaultPadding;
        const paddingRight = config.paddingRight ?? defaultPadding;

        const lineGap = config.lineGap ?? 2;
        
        // Jeśli szerokości są podane jako procenty (np. suma = 100)
        const totalWidthConfig = widths.reduce((acc:any, val:any) => acc + val, 0);
        const availableWidth = config.wrapperWidth ?? this.wrapperWidth;
        
        const absoluteWidths = widths.map((w:any) => {
            if (totalWidthConfig <= 100) {
                return (w / 100) * availableWidth;
            }
            return w; 
        });

        // 1. Oblicz maksymalną wysokość wiersza na podstawie zawartości
        let maxHeight = config.height ?? 0; 
        
        texts.forEach((text:any, index:any) => {
            const colWidth = absoluteWidths[index];
            const textWidth = colWidth - (paddingLeft + paddingRight);
            const textHeight = doc.heightOfString(String(text).trim(), {
                width: textWidth,
                lineGap: lineGap
            });
            const totalCellHeight = textHeight + paddingTop + paddingBottom;
            if (totalCellHeight > maxHeight) {
                maxHeight = totalCellHeight;
            }
        });

        // 2. Obsługa Page Break
        const bottomMargin = doc.page.margins.bottom;
        const pageHeight = doc.page.height;
        
        if (doc.y + maxHeight > pageHeight - bottomMargin) {
            doc.addPage();
        }

        // 3. Rysowanie ramek kolumn
        let currentX = doc.x;
        const startY = doc.y;
        const totalRowWidth = absoluteWidths.reduce((a:any, b:any) => a + b, 0);

        if (config.border !== false) {
            const colorSource = config.borderColors ?? config.borderColor;

            if (Array.isArray(colorSource)) {
                texts.forEach((_:any, index:any) => {
                    const colWidth = absoluteWidths[index];
                    const colBorderColor = colorSource[index];

                    if (colBorderColor !== null && colBorderColor !== false && colBorderColor !== undefined) {
                        doc.save();
                        
                        // Ustawienie szerokości i koloru ramki tuż przed rysowaniem
                        doc.lineWidth(config.borderWidth || 1);
                        doc.strokeColor(colBorderColor); // Wymuszenie dokładnego koloru z tablicy
                        
                        doc.rect(currentX, startY, colWidth, maxHeight)
                        .stroke();
                        
                        doc.restore();
                    }
                    currentX += colWidth;
                });
            } else {
                const rowBorderColor = colorSource ?? '#cccccc';
                if (rowBorderColor !== null && rowBorderColor !== false && rowBorderColor !== undefined) {
                    doc.save();
                    doc.lineWidth(config.borderWidth || 1);
                    doc.strokeColor(rowBorderColor);
                    
                    doc.rect(currentX, startY, totalRowWidth, maxHeight)
                    .stroke();
                    
                    doc.restore();
                }
            }
        }

        // 4. Wypisanie tekstów z opcjonalnym wyrównaniem do dołu (alignBottom)
        currentX = doc.x;

        texts.forEach((text:any, index:any) => {
            const colWidth = absoluteWidths[index];
            const textStr = String(text).trim();

            let colAlign:any = 'left';
            if (Array.isArray(aligns)) {
                colAlign = aligns[index] ?? config.align ?? 'left';
            } else if (typeof aligns === 'string') {
                colAlign = aligns;
            } else if (config.align) {
                colAlign = config.align;
            }

            let textY = startY + paddingTop;
            if (config.alignBottom && textStr !== '') {
                const textWidth = colWidth - (paddingLeft + paddingRight);
                const textHeight = doc.heightOfString(textStr, {
                    width: textWidth,
                    lineGap: lineGap
                });
                textY = startY + maxHeight - textHeight - paddingBottom;
                if (textY < startY + paddingTop) {
                    textY = startY + paddingTop;
                }
            }

            doc.text(textStr, currentX + paddingLeft, textY, {
                width: colWidth - (paddingLeft + paddingRight),
                align: colAlign,
                lineGap: lineGap
            });

            currentX += colWidth;
        });

        doc.y = startY + maxHeight;
        
        if (config.rowGap) {
            doc.y += config.rowGap;
        }
    }

    writeSpace(spaceHeight:any) {
        const {doc} = this
        const bottomMargin = doc.page.margins.bottom;
        const pageHeight = doc.page.height;
        
        // Sprawdzamy czy dodanie odstępu spowoduje wyjście poza margines dolny strony
        if (doc.y + spaceHeight > pageHeight - bottomMargin) {
            doc.addPage();
            doc.x = this.margin; // Przywrócenie marginesu X dla nowej strony
        } else {
            doc.y += spaceHeight;
        }
    }
}

export default Document