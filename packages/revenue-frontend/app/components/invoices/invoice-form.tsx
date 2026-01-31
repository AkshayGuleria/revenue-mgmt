/**
 * Invoice Form Component
 * Create and edit invoices with line items
 */

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useAccounts } from "~/lib/api/hooks/use-accounts";
import { useContracts } from "~/lib/api/hooks/use-contracts";
import type {
  Invoice,
  CreateInvoiceDto,
  UpdateInvoiceDto,
} from "~/types/models";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  productId: z.string().optional(),
});

const invoiceFormSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  contractId: z.string().optional(),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled", "void"]),
  currency: z.string().default("USD"),
  notes: z.string().optional(),
  billingAddress: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one line item is required"),
  // Invoice-level tax and discount
  tax: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (data: CreateInvoiceDto | UpdateInvoiceDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function InvoiceForm({
  invoice,
  onSubmit,
  onCancel,
  isLoading,
}: InvoiceFormProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    invoice?.accountId || ""
  );

  const { data: accountsData } = useAccounts({ "limit[eq]": 100 });
  const { data: contractsData } = useContracts(
    selectedAccountId
      ? { "accountId[eq]": selectedAccountId, "limit[eq]": 100 }
      : undefined
  );

  const accounts = Array.isArray(accountsData?.data) ? accountsData.data : [];
  const contracts = Array.isArray(contractsData?.data)
    ? contractsData.data
    : [];

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: invoice
      ? {
          accountId: invoice.accountId,
          contractId: invoice.contractId || undefined,
          invoiceNumber: invoice.invoiceNumber,
          issueDate: new Date(invoice.issueDate).toISOString().split("T")[0],
          dueDate: new Date(invoice.dueDate).toISOString().split("T")[0],
          status: invoice.status,
          currency: invoice.currency,
          notes: invoice.notes || "",
          billingAddress: invoice.billingAddress || "",
          items: invoice.items || [],
          tax: invoice.tax || 0,
          discount: invoice.discount || 0,
        }
      : {
          accountId: "",
          contractId: undefined,
          invoiceNumber: `INV-${Date.now()}`,
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          status: "draft",
          currency: "USD",
          notes: "",
          billingAddress: "",
          items: [
            {
              description: "",
              quantity: 1,
              unitPrice: 0,
            },
          ],
          tax: 0,
          discount: 0,
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "accountId") {
        setSelectedAccountId(value.accountId || "");
        form.setValue("contractId", undefined);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = (data: InvoiceFormData) => {
    // Calculate totals and add required amount field for each item
    const items = data.items.map((item) => {
      const amount = item.quantity * item.unitPrice; // Required by backend
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount, // Backend requires this field
        productId: item.productId,
        metadata: item.metadata,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const total = subtotal - data.discount + data.tax;

    const invoiceData = {
      invoiceNumber: data.invoiceNumber,
      accountId: data.accountId,
      contractId: data.contractId || undefined,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      status: data.status,
      currency: data.currency,
      notes: data.notes,
      billingAddress: data.billingAddress,
      items,
      subtotal,
      tax: data.tax,
      discount: data.discount,
      total,
      billingType: "one_time" as const,
      consolidated: false,
    };

    onSubmit(invoiceData);
  };

  const addLineItem = () => {
    append({
      description: "",
      quantity: 1,
      unitPrice: 0,
    });
  };

  const calculateLineTotal = (index: number) => {
    const item = form.watch(`items.${index}`);
    return Number(item.quantity) * Number(item.unitPrice);
  };

  const calculateTotals = () => {
    const items = form.watch("items");
    const tax = Number(form.watch("tax")) || 0;
    const discount = Number(form.watch("discount")) || 0;

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0
    );
    const total = subtotal - discount + tax;

    return { subtotal, discount, tax, total };
  };

  const totals = calculateTotals();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Invoice Header */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Invoice Information</h3>
          <div className="grid grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contractId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                    defaultValue={field.value || "none"}
                    disabled={!selectedAccountId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contract" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {contracts.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.contractName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="void">Void</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-6">
            <FormField
              control={form.control}
              name="billingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Address</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* Line Items */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Line Items</h3>
            <Button type="button" onClick={addLineItem} size="sm" className="hover:scale-105 active:scale-95 transition-transform duration-200">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          <div className="space-y-6">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 border rounded-lg bg-gray-50 space-y-6"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="col-span-3">
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} min="1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            min="0"
                            step="0.01"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-end">
                    <div className="text-sm">
                      <span className="text-gray-600">Amount: </span>
                      <span className="font-semibold">
                        ${calculateLineTotal(index).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Invoice Totals */}
        <Card className="p-6">
          <div className="max-w-md ml-auto space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
            </div>

            {totals.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="text-green-600 font-medium">
                  -${totals.discount.toFixed(2)}
                </span>
              </div>
            )}

            {totals.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">${totals.tax.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t pt-3 flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="hover:scale-105 active:scale-95 transition-transform duration-200">
            {isLoading ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
