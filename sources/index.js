import PDFDocument from 'pdfkit'
import fs from 'fs'





const invoice = JSON.parse(fs.readFileSync('./invoice.json').toString()).faktura








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

    // 1. Oblicz maksymalną wysokość wiersza na podstawie zawartości
    let maxHeight = config.height ?? 0; 
    
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

    // 3. Rysowanie ramek kolumn
    let currentX = doc.x;
    const startY = doc.y;
    const totalRowWidth = absoluteWidths.reduce((a, b) => a + b, 0);

    if (config.border !== false) {
        const colorSource = config.borderColors ?? config.borderColor;

        if (Array.isArray(colorSource)) {
            texts.forEach((_, index) => {
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

    texts.forEach((text, index) => {
        const colWidth = absoluteWidths[index];
        const textStr = String(text).trim();

        let colAlign = 'left';
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

function writeSpace(spaceHeight) {
    const bottomMargin = doc.page.margins.bottom;
    const pageHeight = doc.page.height;
    
    // Sprawdzamy czy dodanie odstępu spowoduje wyjście poza margines dolny strony
    if (doc.y + spaceHeight > pageHeight - bottomMargin) {
        doc.addPage();
        doc.x = margin; // Przywrócenie marginesu X dla nowej strony
    } else {
        doc.y += spaceHeight;
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
      paddingTop: 4,    //większy odstęp od góry ramki
      paddingBottom: 4,  //mniejszy odstęp od dołu ramki
      paddingLeft: 8,
      paddingRight: 8,
      //borderColor: '#000000',
      borderWidth: 0.5,
      rowGap: 0, // odstęp po wierszu
      ...config,
   });
   doc.x = margin
}




















writeDate(invoice.miejsce_wystawienia+'\n'+invoice.data_wystawienia)

writeSpace(35)

writeTitle(invoice.numer)

writeSpace(35)

writeItemLine([35,30,35],['left','left','left'],[`Sprzedawca:`, '', 'Nabywca:'],{
    borderColor: '#ffffff',
    font: boldFont,
    paddingTop: 4,    //większy odstęp od góry ramki
    paddingBottom: 0,  //mniejszy odstęp od dołu ramki
})
writeItemLine([35,30,35],['left','left','left'],[
    invoice.sprzedawca.nazwa+'\nNIP: '+invoice.sprzedawca.nip+'\n'+invoice.sprzedawca.adres.replace(/(\, |\,)/gm,'\n'),
    '', 
    invoice.nabywca.nazwa+'\nNIP: '+invoice.nabywca.nip+'\n'+invoice.nabywca.adres.replace(/(\, |\,)/gm,'\n'),
    ],{
   borderColor: '#ffffff',
})

writeSpace(35)

const itemWidths = [35,15,10,8,12,8,12]
const itemHeaderAligns = ['left', 'left', 'right', 'left', 'right', 'right', 'right']
const itemAligns = ['left', 'left', 'right', 'left', 'right', 'right', 'right']


writeItemLine(itemWidths,itemHeaderAligns,['Nazwa towaru/usługi', 'pkwiu', 'ilosc', 'jm', 'c.netto','VAT','w.brutto'],{
   font: boldFont,
})

for(const pozycja of invoice.pozycje){
    writeItemLine(itemWidths,itemAligns,[
        pozycja.nazwa_towaru_uslugi, 
        pozycja.pkwiu, 
        pozycja.ilosc,
        pozycja.jednostka,
        pozycja.cena_netto.toFixed(2),
        pozycja.stawka_vat,
        pozycja.wartosc_brutto.toFixed(2),
    ])
}

writeSpace(30)


writeItemLine([35,30,35],['center','center','center'],[
    '......................................................', 
    '', 
    '......................................................',
   ],{
   height: 80,
   alignBottom: true,
   //borderColors: ['#cccccc', null, '#cccccc'],
   borderWidth: 1,
   borderColor: '#ffffff',
   paddingTop: 4,    //większy odstęp od góry ramki
   paddingBottom: 0,  //mniejszy odstęp od dołu ramki
})
writeItemLine([35,30,35],['center','center','center'],[
    'wystawił', 
    '', 
    'odebrał',
   ],{
   //height: 80,
   //alignBottom: true,
   //borderColors: ['#cccccc', null, '#cccccc'],
   //borderWidth: 1,
   borderColor: '#ffffff',
   font: boldFont,
   paddingTop: 0,    //większy odstęp od góry ramki
   paddingBottom: 4,  //mniejszy odstęp od dołu ramki
})




doc.end()