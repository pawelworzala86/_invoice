import PDFDocument from 'pdfkit'

export type TextAlignment = 'left' | 'right' | 'center' | 'justify'
export type TextValue = string | number
export type BorderColor = string | false | null | undefined

export interface LineConfig {
    font?: string
    fontSize?: number
    wrapperWidth?: number
    align?: TextAlignment
}

export interface BorderedLineConfig extends LineConfig {
    textColor?: string
    border?: boolean
    borderColor?: BorderColor
    borderColors?: BorderColor[]
    borderWidth?: number
    padding?: number
    paddingTop?: number
    paddingBottom?: number
    paddingLeft?: number
    paddingRight?: number
    lineGap?: number
    height?: number
    alignBottom?: boolean
    rowGap?: number
}

export class Document {
    readonly doc: InstanceType<typeof PDFDocument>
    readonly margin: number
    readonly wrapperWidth: number
    readonly boldFont = './fonts/Open_Sans/static/OpenSans-Bold.ttf'
    readonly headerFont = './fonts/Open_Sans/static/OpenSans-SemiBold.ttf'
    readonly textFont = './fonts/Open_Sans/static/OpenSans-Regular.ttf'
    readonly grayTextColor = '#555'
    readonly fontH1 = 32
    readonly fontDefault = 9.15
    readonly lineGap = 1.28

    private readonly buffers: Buffer[] = []
    private readonly bufferPromise: Promise<Buffer>

    constructor() {
        this.margin = 25
        this.wrapperWidth = 595 - this.margin * 2
        this.doc = new PDFDocument({
            size: 'A4',
            margin: this.margin,
        })

        this.doc.on('data', (chunk: Buffer) => this.buffers.push(chunk))
        this.bufferPromise = new Promise((resolve, reject) => {
            this.doc.on('end', () => resolve(Buffer.concat(this.buffers)))
            this.doc.on('error', reject)
        })
    }

    async toBuffer(): Promise<Buffer> {
        this.doc.end()
        return this.bufferPromise
    }

    writeLine(text: string, config: LineConfig = {}): void {
        this.doc.font(config.font ?? this.textFont)
        this.doc.fillColor(this.grayTextColor)
        this.doc.fontSize(config.fontSize ?? this.fontDefault)
        this.doc.text(text.trim(), {
            width: config.wrapperWidth ?? this.wrapperWidth,
            align: config.align ?? 'left',
            lineGap: this.lineGap,
        })
    }

    writeBorderedLine(
        widths: readonly number[],
        aligns: TextAlignment | readonly TextAlignment[],
        texts: readonly TextValue[],
        config: BorderedLineConfig = {},
    ): void {
        this.validateRow(widths, aligns, texts, config)

        const { doc } = this
        doc.font(config.font ?? this.textFont)
        doc.fontSize(config.fontSize ?? this.fontDefault)
        doc.fillColor(config.textColor ?? this.grayTextColor)

        const padding = config.padding ?? 6
        const paddingTop = config.paddingTop ?? padding
        const paddingBottom = config.paddingBottom ?? padding
        const paddingLeft = config.paddingLeft ?? padding
        const paddingRight = config.paddingRight ?? padding
        const lineGap = config.lineGap ?? 2
        const columnWidths = this.resolveColumnWidths(widths, config.wrapperWidth ?? this.wrapperWidth)
        const rowHeight = this.measureRowHeight(
            columnWidths,
            texts,
            config.height ?? 0,
            paddingTop,
            paddingBottom,
            paddingLeft,
            paddingRight,
            lineGap,
        )

        this.ensureSpace(rowHeight)

        const startX = doc.x
        const startY = doc.y
        this.drawBorders(columnWidths, startX, startY, rowHeight, config)
        this.drawCells(
            columnWidths,
            aligns,
            texts,
            startX,
            startY,
            rowHeight,
            { paddingTop, paddingBottom, paddingLeft, paddingRight, lineGap },
            config,
        )

        doc.y = startY + rowHeight + (config.rowGap ?? 0)
    }

    writeSpace(spaceHeight: number): void {
        if (!Number.isFinite(spaceHeight)) {
            throw new RangeError('Space height must be a finite number')
        }

        if (spaceHeight < 0) {
            this.doc.y = Math.max(this.doc.page.margins.top, this.doc.y + spaceHeight)
            return
        }

        if (this.doc.y + spaceHeight > this.doc.page.height - this.doc.page.margins.bottom) {
            this.doc.addPage()
            this.doc.x = this.margin
        } else {
            this.doc.y += spaceHeight
        }
    }

    private validateRow(
        widths: readonly number[],
        aligns: TextAlignment | readonly TextAlignment[],
        texts: readonly TextValue[],
        config: BorderedLineConfig,
    ): void {
        if (widths.length === 0 || widths.length !== texts.length) {
            throw new RangeError('Each text cell must have a corresponding column width')
        }
        if (widths.some((width) => !Number.isFinite(width) || width <= 0)) {
            throw new RangeError('Column widths must be positive finite numbers')
        }
        if (Array.isArray(aligns) && aligns.length !== texts.length) {
            throw new RangeError('Each text cell must have a corresponding alignment')
        }
        for (const value of [
            config.height,
            config.padding,
            config.paddingTop,
            config.paddingBottom,
            config.paddingLeft,
            config.paddingRight,
            config.rowGap,
        ]) {
            if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
                throw new RangeError('Row dimensions must be non-negative finite numbers')
            }
        }
    }

    private resolveColumnWidths(widths: readonly number[], availableWidth: number): number[] {
        const totalWidth = widths.reduce((total, width) => total + width, 0)
        return widths.map((width) => totalWidth <= 100 ? (width / 100) * availableWidth : width)
    }

    private measureRowHeight(
        widths: readonly number[],
        texts: readonly TextValue[],
        minimumHeight: number,
        paddingTop: number,
        paddingBottom: number,
        paddingLeft: number,
        paddingRight: number,
        lineGap: number,
    ): number {
        return texts.reduce<number>((height, text, index) => {
            const textHeight = this.doc.heightOfString(String(text).trim(), {
                width: widths[index] - paddingLeft - paddingRight,
                lineGap,
            })
            return Math.max(height, textHeight + paddingTop + paddingBottom)
        }, minimumHeight)
    }

    private ensureSpace(rowHeight: number): void {
        if (this.doc.y + rowHeight > this.doc.page.height - this.doc.page.margins.bottom) {
            this.doc.addPage()
        }
    }

    private drawBorders(
        widths: readonly number[],
        x: number,
        y: number,
        height: number,
        config: BorderedLineConfig,
    ): void {
        if (config.border === false) {
            return
        }

        const colorSource = config.borderColors ?? config.borderColor
        this.doc.save()
        this.doc.lineWidth(config.borderWidth ?? 1)

        if (Array.isArray(colorSource)) {
            let currentX = x
            widths.forEach((width, index) => {
                const color = colorSource[index]
                if (color !== null && color !== false && color !== undefined) {
                    this.doc.strokeColor(color)
                    this.doc.rect(currentX, y, width, height).stroke()
                }
                currentX += width
            })
        } else {
            const color = colorSource ?? '#cccccc'
            if (color !== false && color !== null) {
                this.doc.strokeColor(color)
                this.doc.rect(x, y, widths.reduce((sum, width) => sum + width, 0), height).stroke()
            }
        }

        this.doc.restore()
    }

    private drawCells(
        widths: readonly number[],
        aligns: TextAlignment | readonly TextAlignment[],
        texts: readonly TextValue[],
        x: number,
        y: number,
        rowHeight: number,
        padding: {
            paddingTop: number
            paddingBottom: number
            paddingLeft: number
            paddingRight: number
            lineGap: number
        },
        config: BorderedLineConfig,
    ): void {
        let currentX = x
        texts.forEach((text, index) => {
            const textValue = String(text).trim()
            const width = widths[index] - padding.paddingLeft - padding.paddingRight
            const textHeight = this.doc.heightOfString(textValue, {
                width,
                lineGap: padding.lineGap,
            })
            const textY = config.alignBottom && textValue !== ''
                ? Math.max(y + padding.paddingTop, y + rowHeight - textHeight - padding.paddingBottom)
                : y + padding.paddingTop
            const align = Array.isArray(aligns)
                ? aligns[index] ?? config.align ?? 'left'
                : aligns ?? config.align ?? 'left'

            this.doc.text(textValue, currentX + padding.paddingLeft, textY, {
                width,
                align,
                lineGap: padding.lineGap,
            })
            currentX += widths[index]
        })
    }
}

export default Document
