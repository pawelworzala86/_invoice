# _invoice

## Generate an example invoice

```sh
npm run make -- invoice.pdf
```

The output path is optional; the default is `./invoice.pdf`. Importing
`sources/index.ts` does not generate a file. Build invoice data with `Invoice`
from `sources/invoice.ts` and render it with `InvoicePdfRenderer` from
`sources/invoice-pdf.ts`.

Item net values, VAT, gross values, and invoice totals are calculated by
`Invoice` and rounded to two decimal places. The renderer includes the invoice
dates, item positions, calculated amounts, totals, and payment details.

## Checks

```sh
npm test
npm run typecheck
```
