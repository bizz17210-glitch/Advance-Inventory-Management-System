import React, { useState, useEffect } from "react";
import type { NavPanel, ApiSupplier, SupplierPaymentMethod } from "./types";
import { fmt, ErrorBanner } from "./helpers";
import { suppliersAPI } from "../../services/api";

interface Props {
  onNav: (p: NavPanel) => void;
}

const RecordPaymentPanel: React.FC<Props> = ({ onNav }) => {
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [paymentMethod, setPaymentMethod] =
    useState<SupplierPaymentMethod>("Bank Transfer");
  const [bank, setBank] = useState("");
  const [ref, setRef] = useState("");
  const [paidBy, setPaidBy] = useState("Accounts");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    suppliersAPI
      .getAll({ limit: 100 })
      .then((r) => {
        const list: ApiSupplier[] = r.data.data?.suppliers || [];
        setSuppliers(list);
        if (list.length > 0) setSupplierId(list[0]._id);
      })
      .catch(() => null);
  }, []);

  const handleSubmit = async () => {
    if (!supplierId || !amount || !paymentDate) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await suppliersAPI.recordPayment(supplierId, {
        amount: Number(amount),
        paymentMethod,
        referenceNumber: ref || undefined,
        paymentDate,
        notes: notes || undefined,
        invoiceReference: invoiceRef || undefined,
      });
      setSuccess(true);
      setAmount("");
      setRef("");
      setNotes("");
      setInvoiceRef("");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to record payment.");
    } finally {
      setSaving(false);
    }
  };

  const selectedSupplier = suppliers.find((s) => s._id === supplierId);

  return (
    <>
      <div className="panel-heading">Record Supplier Payment</div>
      <div className="panel-desc">
        Log a payment made to a supplier. This will automatically update the
        outstanding balance for that supplier.
      </div>

      {error && <ErrorBanner message={error} />}
      {success && (
        <div className="alert-strip success" style={{ marginBottom: 14 }}>
          <i className="fa-solid fa-circle-check" />
          <div>Payment recorded successfully.</div>
          <button
            className="f-btn"
            style={{ marginLeft: "auto", fontSize: 9.5 }}
            onClick={() => onNav("sup-payments")}
          >
            View History
          </button>
        </div>
      )}

      <div className="detail-grid-2" style={{ alignItems: "start" }}>
        {/* Form */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i
                className="fa-solid fa-money-bill-transfer"
                style={{ color: "var(--green)" }}
              />{" "}
              Payment Details
            </div>
          </div>
          <div className="card-body">
            <div className="f-form-row single">
              <div className="f-form-group">
                <div className="f-form-label">Supplier *</div>
                <select
                  className="f-form-select"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="f-form-row">
              <div className="f-form-group">
                <div className="f-form-label">Amount (₨) *</div>
                <input
                  className="f-form-input"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="f-form-group">
                <div className="f-form-label">Payment Date *</div>
                <input
                  className="f-form-input"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>
            <div className="f-form-row">
              <div className="f-form-group">
                <div className="f-form-label">Payment Method</div>
                <select
                  className="f-form-select"
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as SupplierPaymentMethod)
                  }
                >
                  <option>Bank Transfer</option>
                  <option>Cash</option>
                  <option>Cheque</option>
                  <option>Online</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="f-form-group">
                <div className="f-form-label">Bank / Account</div>
                <input
                  className="f-form-input"
                  placeholder="e.g. HBL, UBL"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                />
              </div>
            </div>
            <div className="f-form-row">
              <div className="f-form-group">
                <div className="f-form-label">Transaction Reference</div>
                <input
                  className="f-form-input"
                  placeholder="Transfer ref. or cheque no."
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                />
              </div>
              <div className="f-form-group">
                <div className="f-form-label">Paid By</div>
                <select
                  className="f-form-select"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                >
                  <option>Accounts</option>
                  <option>Admin</option>
                  <option>Owner</option>
                </select>
              </div>
            </div>
            <div className="f-form-row single">
              <div className="f-form-group">
                <div className="f-form-label">Linked Invoice / Purchase</div>
                <input
                  className="f-form-input"
                  placeholder="Invoice number or PO reference"
                  value={invoiceRef}
                  onChange={(e) => setInvoiceRef(e.target.value)}
                />
              </div>
            </div>
            <div className="f-form-row single">
              <div className="f-form-group">
                <div className="f-form-label">Notes</div>
                <textarea
                  className="f-form-textarea"
                  placeholder="Optional payment notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <hr />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="f-btn primary"
                onClick={handleSubmit}
                disabled={saving}
              >
                <i className="fa-solid fa-check" />{" "}
                {saving ? "Saving…" : "Record Payment"}
              </button>
              <button className="f-btn" onClick={() => onNav("suppliers")}>
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {selectedSupplier && (
            <div className="summary-box" style={{ marginBottom: 14 }}>
              <div className="summary-box-title">Selected Supplier</div>
              <div className="summary-row">
                <span>Outstanding</span>
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      selectedSupplier.outstanding > 0
                        ? "var(--red)"
                        : "var(--green)",
                  }}
                >
                  {selectedSupplier.outstanding > 0
                    ? fmt(selectedSupplier.outstanding)
                    : "Cleared"}
                </span>
              </div>
              <div className="summary-row">
                <span>Total Paid</span>
                <span style={{ fontWeight: 600 }}>
                  {fmt(selectedSupplier.totalPaid)}
                </span>
              </div>
              <div className="summary-row">
                <span>Payment Terms</span>
                <span>{selectedSupplier.paymentTerms || "—"}</span>
              </div>
            </div>
          )}

          <div className="summary-box">
            <div className="summary-box-title">All Outstanding Balances</div>
            {suppliers.filter((s) => s.outstanding > 0).length === 0 ? (
              <div
                style={{
                  fontSize: 10.5,
                  color: "var(--text-muted)",
                  padding: "6px 0",
                }}
              >
                All suppliers cleared.
              </div>
            ) : (
              suppliers
                .filter((s) => s.outstanding > 0)
                .map((s) => (
                  <div className="summary-row" key={s._id}>
                    <span>{s.name}</span>
                    <span style={{ fontWeight: 600, color: "var(--red)" }}>
                      {fmt(s.outstanding)}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RecordPaymentPanel;
