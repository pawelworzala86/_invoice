import { Invoice } from './invoice.ts'
import fs from 'fs'


(async()=>{

    const invoice = new Invoice()

    invoice.setDetails({
        number: "FV/2026/11/001",
        issueDate: "2026-11-08",
        saleDate: "2026-11-08",
        issuePlace: "Warszawa",
    })
    invoice.setSeller({
        name: "Sprzedawca Sp. z o.o.",
        nip: "123-456-78-90",
        address: "ul. Sprzedawcy 1, 00-001 Warszawa"
    })
    invoice.setBuyer({
        name: "Nabywca Sp. z o.o.",
        nip: "423-456-48-40",
        address: "ul. Nabywcy 1, 00-002 Warszawa"
    })
    invoice.addItem({
        positionNumber: 1,
        itemName: "Produkt A",
        pkwiu: "01.11.11",
        quantity: 2,
        unit: "szt",
        netPrice: 100,
        netValue: 200,
        vatRate: 23,
        vatAmount: 46,
        grossValue: 246
    })
    invoice.addItem({
        positionNumber: 1,
        itemName: "Produkt B",
        pkwiu: "01.11.12",
        quantity: 4,
        unit: "szt",
        netPrice: 122,
        netValue: 488,
        vatRate: 23,
        vatAmount: 112.24,
        grossValue: 600.24
    })
    invoice.setSummary({
        totalNet: 688,
        totalVat: 158.24,
        totalGross: 846.24,
        currency: "PLN"
    })
    invoice.setPayment({
        method: "Przelew",
        dueDate: "2026-11-15",
        status: "Oczekująca"
    })

    const buffer = await invoice.make()

    fs.writeFileSync('./invoice.pdf', buffer)

})()