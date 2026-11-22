export interface CompanyInfo {
    name: string
    nip: string
    address: string
}

export interface InvoiceItemInput {
    positionNumber: number
    itemName: string
    pkwiu: string
    quantity: number
    unit: string
    netPrice: number
    vatRate: number
}

export interface InvoiceItem extends InvoiceItemInput {
    netValue: number
    vatAmount: number
    grossValue: number
}

export interface InvoiceSummary {
    totalNet: number
    totalVat: number
    totalGross: number
    currency: string
}

export interface InvoicePayment {
    method: string
    dueDate: string
    status: string
}

export interface InvoiceDetails {
    number: string
    issueDate: string
    saleDate: string
    issuePlace: string
}

export interface InvoiceInput {
    details: InvoiceDetails
    seller: CompanyInfo
    buyer: CompanyInfo
    items: readonly InvoiceItemInput[]
    payment: InvoicePayment
    currency: string
}

export interface InvoiceData {
    details: InvoiceDetails
    seller: CompanyInfo
    buyer: CompanyInfo
    items: readonly InvoiceItem[]
    summary: InvoiceSummary
    payment: InvoicePayment
}

function roundCurrency(value: number): number {
    if (!Number.isFinite(value) || Math.abs(value * 100) > Number.MAX_SAFE_INTEGER) {
        throw new RangeError('Monetary amount exceeds supported precision')
    }
    return Math.round((value + Number.EPSILON) * 100) / 100
}

function requireText(value: string, field: string): void {
    if (value.trim() === '') {
        throw new Error(`${field} is required`)
    }
}

function requireFinite(value: number, field: string): void {
    if (!Number.isFinite(value)) {
        throw new Error(`${field} must be a finite number`)
    }
}

export class Invoice {
    readonly details: InvoiceDetails
    readonly seller: CompanyInfo
    readonly buyer: CompanyInfo
    readonly items: readonly InvoiceItem[]
    readonly summary: InvoiceSummary
    readonly payment: InvoicePayment

    constructor(input: InvoiceInput) {
        this.validateInput(input)
        this.details = { ...input.details }
        this.seller = { ...input.seller }
        this.buyer = { ...input.buyer }
        this.payment = { ...input.payment }
        this.items = input.items.map((item) => this.calculateItem(item))
        this.summary = this.calculateSummary(input.currency)
    }

    toData(): InvoiceData {
        return {
            details: this.details,
            seller: this.seller,
            buyer: this.buyer,
            items: this.items,
            summary: this.summary,
            payment: this.payment,
        }
    }

    private validateInput(input: InvoiceInput): void {
        for (const [field, value] of Object.entries(input.details)) {
            requireText(value, `Invoice ${field}`)
        }
        for (const [party, company] of [['Seller', input.seller], ['Buyer', input.buyer]] as const) {
            requireText(company.name, `${party} name`)
            requireText(company.nip, `${party} NIP`)
            requireText(company.address, `${party} address`)
        }
        requireText(input.payment.method, 'Payment method')
        requireText(input.payment.dueDate, 'Payment due date')
        requireText(input.payment.status, 'Payment status')
        requireText(input.currency, 'Currency')

        if (input.items.length === 0) {
            throw new Error('An invoice must contain at least one item')
        }

        const positions = new Set<number>()
        input.items.forEach((item, index) => {
            const itemLabel = `Item ${index + 1}`
            requireText(item.itemName, `${itemLabel} name`)
            requireText(item.pkwiu, `${itemLabel} PKWiU`)
            requireText(item.unit, `${itemLabel} unit`)
            requireFinite(item.positionNumber, `${itemLabel} position`)
            requireFinite(item.quantity, `${itemLabel} quantity`)
            requireFinite(item.netPrice, `${itemLabel} net price`)
            requireFinite(item.vatRate, `${itemLabel} VAT rate`)

            if (!Number.isInteger(item.positionNumber) || item.positionNumber < 1) {
                throw new Error(`${itemLabel} position must be a positive integer`)
            }
            if (positions.has(item.positionNumber)) {
                throw new Error(`Duplicate invoice item position: ${item.positionNumber}`)
            }
            positions.add(item.positionNumber)

            if (item.quantity <= 0 || item.netPrice < 0 || item.vatRate < 0 || item.vatRate > 100) {
                throw new Error(`${itemLabel} has invalid quantity, net price, or VAT rate`)
            }
        })
    }

    private calculateItem(item: InvoiceItemInput): InvoiceItem {
        const netValue = roundCurrency(item.quantity * item.netPrice)
        const vatAmount = roundCurrency(netValue * item.vatRate / 100)
        return {
            ...item,
            netValue,
            vatAmount,
            grossValue: roundCurrency(netValue + vatAmount),
        }
    }

    private calculateSummary(currency: string): InvoiceSummary {
        const totalNet = roundCurrency(this.items.reduce((total, item) => total + item.netValue, 0))
        const totalVat = roundCurrency(this.items.reduce((total, item) => total + item.vatAmount, 0))
        return {
            totalNet,
            totalVat,
            totalGross: roundCurrency(totalNet + totalVat),
            currency,
        }
    }
}

export default Invoice
