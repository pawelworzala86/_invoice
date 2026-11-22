import Document from './document.ts'
import type { BorderedLineConfig, TextAlignment, TextValue } from './document.ts'
import type { InvoiceData } from './invoice.ts'

export class InvoicePdfRenderer extends Document {
    private readonly invoice: InvoiceData

    constructor(invoice: InvoiceData) {
        super()
        this.invoice = invoice
    }

    async render(): Promise<Buffer> {
        this.writeInvoice()
        return this.toBuffer()
    }

    private writeInvoice(): void {
        const { details, seller, buyer, items, summary, payment } = this.invoice
        this.doc.x = this.margin
        this.doc.y = this.margin

        this.writeDate(`${details.issuePlace} ${details.issueDate}\nData sprzedaży: ${details.saleDate}`)
        this.writeSpace(24)
        this.writeLine(details.number, { fontSize: this.fontH1, align: 'center' })
        this.writeSpace(24)

        this.writeItemLine([35, 30, 35], ['left', 'left', 'left'], [
            'Sprzedawca:',
            '',
            'Nabywca:',
        ], {
            borderColor: '#ffffff',
            font: this.boldFont,
            paddingTop: 4,
            paddingBottom: 0,
        })
        this.writeItemLine([35, 30, 35], ['left', 'left', 'left'], [
            this.formatCompany(seller),
            '',
            this.formatCompany(buyer),
        ], { borderColor: '#ffffff' })

        this.writeSpace(24)

        const itemWidths = [5, 23, 10, 7, 5, 12, 13, 8, 17]
        const itemAlignments: TextAlignment[] = [
            'right', 'left', 'left', 'right', 'left', 'right', 'right', 'right', 'right',
        ]
        this.writeItemLine(itemWidths, itemAlignments, [
            'Lp.',
            'Nazwa towaru/usługi',
            'PKWiU',
            'Ilość',
            'Jm',
            'Netto/j.',
            'Netto',
            'VAT',
            'Brutto',
        ], {
            font: this.boldFont,
            fontSize: 7.5,
            padding: 3,
        })

        for (const item of items) {
            this.writeItemLine(itemWidths, itemAlignments, [
                item.positionNumber,
                item.itemName,
                item.pkwiu,
                item.quantity,
                item.unit,
                this.formatAmount(item.netPrice),
                this.formatAmount(item.netValue),
                `${item.vatRate}%`,
                this.formatAmount(item.grossValue),
            ], {
                fontSize: 7.5,
                padding: 3,
            })
        }

        this.writeSpace(20)
        this.writeItemLine([100], ['right'], [
            'Podsumowanie:',
        ],{ 
            font: this.boldFont,
            borderColor: '#ffffff',
        })
        this.writeItemLine([80, 20], ['right', 'right'], [
            'Netto:',
            `${this.formatAmount(summary.totalNet)} ${summary.currency}`,
        ],{ 
            font: this.boldFont,
            borderColor: '#ffffff',
        })
        this.writeItemLine([80, 20], ['right', 'right'], [
            'VAT:',
            `${this.formatAmount(summary.totalVat)} ${summary.currency}`,
        ], { 
            font: this.boldFont,
            borderColor: '#ffffff',
        })
        this.writeItemLine([80, 20], ['right', 'right'], [
            'Brutto:',
            `${this.formatAmount(summary.totalGross)} ${summary.currency}`,
        ],{ 
            font: this.boldFont,
            borderColor: '#ffffff',
        })

        this.writeSpace(12)
        this.writeItemLine([10, 90], ['left', 'left'], [
            'Płatność:',
            `${payment.method}`,
        ],{
            borderColor: '#ffffff',
        })
        this.writeSpace(-4)
        this.writeItemLine([10, 90], ['left', 'left'], [
            'Termin:',
            `${payment.dueDate}`,
        ],{
            borderColor: '#ffffff',
        })
        this.writeSpace(-4)
        this.writeItemLine([10, 90], ['left', 'left'], [
            'Status:',
            `${payment.status}`,
        ],{
            borderColor: '#ffffff',
        })

        this.writeSpace(24)
        this.writeItemLine([35, 30, 35], ['center', 'center', 'center'], [
            '......................................................',
            '',
            '......................................................',
        ], {
            height: 65,
            alignBottom: true,
            borderColor: '#ffffff',
            paddingTop: 4,
            paddingBottom: 0,
        })
        this.writeItemLine([35, 30, 35], ['center', 'center', 'center'], [
            'wystawił',
            '',
            'odebrał',
        ], {
            borderColor: '#ffffff',
            font: this.boldFont,
            paddingTop: 0,
            paddingBottom: 4,
        })
    }

    private writeDate(text: string): void {
        for (const line of text.split('\n')) {
            this.writeItemLine([50, 50], ['left', 'right'], ['', line], {
                padding: 8,
                borderColor: '#ffffff',
                rowGap: 0,
                paddingTop: 0,
                paddingBottom: 0,
            })
        }
    }

    private writeItemLine(
        widths: readonly number[],
        aligns: readonly TextAlignment[],
        items: readonly TextValue[],
        config: BorderedLineConfig = {},
    ): void {
        this.doc.x = this.margin
        this.writeBorderedLine(widths, aligns, items, {
            paddingTop: 4,
            paddingBottom: 4,
            paddingLeft: 8,
            paddingRight: 8,
            borderWidth: 0.5,
            rowGap: 0,
            ...config,
        })
        this.doc.x = this.margin
    }

    private formatCompany(company: InvoiceData['seller']): string {
        return `${company.name}\nNIP: ${company.nip}\n${company.address.replace(/,\s*/g, '\n')}`
    }

    private formatAmount(amount: number): string {
        return amount.toFixed(2)
    }
}

export default InvoicePdfRenderer
