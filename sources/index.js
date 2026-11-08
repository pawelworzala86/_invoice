import PDFDocument from 'pdfkit'
import fs from 'fs'



const grayTextColor = '#555'


const margin = 25
const wrapperWidth = 595-(margin*2)



const fontH1 = 32
const fontDefault = 9.15

const lineGap = 1.28
const boldFont = './fonts/Open_Sans/static/OpenSans-Bold.ttf'
const headerFont = './fonts/Open_Sans/static/OpenSans-SemiBold.ttf'
const textFont = './fonts/Open_Sans/static/OpenSans-Regular.ttf'



const doc = new PDFDocument({
  size: 'A4',
  margin: margin
})

doc.pipe(fs.createWriteStream('invoice.pdf'))







function writeLine(text,config={}){
   doc.font(config.font??textFont)

   doc.fillColor(grayTextColor)
   doc.fontSize(config.fontSize??fontDefault)
   doc.text(text.trim(), {
      width: config.wrapperWidth??wrapperWidth,      // szerokość kolumny
      align: config.align??'left',   // left / right / center / justify
      lineGap: lineGap       // odstęp między liniami
   })
}

function writeBorderedLine(widths, aligns, texts, config = {}) {
    doc.font(config.font ?? textFont);
    doc.fontSize(config.fontSize ?? fontDefault);
    doc.fillColor(config.textColor ?? grayTextColor);

    // Obsługa osobnych paddingów z zachowaniem fallbacków
    const defaultPadding = config.padding ?? 6;
    const paddingTop = config.paddingTop ?? defaultPadding;
    const paddingBottom = config.paddingBottom ?? defaultPadding;
    const paddingLeft = config.paddingLeft ?? defaultPadding;
    const paddingRight = config.paddingRight ?? defaultPadding;

    const lineGap = config.lineGap ?? 2;
    
    // Jeśli szerokości są podane jako procenty (np. suma = 100)
    const totalWidthConfig = widths.reduce((acc, val) => acc + val, 0);
    const availableWidth = config.wrapperWidth ?? wrapperWidth;
    
    const absoluteWidths = widths.map(w => {
        if (totalWidthConfig <= 100) {
            return (w / 100) * availableWidth;
        }
        return w; 
    });

    // 1. Oblicz maksymalną wysokość wiersza na podstawie najdłuższej kolumny
    let maxHeight = 0;
    texts.forEach((text, index) => {
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

    // 3. Rysowanie ramek i tekstów
    let currentX = doc.x;
    const startY = doc.y;
    const totalRowWidth = absoluteWidths.reduce((a, b) => a + b, 0);

    if (config.border !== false) {
        const colorSource = config.borderColors ?? config.borderColor;

        // Wariant A: Jeśli podano tablicę kolorów dla kolumn (np. ['#ff0000', null, '#0000ff'])
        if (Array.isArray(colorSource)) {
            texts.forEach((_, index) => {
                const colWidth = absoluteWidths[index];
                const colBorderColor = colorSource[index];

                // Rysujemy ramkę dla kolumny TYLKO jeśli jej kolor nie jest null/false/undefined
                if (colBorderColor !== null && colBorderColor !== false && colBorderColor !== undefined) {
                    doc.save()
                       .strokeColor(colBorderColor)
                       .lineWidth(config.borderWidth || 1)
                       .rect(currentX, startY, colWidth, maxHeight)
                       .stroke()
                       .restore();
                }
                currentX += colWidth;
            });
        } 
        // Wariant B: Standardowa ramka dla całego wiersza / pojedynczy kolor
        else {
            const rowBorderColor = colorSource ?? '#cccccc';
            if (rowBorderColor !== null && rowBorderColor !== false && rowBorderColor !== undefined) {
                doc.save()
                   .strokeColor(rowBorderColor)
                   .lineWidth(config.borderWidth || 1)
                   .rect(currentX, startY, totalRowWidth, maxHeight)
                   .stroke()
                   .restore();
            }
        }
    }

    // Reset currentX do wypisania tekstów
    currentX = doc.x;

    texts.forEach((text, index) => {
        const colWidth = absoluteWidths[index];

        // Określenie wyrównania dla konkretnej kolumny
        let colAlign = 'left';
        if (Array.isArray(aligns)) {
            colAlign = aligns[index] ?? config.align ?? 'left';
        } else if (typeof aligns === 'string') {
            colAlign = aligns;
        } else if (config.align) {
            colAlign = config.align;
        }

        // Wypisanie tekstu wewnątrz komórki
        doc.text(String(text).trim(), currentX + paddingLeft, startY + paddingTop, {
            width: colWidth - (paddingLeft + paddingRight),
            align: colAlign,
            lineGap: lineGap
        });

        currentX += colWidth;
    });

    // Przesunięcie kursora Y na koniec wiersza
    doc.y = startY + maxHeight;
    
    if (config.rowGap) {
        doc.y += config.rowGap;
    }
}























doc.x = margin
doc.y = margin














function writeDate(text){
   const lines = text.split('\n')
   for(const line of lines){
      doc.x = margin
      writeBorderedLine([50, 50], ['left', 'right'], ['', line], {
         padding: 8,
         borderColor: '#ffffff',
         rowGap: 0,
         paddingTop: 0,
         paddingBottom: 0,
      })
      doc.x = margin
   }
}

function writeTitle(text){
   writeLine(text,{
      fontSize: fontH1,
      align: 'center',
   })
}

function writeItemLine(widths,aligns,items,config){
   doc.x = margin
   // Przykład z szerokościami procentowymi (sumują się do 100) lub w punktach
   writeBorderedLine(widths, aligns, items, {
      ...config,
      paddingTop: 4,    //większy odstęp od góry ramki
      paddingBottom: 4,  //mniejszy odstęp od dołu ramki
      paddingLeft: 8,
      paddingRight: 8,
      borderColor: '#000000',
      borderWidth: 0.5,
      rowGap: 0 // odstęp po wierszu
   });
   doc.x = margin
}

















writeDate(`Starogard Gdański
08.11.2026`)

writeTitle('FV/1/2026')



const itemWidths = [30,30,40]
const itemHeaderAligns = ['left', 'center', 'right']
const itemAligns = ['left', 'center', 'right']


writeItemLine(itemWidths,itemHeaderAligns,['kol1', 'kol2', 'kol3'],{
   font: boldFont,
   borderColors: ['#ff0000', null, '#0000ff'],
})

writeItemLine(itemWidths,itemAligns,['kol1', 'kol2', 'kol3'])
writeItemLine(itemWidths,itemAligns,['kol1', 'kol2', 'kol3'])
writeItemLine(itemWidths,itemAligns,['kol1', 'kol2', 'kol3'])






doc.end()