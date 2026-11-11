import Document from './document.ts'
import fs from 'fs'

export class Invoice extends Document{
    data:any
    constructor(filePath:string){
        super()
        this.data = JSON.parse(fs.readFileSync(filePath).toString()).faktura
    }
    writeDate(text:string){
        const {doc} = this
        const lines = text.split('\n')
        for(const line of lines){
            doc.x = this.margin
            this.writeBorderedLine([50, 50], ['left', 'right'], ['', line], {
                padding: 8,
                borderColor: '#ffffff',
                rowGap: 0,
                paddingTop: 0,
                paddingBottom: 0,
            })
            doc.x = this.margin
        }
    }
    writeTitle(text:string){
        this.writeLine(text,{
            fontSize: this.fontH1,
            align: 'center',
        })
    }
    writeItemLine(widths:any,aligns:any,items:any,config:any={}){
        const {doc} = this
        doc.x = this.margin
        // Przykład z szerokościami procentowymi (sumują się do 100) lub w punktach
        this.writeBorderedLine(widths, aligns, items, {
            paddingTop: 4,    //większy odstęp od góry ramki
            paddingBottom: 4,  //mniejszy odstęp od dołu ramki
            paddingLeft: 8,
            paddingRight: 8,
            //borderColor: '#000000',
            borderWidth: 0.5,
            rowGap: 0, // odstęp po wierszu
            ...config,
        });
        doc.x = this.margin
    }





    make(){
        const {doc} = this
        const invoice = this.data

        doc.x = this.margin
        doc.y = this.margin





        this.writeDate(invoice.miejsce_wystawienia+'\n'+invoice.data_wystawienia)

        this.writeSpace(35)

        this.writeTitle(invoice.numer)

        this.writeSpace(35)

        this.writeItemLine([35,30,35],['left','left','left'],[`Sprzedawca:`, '', 'Nabywca:'],{
            borderColor: '#ffffff',
            font: this.boldFont,
            paddingTop: 4,    //większy odstęp od góry ramki
            paddingBottom: 0,  //mniejszy odstęp od dołu ramki
        })
        this.writeItemLine([35,30,35],['left','left','left'],[
            invoice.sprzedawca.nazwa+'\nNIP: '+invoice.sprzedawca.nip+'\n'+invoice.sprzedawca.adres.replace(/(\, |\,)/gm,'\n'),
            '', 
            invoice.nabywca.nazwa+'\nNIP: '+invoice.nabywca.nip+'\n'+invoice.nabywca.adres.replace(/(\, |\,)/gm,'\n'),
            ],{
            borderColor: '#ffffff',
        })

        this.writeSpace(35)

        const itemWidths = [35,15,10,8,12,8,12]
        const itemHeaderAligns = ['left', 'left', 'right', 'left', 'right', 'right', 'right']
        const itemAligns = ['left', 'left', 'right', 'left', 'right', 'right', 'right']


        this.writeItemLine(itemWidths,itemHeaderAligns,['Nazwa towaru/usługi', 'pkwiu', 'ilosc', 'jm', 'c.netto','VAT','w.brutto'],{
            font: this.boldFont,
        })

        for(const pozycja of invoice.pozycje){
            this.writeItemLine(itemWidths,itemAligns,[
                pozycja.nazwa_towaru_uslugi, 
                pozycja.pkwiu, 
                pozycja.ilosc,
                pozycja.jednostka,
                pozycja.cena_netto.toFixed(2),
                pozycja.stawka_vat,
                pozycja.wartosc_brutto.toFixed(2),
            ])
        }

        this.writeSpace(30)

        this.writeItemLine([35,30,35],['center','center','center'],[
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
        this.writeItemLine([35,30,35],['center','center','center'],[
                'wystawił', 
                '', 
                'odebrał',
            ],{
            //height: 80,
            //alignBottom: true,
            //borderColors: ['#cccccc', null, '#cccccc'],
            //borderWidth: 1,
            borderColor: '#ffffff',
            font: this.boldFont,
            paddingTop: 0,    //większy odstęp od góry ramki
            paddingBottom: 4,  //mniejszy odstęp od dołu ramki
        })

        doc.end()
    }
}

export default Invoice