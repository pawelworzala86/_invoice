import { Invoice, type InvoiceDetails } from './invoice.ts'
import fs from 'fs'


(async()=>{

    const data:InvoiceDetails = JSON.parse(fs.readFileSync('./invoice.json').toString()).invoice

    const invoice = new Invoice(data)

    const buffer = await invoice.make()

    fs.writeFileSync('./invoice.pdf', buffer)

})()