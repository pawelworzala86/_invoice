import PDFDocument from 'pdfkit'
import fs from 'fs'



const grayTextColor = '#555'
const headingsColor = '#101112'
const blackTextColor = '#161616'
const captionTextColor = '#11375f'


const margin = 25
const wrapperWidth = 595-(margin*2)



const fontH1 = 32
const fontH2 = 14
const fontDefault = 9.15
const fontLabel = 12.5
const fontSubLabel = 11
const fontCaption = 10

const lineGap = 1.28
//const boldFont = './fonts/Open_Sans/static/OpenSans-Bold.ttf'
//const headerFont = './fonts/Open_Sans/static/OpenSans-SemiBold.ttf'
const textFont = './fonts/Open_Sans/static/OpenSans-Regular.ttf'



const doc = new PDFDocument({
  size: 'A4',
  margin: margin
})

doc.pipe(fs.createWriteStream('invoice.pdf'))




function write(text){
   doc.text(text, {
      width: wrapperWidth,      // szerokość kolumny
      align: 'left',   // left / right / center / justify
      lineGap: lineGap,       // odstęp między liniami
      //link: config.url,
   })
}

function writeLine(size,text,config={}){
   doc.fillColor(config.textColor??blackTextColor)
    doc.font(config.font??textFont)
    .fontSize(size)
    .text(text, {
      width: config.wrapperWidth??wrapperWidth,      // szerokość kolumny
      align: 'left',   // left / right / center / justify
      lineGap: lineGap,       // odstęp między liniami
      link: config.url,
   })
}

function writeCenter(text,config={}){
   doc.font(config.font??textFont)

   doc.fillColor(grayTextColor)
   doc.fontSize(config.fontSize??fontDefault)
   doc.text(text.trim(), {
      width: config.wrapperWidth??wrapperWidth,      // szerokość kolumny
      align: config.align??'left',   // left / right / center / justify
      lineGap: lineGap       // odstęp między liniami
   })
}

function writeText(text,config={}){
   doc.font(config.font??textFont)

   doc.fillColor(grayTextColor)
   doc.fontSize(fontDefault)
   doc.text(text.trim(), {
      width: config.wrapperWidth??wrapperWidth,      // szerokość kolumny
      align: 'left',   // left / right / center / justify
      lineGap: lineGap       // odstęp między liniami
   })
}

function writeLI(text,config={}){
   //doc.image('./images/dot.png', doc.x, doc.y+4, { width: 4.5 })

   doc.font(config.font??textFont)

   const paddingLeft = 8

   doc.x += paddingLeft

   doc.fillColor(grayTextColor)
   doc.fontSize(fontDefault)
   doc.text(text.trim(), {
      width: config.wrapperWidth??wrapperWidth,      // szerokość kolumny
      align: 'left',   // left / right / center / justify
      lineGap: lineGap       // odstęp między liniami
   })

   doc.x -= paddingLeft
}

function writeULHeader(caption,config={}){
   doc.font(config.font??headerFont)
   doc.fontSize(fontSubLabel)
   if(caption.length){
      doc.fillColor(captionTextColor)
      //doc.font(boldFont)
      write(caption.toUpperCase())
   }
}

function paragraph(caption,text,config={}){
   //doc.font(config.font??textFont)
   if(caption.length){
      doc.fillColor(captionTextColor)
      doc.font(headerFont)
      writeLine(config.captionSize??fontCaption, caption.toUpperCase())
   }

   //doc.font(config.font??textFont)

   if(config.rightText){
      doc.y = doc.y - (config.captionSize??fontDefault)*1.2
      doc.font(headerFont)
      doc.text(config.rightText.toUpperCase(), {
         width: config.wrapperWidth??wrapperWidth,      // szerokość kolumny
         align: 'right',   // left / right / center / justify
         lineGap: lineGap       // odstęp między liniami
      })
   }
   doc.font(config.font??textFont)

   doc.fillColor(grayTextColor)
   doc.fontSize(fontDefault)
   doc.text(text.trim(), {
      width: config.wrapperWidth??wrapperWidth,      // szerokość kolumny
      align: 'left',   // left / right / center / justify
      lineGap: lineGap       // odstęp między liniami
   })
   doc.y = doc.y + 2.5
}

function writeLabel(text,fontSize=fontLabel,labelOffset=4){
   doc.y = doc.y + 17
   doc.fillColor(blackTextColor)
   writeLine(fontSize, text.toUpperCase(),{
      font: boldFont,
   })
   doc.y = doc.y + labelOffset
}

function writeBorderedLine(widths, texts, config = {}) {
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
    
    // Jeśli szerokości są podane jako procenty (np. suma = 100), 
    // możemy je przeliczyć względem wrapperWidth. Jeśli to punkty, zostają bez zmian.
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
        // Całkowita wysokość komórki to wysokość tekstu + padding górny i dolny
        const totalCellHeight = textHeight + paddingTop + paddingBottom;
        if (totalCellHeight > maxHeight) {
            maxHeight = totalCellHeight;
        }
    });

    // 2. Obsługa Page Break (Sprawdzenie czy wiersz mieści się na stronie)
    const bottomMargin = doc.page.margins.bottom;
    const pageHeight = doc.page.height;
    
    if (doc.y + maxHeight > pageHeight - bottomMargin) {
        doc.addPage();
    }

    // 3. Rysowanie kolumn (ramki i tekst)
    let currentX = doc.x;
    const startY = doc.y;

    texts.forEach((text, index) => {
        const colWidth = absoluteWidths[index];

        // Rysowanie ramki komórki
        if (config.border !== false) {
            doc.save()
               .strokeColor(config.borderColor || '#cccccc')
               .lineWidth(config.borderWidth || 1)
               .rect(currentX, startY, colWidth, maxHeight)
               .stroke()
               .restore();
        }

        // Wypisanie tekstu wewnątrz komórki z uwzględnieniem oddzielnego paddingu góra/lewo
        doc.text(String(text).trim(), currentX + paddingLeft, startY + paddingTop, {
            width: colWidth - (paddingLeft + paddingRight),
            align: config.align ?? 'left',
            lineGap: lineGap
        });

        currentX += colWidth;
    });

    // Przesunięcie kursora Y na koniec wiersza dla kolejnych elementów
    doc.y = startY + maxHeight;
    
    // Opcjonalny odstęp po wierszu
    if (config.rowGap) {
        doc.y += config.rowGap;
    }
}























doc.x = margin
doc.y = margin






































doc.y = doc.y + 40

writeCenter('FV/1/2026',{
   fontSize: fontH1,
   align: 'center',
})





doc.x = margin

// Przykład z szerokościami procentowymi (sumują się do 100) lub w punktach
writeBorderedLine([30, 30, 40], ['kol1', 'kol2', 'kol3'], {
    paddingTop: 4,    //większy odstęp od góry ramki
    paddingBottom: 4,  //mniejszy odstęp od dołu ramki
    paddingLeft: 8,
    paddingRight: 8,
    borderColor: '#000000',
    borderWidth: 0.5,
    rowGap: 0 // odstęp po wierszu
});
doc.x = margin
// Przykład z szerokościami procentowymi (sumują się do 100) lub w punktach
writeBorderedLine([30, 30, 40], ['kol1', 'kol2', 'kol3'], {
    paddingTop: 4,    //większy odstęp od góry ramki
    paddingBottom: 4,  //mniejszy odstęp od dołu ramki
    paddingLeft: 8,
    paddingRight: 8,
    borderColor: '#000000',
    borderWidth: 0.5,
    rowGap: 0 // odstęp po wierszu
});
doc.x = margin
// Przykład z szerokościami procentowymi (sumują się do 100) lub w punktach
writeBorderedLine([30, 30, 40], ['kol1', 'kol2', 'kol3'], {
    paddingTop: 4,    //większy odstęp od góry ramki
    paddingBottom: 4,  //mniejszy odstęp od dołu ramki
    paddingLeft: 8,
    paddingRight: 8,
    borderColor: '#000000',
    borderWidth: 0.5,
    rowGap: 0 // odstęp po wierszu
});

// Kolejny wiersz automatycznie poleci niżej, a jeśli zabraknie miejsca, stworzy nową stronę
writeBorderedLine([30, 30, 40], ['Dłuższy tekst w kolumnie pierwszej', 'Krótko', 'Trzecia kolumna z dłuższą zawartością tekstową'], {
    padding: 8
});





doc.end()