import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import Invoice from './invoice.ts'
import InvoicePdfRenderer from './invoice-pdf.ts'

export function createExampleInvoice(): Invoice {
    return new Invoice({
        details: {
            number: 'FV/2026/11/001',
            issueDate: '2026-11-08',
            saleDate: '2026-11-08',
            issuePlace: 'Warszawa',
        },
        seller: {
            name: 'Sprzedawca Sp. z o.o.',
            nip: '123-456-78-90',
            address: 'ul. Sprzedawcy 1, 00-001 Warszawa',
        },
        buyer: {
            name: 'Nabywca Sp. z o.o.',
            nip: '423-456-48-40',
            address: 'ul. Nabywcy 1, 00-002 Warszawa',
        },
        items: [
            {
                positionNumber: 1,
                itemName: 'Produkt A',
                pkwiu: '01.11.11',
                quantity: 2,
                unit: 'szt',
                netPrice: 100,
                vatRate: 23,
            },
            {
                positionNumber: 2,
                itemName: 'Produkt B',
                pkwiu: '01.11.12',
                quantity: 4,
                unit: 'szt',
                netPrice: 122,
                vatRate: 23,
            },
        ],
        payment: {
            method: 'Przelew',
            dueDate: '2026-11-15',
            status: 'Oczekująca',
        },
        currency: 'PLN',
    })
}

export async function run(outputPath = './invoice.pdf'): Promise<void> {
    const invoice = createExampleInvoice()
    const pdf = await new InvoicePdfRenderer(invoice.toData()).render()
    await writeFile(outputPath, pdf)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    await run(process.argv[2])
}
