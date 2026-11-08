import PDFDocument from 'pdfkit'
import fs from 'fs'



const grayTextColor = '#555'
const headingsColor = '#101112'
const blackTextColor = '#161616'
const accentColor = '#41b5c7'
const captionTextColor = '#11375f'


const wrapperWidth = 380
const margin = 10


const fontH1 = 32
const fontH2 = 14
const fontDefault = 9.15
const fontLabel = 12.5
const fontSubLabel = 11
const labelLeftFontSize = 10
const fontCaption = 10

const lineGap = 1.28
const shadowOpacity = 0.026

const boldFont = './fonts/Open_Sans/static/OpenSans-Bold.ttf'
const headerFont = './fonts/Open_Sans/static/OpenSans-SemiBold.ttf'
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
   doc.image('./images/dot.png', doc.x, doc.y+4, { width: 4.5 })

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






doc.rect(0, 0, doc.page.width, doc.page.height)
   .fill('#F3F7FD')






doc.rect(0, 180, 165, doc.page.height)
   .fill('#DDE9F9')
//doc.rect(165, 0, wrapperWidth+20, 165)
//   .fill('#ddd')




const gradient = doc.linearGradient(20, 500, 20, doc.page.height-80) // x1,y1,x2,y2
gradient.stop(0, '#f8fafe')   // kolor start
gradient.stop(1, '#DDE9F9')   // kolor koniec

doc.roundedRect(20, 500, doc.page.width, doc.page.height, 0)
   .fill(gradient)





doc.image('./images/avatar.png', 0, 0, { width: 165 })

doc.image('./images/rightozdoba.png', 525, 0, { width: 74 })




const topWrapperOffset = 220
const bottomWrapperOffset = 540

const shadowColor = '#ddd'
const r = 12

for (let i = 1; i <= 4; i+=0.5) {
  doc.roundedRect(20 - i, topWrapperOffset - i, 560+i*2, bottomWrapperOffset+i*2, r)
     .fillOpacity(shadowOpacity * i)
     .fill(shadowColor)
}
doc.fillOpacity(1)

doc.roundedRect(20, topWrapperOffset, 440, bottomWrapperOffset, 10)
   .fill('#EDF3FC')


doc.rect(30, 670, 140, 1)
   .fill('#dddddd')



for (let i = 1; i <= 2; i+=0.5) {
  doc.roundedRect(177 - i, topWrapperOffset, 20, bottomWrapperOffset, r)
     .fillOpacity(shadowOpacity * i)
     .fill(shadowColor)
}
doc.fillOpacity(1)

doc.roundedRect(180, topWrapperOffset, 400, bottomWrapperOffset, 10)
   .fill('#FDFDFE')

doc.rect(190, 670, 380, 1)
   .fill('#dddddd')


const defaultX = doc.x
const defaultY = doc.y

doc.x = 30
doc.y = margin





doc.y = topWrapperOffset

const labelOffset = 4
const contactYoffset = 4



















writeLabel('Dane kontaktowe', labelLeftFontSize*1.25, labelOffset)

doc.fillColor(headingsColor)
writeLine(fontDefault,'+48666925387',{
   textColor: grayTextColor,
   url: 'tel:+48666925387',
})
doc.y += contactYoffset
writeLine(fontDefault,'pawelworzala86@gmail.com',{
   textColor: grayTextColor,
})
doc.y += contactYoffset
writeLine(fontDefault,'linkedin/pawelworzala',{
   textColor: grayTextColor,
   url: 'https://www.linkedin.com/in/pawelworzala/',
})
doc.y += contactYoffset
writeLine(fontDefault,'github/pawelworzala86',{
   textColor: grayTextColor,
   url: 'https://github.com/pawelworzala86',
})
doc.y += contactYoffset


const leftSideOffsetY = 8







doc.y += leftSideOffsetY

writeLabel('Języki programowania', labelLeftFontSize, labelOffset)
writeLine(fontDefault,'TypeScript, JavaScript, PHP, SQL, HTML, CSS, ASM',{
   wrapperWidth: 165 - margin*2,
   textColor: grayTextColor,
})
doc.y += leftSideOffsetY
writeLabel('Frameworki / biblioteki', labelLeftFontSize,labelOffset)
writeLine(fontDefault,'Next.js, Express, MVC, drizzle, zod, k6, pdfkit, openapi',{
   wrapperWidth: 165 - margin*2,
   textColor: grayTextColor,
})
doc.y += leftSideOffsetY
writeLabel('Bazy danych', labelLeftFontSize,labelOffset)
writeLine(fontDefault,'PostgreSQL, pgEdge, MariaDB',{
   wrapperWidth: 165 - margin*2,
   textColor: grayTextColor,
})
doc.y += leftSideOffsetY
writeLabel('Narzędzia', labelLeftFontSize,labelOffset)
writeLine(fontDefault,'Docker, Git, Node.js, Postman',{
   wrapperWidth: 165 - margin*2,
   textColor: grayTextColor,
})
doc.y += leftSideOffsetY



doc.y = 670
writeLabel('Specjalizacje', labelLeftFontSize,labelOffset)
writeLine(fontDefault,'REST API, MVC, backend, refactoring',{
   wrapperWidth: 165 - margin*2,
   textColor: grayTextColor,
})















doc.x = defaultX + 185
doc.y = -10

doc.fillColor(headingsColor)






doc.y = doc.y + 40

doc.fillColor(headingsColor)
doc.font(boldFont)
   .fontSize(fontH1)
   .text('PAWEŁ WORZAŁA')//, 50, 50)

doc.y = doc.y + 5

doc.fillColor(accentColor)
doc.font(headerFont)
   .fontSize(fontH2)
   .text('Backend Developer'.toUpperCase())//, 50, 80)

doc.y = doc.y + 10



paragraph('', `Backend Developer z komercyjnym doświadczeniem w tworzeniu i utrzymaniu skalowalnych systemów backendowych oraz projektowaniu baz danych. W pracy komercyjnej odpowiadam za rozwój zaawansowanych REST API w środowiskach TypeScript/Next.js oraz PHP (MVC). Specjalizuję się w implementacji architektury API, obsłudze relacyjnych baz danych (PostgreSQL, MariaDB) oraz tworzeniu dokumentacji technicznej w OpenAPI.`)


doc.y = topWrapperOffset


writeLabel('Doświadczenie zawodowe')
doc.y += 8
writeULHeader('05.2025 - obecnie | MedicalTech | backend TypeScript')
writeLI('Implementacja ponad 200 endpointów w TypeScript/Next.js (REST API).')
writeLI('Wdrożenie globalnych mechanizmów takich jak np. errorHandler.')
writeLI('Stworzenie dynamicznego filtrowania danych wejściowych z zapytań URL.')
writeLI('Implementacja testów API i obciążeniowych oparciu o k6.')
doc.y += 8

doc.y += 8
writeULHeader('06.2020 - 05.2025| Niezależny programista / freelance')
writeLI('Rozwój i utrzymanie ponad 130 repozytoriów/projektów w GitHub.')
writeLI('Projektowanie własnych frameworków, silników oraz narzędzi.')
writeLI('Zaprojektowanie i realizacja integracji do sklepów (np. SkyShop).')
writeLI('Tworzenie zaawansowanych architektur, optymalizacja wydajnościowa zapytań SQL.')
writeLI('Stworzenie prostego kompilatora TypeScript do ASM i do exe.')
doc.y += 8

doc.y += 8
writeULHeader('07.2017 - 06.2020 | ITPlex | backend PHP')
writeLI('Rozwój backendu w autorskim frameworku MVC - PHP 7, MariaDB')
writeLI('Implementacja modułów m.in. moduł fakturowania, generowania dokumentów.')
writeLI('Testowanie endpointów i przygotowywanie dokumentacji w Swagger/OpenAPI.')
doc.y += 8


writeLabel('Moje projekty')
writeLI('bTS - kompilator składni TypeScript do Assembly (fasmg), napisany w JS.')
writeLI('winasm - prosty kompilator assemblera pod Windows - PE64.')
writeLI('ds - prosty kompilator TypeScript do formatu win PE64.')
writeLI('simpleWebGL - prosty loader modeli 3d - przez przeglądarkę.')



doc.y = 670

writeLabel('Wykształcenie')

paragraph('', `2005-2007 - Technik Informatyk - Aplikacje sieciowe`)





doc.x = 60
doc.y = 780

paragraph('', `Wyrażam zgodę na przetwarzanie moich danych osobowych zawartych w CV na potrzeby niezbędne do realizacji procesu rekrutacji, zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO).`,{
   wrapperWidth: 480,
})

doc.end()