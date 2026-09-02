/**
 * Client-safe payment display data — deliberately separate from
 * src/lib/payments/, whose provider files import Node built-ins
 * (crypto) for signature verification and must never end up in the
 * browser bundle. This file only ever holds things that are fine to
 * show a customer.
 */
export const eftBankDetails = {
  accountName: "Clink & Co (Pty) Ltd",
  bank: "First National Bank",
  accountNumber: "62812345678",
  branchCode: "250655",
  accountType: "Business Cheque Account",
};
