import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { formatMoney } from '#/lib/money'
import { formatItemQuantity } from '#/modules/workshop/work-orders/work-orders.schemas'
import type { PortalLine } from '../portal.schemas'

/**
 * Los servicios y repuestos de la orden o de un presupuesto, con su precio y
 * el total. En el celular la tabla se desplaza de lado.
 */
export function PortalLinesTable({
  lines,
  total,
}: {
  lines: PortalLine[]
  total: string
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead className="text-right">P. unitario</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line, index) => (
            <TableRow key={`${line.description}-${index}`}>
              <TableCell className="min-w-48 whitespace-normal">
                {line.description}
                <span className="block text-xs text-muted-foreground">
                  {line.type === 'SERVICE' ? 'Servicio' : 'Repuesto'}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatItemQuantity(line)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(line.unitPrice)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(line.subtotal)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="text-right font-medium">
              Total
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {formatMoney(total)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
