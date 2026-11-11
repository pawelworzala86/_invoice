import Document from './document.ts'

export interface CompanyInfo {
  name: string;
  nip: string;
  address: string;
}

export interface InvoiceItem {
  positionNumber: number;
  itemName: string;
  pkwiu: string;
  quantity: number;
  unit: string;
  netPrice: number;
  netValue: number;
  vatRate: number;
  vatAmount: number;
  grossValue: number;
}

export interface InvoiceSummary {
  totalNet: number;
  totalVat: number;
  totalGross: number;
  currency: string;
}

export interface InvoicePayment {
  method: string;
  dueDate: string;
  status: string;
}

export interface InvoiceDetails {
  number: string;
  issueDate: string;
  saleDate: string;
  issuePlace: string;
  seller: CompanyInfo;
  buyer: CompanyInfo;
  items: InvoiceItem[];
  summary: InvoiceSummary;
  payment: InvoicePayment;
}

export class Invoice extends Document{
    data:InvoiceDetails
    constructor(data:InvoiceDetails){
        super()
        this.data = data
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





        this.writeDate(invoice.issuePlace+' '+invoice.issueDate)

        this.writeSpace(35)

        this.writeTitle(invoice.number)

        this.writeSpace(35)

        this.writeItemLine([35,30,35],['left','left','left'],[`Sprzedawca:`, '', 'Nabywca:'],{
            borderColor: '#ffffff',
            font: this.boldFont,
            paddingTop: 4,    //większy odstęp od góry ramki
            paddingBottom: 0,  //mniejszy odstęp od dołu ramki
        })
        this.writeItemLine([35,30,35],['left','left','left'],[
            invoice.seller.name+'\nNIP: '+invoice.seller.nip+'\n'+invoice.seller.address.replace(/(\, |\,)/gm,'\n'),
            '', 
            invoice.buyer.name+'\nNIP: '+invoice.buyer.nip+'\n'+invoice.buyer.address.replace(/(\, |\,)/gm,'\n'),
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

        for(const pozycja of invoice.items){
            this.writeItemLine(itemWidths,itemAligns,[
                pozycja.itemName, 
                pozycja.pkwiu, 
                pozycja.quantity,
                pozycja.unit,
                pozycja.netPrice.toFixed(2),
                pozycja.vatRate,
                pozycja.grossValue.toFixed(2),
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

        return this.toBuffer()
    }
}

export default Invoice