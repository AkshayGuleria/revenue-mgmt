/**
 * Invoice Line Items Editor
 * Dynamic line items with add/remove functionality and real-time calculations
 *
 * @author frooti (Frontend Development)
 */

import { useFieldArray, useWatch, type Control } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { CurrencyDisplay } from "~/components/currency-display";

interface InvoiceItemFormData {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceFormData {
  items: InvoiceItemFormData[];
  [key: string]: any;
}

interface InvoiceItemsEditorProps {
  control: Control<InvoiceFormData>;
  errors?: any;
}

export function InvoiceItemsEditor({ control, errors }: InvoiceItemsEditorProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = useWatch({ control, name: "items" }) || [];

  // Calculate line item totals
  const lineItemTotals = items.map((item) => {
    const quantity = Number(item?.quantity) || 0;
    const unitPrice = Number(item?.unitPrice) || 0;
    return quantity * unitPrice;
  });

  // Calculate subtotal
  const subtotal = lineItemTotals.reduce((sum, total) => sum + total, 0);

  const addItem = () => {
    append({ description: "", quantity: 1, unitPrice: 0 });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      {/* Gradient header */}
      <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-600" />

      <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Invoice Line Items</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Line Items */}
        <div className="space-y-4">
          {fields.map((field, index) => {
            const itemTotal = lineItemTotals[index] || 0;
            const itemError = errors?.items?.[index];

            return (
              <div
                key={field.id}
                data-testid="line-item"
                className="grid grid-cols-12 gap-4 p-4 rounded-lg border-2 border-gray-100 bg-white hover:border-purple-200 hover:shadow-md transition-all duration-200"
              >
                {/* Row number */}
                <div className="col-span-12 md:col-span-1 flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {index + 1}
                  </div>
                </div>

                {/* Description */}
                <div className="col-span-12 md:col-span-4">
                  <Label htmlFor={`items.${index}.description`} className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Description
                  </Label>
                  <Input
                    {...control.register(`items.${index}.description`)}
                    id={`items.${index}.description`}
                    placeholder="Service or product description"
                    className={`mt-1 ${itemError?.description ? 'border-red-500' : ''}`}
                  />
                  {itemError?.description && (
                    <p className="text-xs text-red-600 mt-1">{itemError.description.message}</p>
                  )}
                </div>

                {/* Quantity */}
                <div className="col-span-6 md:col-span-2">
                  <Label htmlFor={`items.${index}.quantity`} className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Quantity
                  </Label>
                  <Input
                    {...control.register(`items.${index}.quantity`, { valueAsNumber: true })}
                    id={`items.${index}.quantity`}
                    type="number"
                    min="1"
                    step="1"
                    placeholder="1"
                    className={`mt-1 ${itemError?.quantity ? 'border-red-500' : ''}`}
                  />
                  {itemError?.quantity && (
                    <p className="text-xs text-red-600 mt-1">{itemError.quantity.message}</p>
                  )}
                </div>

                {/* Unit Price */}
                <div className="col-span-6 md:col-span-2">
                  <Label htmlFor={`items.${index}.unitPrice`} className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Unit Price
                  </Label>
                  <Input
                    {...control.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                    id={`items.${index}.unitPrice`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={`mt-1 ${itemError?.unitPrice ? 'border-red-500' : ''}`}
                  />
                  {itemError?.unitPrice && (
                    <p className="text-xs text-red-600 mt-1">{itemError.unitPrice.message}</p>
                  )}
                </div>

                {/* Total */}
                <div className="col-span-10 md:col-span-2">
                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Total
                  </Label>
                  <div className="mt-1 flex items-center h-10 px-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-md border-2 border-purple-200">
                    <span className="text-base font-bold text-purple-900">
                      <CurrencyDisplay amount={itemTotal} />
                    </span>
                  </div>
                </div>

                {/* Remove button */}
                <div className="col-span-2 md:col-span-1 flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={fields.length === 1}
                    className="h-10 w-10 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 transition-all duration-200"
                    title={fields.length === 1 ? "At least one item required" : "Remove item"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Line Item Button */}
        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          className="mt-4 w-full h-12 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <Plus className="mr-2 h-5 w-5" />
          <span className="font-semibold">Add Line Item</span>
        </Button>

        {/* Subtotal and Total Display */}
        <div className="mt-8 pt-6 border-t-2 border-gray-200">
          <div className="flex flex-col items-end space-y-3">
            {/* Subtotal */}
            <div className="flex items-center gap-6">
              <span className="text-lg font-semibold text-gray-700">Subtotal:</span>
              <div className="min-w-[150px] text-right">
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  <CurrencyDisplay amount={subtotal} />
                </span>
              </div>
            </div>

            {/* Total (same as subtotal for now) */}
            <div className="flex items-center gap-6 px-6 py-4 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
              <span className="text-xl font-bold text-white">Total:</span>
              <div className="min-w-[150px] text-right">
                <span className="text-3xl font-bold text-white tracking-tight">
                  <CurrencyDisplay amount={subtotal} />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Error */}
        {errors?.items?.root && (
          <p className="mt-4 text-sm text-red-600 font-medium">
            {errors.items.root.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
