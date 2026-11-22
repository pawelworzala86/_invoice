import assert from 'node:assert/strict'
import test from 'node:test'
import Document from './document.ts'
import Invoice from './invoice.ts'
import InvoicePdfRenderer from './invoice-pdf.ts'

function createInvoice(items: ConstructorParameters<typeof Invoice>[0]['items'] = [{
    positionNumber: 1,
    itemName: 'Usługa',
    pkwiu: '01.11.11',
    quantity: 3,
    unit: 'szt',
    netPrice: 0.335,
    vatRate: 23,
}]): Invoice {
    return new Invoice({
        details: {
            number: 'FV/2026/001',
            issueDate: '2026-01-01',
            saleDate: '2026-01-01',
            issuePlace: 'Warszawa',
        },
        seller: { name: 'Sprzedawca', nip: '123', address: 'Adres sprzedawcy' },
        buyer: { name: 'Nabywca', nip: '456', address: 'Adres nabywcy' },
        items,
        payment: { method: 'Przelew', dueDate: '2026-01-15', status: 'Oczekująca' },
        currency: 'PLN',
    })
}

test('calculates item amounts and invoice totals with currency rounding', () => {
    const invoice = createInvoice()

    assert.deepEqual(invoice.items[0], {
        positionNumber: 1,
        itemName: 'Usługa',
        pkwiu: '01.11.11',
        quantity: 3,
        unit: 'szt',
        netPrice: 0.335,
        vatRate: 23,
        netValue: 1.01,
        vatAmount: 0.23,
        grossValue: 1.24,
    })
    assert.deepEqual(invoice.summary, {
        totalNet: 1.01,
        totalVat: 0.23,
        totalGross: 1.24,
        currency: 'PLN',
    })
})

test('rejects empty item lists and duplicate positions', () => {
    assert.throws(() => createInvoice([]), /at least one item/)
    assert.throws(() => createInvoice([
        {
            positionNumber: 1,
            itemName: 'A',
            pkwiu: '01',
            quantity: 1,
            unit: 'szt',
            netPrice: 1,
            vatRate: 23,
        },
        {
            positionNumber: 1,
            itemName: 'B',
            pkwiu: '02',
            quantity: 1,
            unit: 'szt',
            netPrice: 1,
            vatRate: 23,
        },
    ]), /Duplicate invoice item position/)
})

test('rejects invalid quantities and monetary amounts outside supported precision', () => {
    assert.throws(() => createInvoice([{
        positionNumber: 1,
        itemName: 'Usługa',
        pkwiu: '01.11.11',
        quantity: 0,
        unit: 'szt',
        netPrice: 1,
        vatRate: 23,
    }]), /invalid quantity/)
    assert.throws(() => createInvoice([{
        positionNumber: 1,
        itemName: 'Usługa',
        pkwiu: '01.11.11',
        quantity: 1,
        unit: 'szt',
        netPrice: Number.MAX_VALUE,
        vatRate: 23,
    }]), /supported precision/)
})

test('writeSpace moves upward for negative values without crossing the top margin', async () => {
    const document = new Document()
    const topMargin = document.doc.page.margins.top

    document.writeSpace(12)
    document.writeSpace(-5)
    assert.equal(document.doc.y, topMargin + 7)

    document.writeSpace(-100)
    assert.equal(document.doc.y, topMargin)
    await document.toBuffer()
})

test('renders invoice data to a PDF buffer', async () => {
    const buffer = await new InvoicePdfRenderer(createInvoice().toData()).render()

    assert.match(buffer.toString('ascii', 0, 5), /^%PDF-/)
    assert.match(buffer.toString('ascii'), /%%EOF/)
})
