import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../css/cashier.css";
import { getMenuItems, getCategories, type MenuItemData, type CategoryData } from "../api/menu";
import {
  getCashierMe,
  createCashierOrder,
  getCashierOrders,
  payCash,
  kharchaQrCreate,
  kharchaQrStatus,
  kharchaCardCreate,
  kharchaCardStatus,
  confirmPayment,
  markCollected,
  type CashierUser,
  type CashierOrder,
  type QrSession,
} from "../api/cashier";
import { isLoggedIn, logout } from "../api/auth";

interface TicketLine {
  item: MenuItemData;
  qty: number;
}

type Tab = "sale" | "queue";
type PayMethod = "cash" | "kharcha_qr" | "kharcha_card";

const rs = (n: number) => `Rs. ${Number(n).toLocaleString("en-IN")}`;

// Friendly labels for the live card-session steps reported by Kharcha.
const CARD_STEP: Record<string, string> = {
  pending: "Connecting to the terminal…",
  selected: "Terminal ready — present the card…",
  awaiting_card: "Ask the customer to tap their Kharcha card…",
  awaiting_pin: "Customer entering their PIN…",
  paid: "Payment approved!",
};

const Cashier: React.FC = () => {
  const navigate = useNavigate();

  const [me, setMe] = useState<CashierUser | null>(null);
  const [tab, setTab] = useState<Tab>("sale");

  // Menu
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [cats, setCats] = useState<CategoryData[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [menuLoading, setMenuLoading] = useState(true);

  // Ticket
  const [ticket, setTicket] = useState<TicketLine[]>([]);
  const [orderType, setOrderType] = useState<"dine_in" | "pickup">("dine_in");
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [creating, setCreating] = useState(false);

  // Queue
  const [activeOrders, setActiveOrders] = useState<CashierOrder[]>([]);
  const [pastOrders, setPastOrders] = useState<CashierOrder[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);

  // Payment modal
  const [payOrder, setPayOrder] = useState<CashierOrder | null>(null);
  const [payMethod, setPayMethod] = useState<PayMethod>("cash");
  const [tendered, setTendered] = useState("");
  const [qr, setQr] = useState<QrSession | null>(null);
  const [cardSession, setCardSession] = useState<{ session_id: string } | null>(null);
  const [cardStatus, setCardStatus] = useState<string>("pending");
  const [payBusy, setPayBusy] = useState(false);
  const [payMsg, setPayMsg] = useState("");
  const [paidInfo, setPaidInfo] = useState<{ change?: number } | null>(null);

  // ── Auth guard ─────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn("cashier")) {
      navigate("/cashier-login");
      return;
    }
    getCashierMe()
      .then(setMe)
      .catch(() => {
        logout("/cashier-login");
      });
  }, [navigate]);

  // ── Load menu ──────────────────────────────────────────────
  useEffect(() => {
    setMenuLoading(true);
    Promise.all([getMenuItems({ sort: "rating" }), getCategories()])
      .then(([mi, c]) => {
        setItems(mi);
        setCats(c);
      })
      .catch(() => {})
      .finally(() => setMenuLoading(false));
  }, []);

  const loadQueue = useCallback(() => {
    setQueueLoading(true);
    getCashierOrders()
      .then((r) => {
        setActiveOrders(r.active);
        setPastOrders(r.past);
      })
      .catch(() => {})
      .finally(() => setQueueLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "queue") loadQueue();
  }, [tab, loadQueue]);

  // ── Ticket helpers ─────────────────────────────────────────
  const addToTicket = (item: MenuItemData) => {
    setTicket((prev) => {
      const found = prev.find((l) => l.item.id === item.id);
      if (found) return prev.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { item, qty: 1 }];
    });
  };
  const changeQty = (id: number, delta: number) => {
    setTicket((prev) =>
      prev
        .map((l) => (l.item.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  };
  const clearTicket = () => {
    setTicket([]);
    setCustName("");
    setCustPhone("");
  };

  const ticketTotal = useMemo(
    () => ticket.reduce((s, l) => s + Number(l.item.price) * l.qty, 0),
    [ticket]
  );
  const ticketCount = useMemo(() => ticket.reduce((s, l) => s + l.qty, 0), [ticket]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (activeCat !== "all") {
      list = list.filter(
        (i) => (i.category_name || i.category)?.toLowerCase() === activeCat.toLowerCase()
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    return list;
  }, [items, activeCat, search]);

  // ── Charge (create order → open payment) ───────────────────
  const startCharge = async () => {
    if (ticket.length === 0) return;
    setCreating(true);
    try {
      const order = await createCashierOrder({
        items: ticket.map((l) => ({ menu_item_id: l.item.id, quantity: l.qty })),
        order_type: orderType,
        customer_name: custName.trim() || undefined,
        customer_phone: custPhone.trim() || undefined,
      });
      openPayment(order);
      clearTicket();
    } catch (e: any) {
      alert(e.response?.data?.error || "Could not create order.");
    } finally {
      setCreating(false);
    }
  };

  // ── Payment modal ──────────────────────────────────────────
  const openPayment = (order: CashierOrder) => {
    setPayOrder(order);
    setPayMethod("cash");
    setTendered("");
    setQr(null);
    setCardSession(null);
    setCardStatus("pending");
    setPayMsg("");
    setPaidInfo(null);
  };
  const closePayment = () => {
    setPayOrder(null);
    setQr(null);
    if (tab === "queue") loadQueue();
  };

  const doCash = async () => {
    if (!payOrder) return;
    const amt = parseFloat(tendered);
    if (isNaN(amt) || amt < Number(payOrder.total)) {
      setPayMsg("Amount tendered must be at least the total due.");
      return;
    }
    setPayBusy(true);
    setPayMsg("");
    try {
      const r = await payCash(payOrder.id, amt);
      setPaidInfo({ change: r.change_due });
    } catch (e: any) {
      setPayMsg(
        e.code === "ECONNABORTED"
          ? "The request timed out. Check the backend is running, then try again."
          : e.response?.data?.error || "Cash payment failed."
      );
    } finally {
      setPayBusy(false);
    }
  };

  // QR — open a Kharcha dynamic-QR session the customer scans in the app.
  const startQr = async () => {
    if (!payOrder) return;
    setPayBusy(true);
    setPayMsg("");
    try {
      const session = await kharchaQrCreate(payOrder.id);
      setQr(session);
    } catch (e: any) {
      setPayMsg(
        e.code === "ECONNABORTED"
          ? "Kharcha timed out. Please try again."
          : e.response?.data?.error || "Could not generate the QR code."
      );
    } finally {
      setPayBusy(false);
    }
  };

  // Card — open a Kharcha POS payment session; the customer taps their card
  // and enters their PIN on the terminal, and we poll until it settles.
  const startCard = async () => {
    if (!payOrder) return;
    setPayBusy(true);
    setPayMsg("");
    try {
      const s = await kharchaCardCreate(payOrder.id);
      setCardStatus(s.status || "pending");
      setCardSession({ session_id: s.session_id });
    } catch (e: any) {
      setPayMsg(
        e.code === "ECONNABORTED"
          ? "Kharcha timed out. Please try again."
          : e.response?.data?.error || "Could not start the card session."
      );
    } finally {
      setPayBusy(false);
    }
  };

  // Manual fallback — cashier confirms the payment landed.
  const confirmManually = async () => {
    if (!payOrder) return;
    setPayBusy(true);
    setPayMsg("");
    try {
      await confirmPayment(payOrder.id, payMethod);
      setPaidInfo({});
    } catch (e: any) {
      setPayMsg(e.response?.data?.error || "Could not confirm payment.");
    } finally {
      setPayBusy(false);
    }
  };

  // Poll the QR session status while it is live and unpaid.
  useEffect(() => {
    if (!payOrder || !qr || paidInfo) return;
    let stopped = false;
    const id = setInterval(async () => {
      try {
        const r = await kharchaQrStatus(payOrder.id);
        if (!stopped && r.paid) {
          setPaidInfo({});
          clearInterval(id);
        }
      } catch { /* transient — keep polling */ }
    }, 2500);
    return () => { stopped = true; clearInterval(id); };
  }, [payOrder, qr, paidInfo]);

  // Poll the card payment session while it is live and unpaid.
  useEffect(() => {
    if (!payOrder || !cardSession || paidInfo) return;
    let stopped = false;
    const id = setInterval(async () => {
      try {
        const r = await kharchaCardStatus(payOrder.id);
        if (stopped) return;
        setCardStatus(r.status);
        if (r.paid) {
          setPaidInfo({});
          clearInterval(id);
        } else if (r.failed) {
          setPayMsg(r.status === "expired" ? "The card session expired. Start again." : "The card session was cancelled.");
          setCardSession(null);
          clearInterval(id);
        }
      } catch { /* transient — keep polling */ }
    }, 2500);
    return () => { stopped = true; clearInterval(id); };
  }, [payOrder, cardSession, paidInfo]);

  const handleCollect = async (order: CashierOrder) => {
    try {
      await markCollected(order.id);
      loadQueue();
    } catch (e: any) {
      alert(e.response?.data?.error || "Could not update order.");
    }
  };

  const qrImg = (payload: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(payload)}`;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="cashier-app">
      {/* Top bar */}
      <header className="cx-topbar">
        <div className="cx-brand">
          <span className="material-symbols-rounded">point_of_sale</span>
          <div>
            <strong>{me?.store_name || "KTM Bites"}</strong>
            <span>{me?.counter_name || "Counter"} · {me?.full_name || "Cashier"}</span>
          </div>
        </div>
        <div className="cx-tabs">
          <button className={tab === "sale" ? "active" : ""} onClick={() => setTab("sale")}>
            <span className="material-symbols-rounded">add_shopping_cart</span> New Sale
          </button>
          <button className={tab === "queue" ? "active" : ""} onClick={() => setTab("queue")}>
            <span className="material-symbols-rounded">receipt_long</span> Order Queue
          </button>
        </div>
        <button className="cx-logout" onClick={() => logout("/cashier-login")}>
          <span className="material-symbols-rounded">logout</span>
        </button>
      </header>

      {tab === "sale" ? (
        <div className="cx-sale">
          {/* Menu side */}
          <section className="cx-menu">
            <div className="cx-menu-head">
              <div className="cx-search">
                <span className="material-symbols-rounded">search</span>
                <input
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="cx-cats">
                <button className={activeCat === "all" ? "active" : ""} onClick={() => setActiveCat("all")}>
                  All
                </button>
                {cats.map((c) => (
                  <button
                    key={c.id}
                    className={activeCat === c.name ? "active" : ""}
                    onClick={() => setActiveCat(c.name)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {menuLoading ? (
              <div className="cx-empty">Loading menu...</div>
            ) : (
              <div className="cx-item-grid">
                {filteredItems.map((it) => (
                  <button key={it.id} className="cx-item" onClick={() => addToTicket(it)}>
                    <div className="cx-item-img" style={{ backgroundImage: `url(${it.image})` }} />
                    <div className="cx-item-name">{it.name}</div>
                    <div className="cx-item-price">{rs(it.price)}</div>
                  </button>
                ))}
                {filteredItems.length === 0 && <div className="cx-empty">No items found.</div>}
              </div>
            )}
          </section>

          {/* Ticket side */}
          <aside className="cx-ticket">
            <div className="cx-ticket-head">
              <h3>Current Order</h3>
              {ticket.length > 0 && (
                <button className="cx-clear" onClick={clearTicket}>Clear</button>
              )}
            </div>

            <div className="cx-type-toggle">
              <button className={orderType === "dine_in" ? "active" : ""} onClick={() => setOrderType("dine_in")}>
                <span className="material-symbols-rounded">storefront</span> Dine In
              </button>
              <button className={orderType === "pickup" ? "active" : ""} onClick={() => setOrderType("pickup")}>
                <span className="material-symbols-rounded">takeout_dining</span> Takeaway
              </button>
            </div>

            <div className="cx-lines">
              {ticket.length === 0 ? (
                <div className="cx-ticket-empty">
                  <span className="material-symbols-rounded">shopping_bag</span>
                  Tap items to build the order
                </div>
              ) : (
                ticket.map((l) => (
                  <div className="cx-line" key={l.item.id}>
                    <div className="cx-line-info">
                      <span className="cx-line-name">{l.item.name}</span>
                      <span className="cx-line-price">{rs(Number(l.item.price) * l.qty)}</span>
                    </div>
                    <div className="cx-qty">
                      <button onClick={() => changeQty(l.item.id, -1)}>
                        <span className="material-symbols-rounded">remove</span>
                      </button>
                      <span>{l.qty}</span>
                      <button onClick={() => changeQty(l.item.id, 1)}>
                        <span className="material-symbols-rounded">add</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="cx-cust">
              <input placeholder="Customer name (optional)" value={custName} onChange={(e) => setCustName(e.target.value)} />
              <input placeholder="Phone (optional)" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} />
            </div>

            <div className="cx-ticket-foot">
              <div className="cx-total-row">
                <span>Total ({ticketCount})</span>
                <strong>{rs(ticketTotal)}</strong>
              </div>
              <button className="cx-charge" disabled={ticket.length === 0 || creating} onClick={startCharge}>
                <span className="material-symbols-rounded">{creating ? "autorenew" : "point_of_sale"}</span>
                {creating ? "Creating..." : `Charge ${rs(ticketTotal)}`}
              </button>
            </div>
          </aside>
        </div>
      ) : (
        <div className="cx-queue">
          <div className="cx-queue-head">
            <h3>Takeaway &amp; Counter Orders</h3>
            <button className="cx-refresh" onClick={loadQueue}>
              <span className="material-symbols-rounded">refresh</span> Refresh
            </button>
          </div>

          {queueLoading ? (
            <div className="cx-empty">Loading orders...</div>
          ) : (
            <>
              {/* Remaining — needs action, always on top */}
              <QueueGroup
                title="Needs attention"
                subtitle="Unpaid or waiting to be handed over"
                accent="active"
                orders={activeOrders}
                emptyLabel="All caught up — no orders waiting."
                onPay={openPayment}
                onCollect={handleCollect}
              />

              {/* Gap, then past / collected orders below */}
              <div className="cx-queue-divider">
                <span>Past orders</span>
              </div>

              <QueueGroup
                title="Collected &amp; closed"
                subtitle="Recently handed over or cancelled"
                accent="past"
                orders={pastOrders}
                emptyLabel="No past orders yet today."
                onPay={openPayment}
                onCollect={handleCollect}
              />
            </>
          )}
        </div>
      )}

      {/* Payment modal */}
      {payOrder && (
        <div className="cx-modal-overlay" onClick={paidInfo ? closePayment : undefined}>
          <div className="cx-modal" onClick={(e) => e.stopPropagation()}>
            {paidInfo ? (
              <div className="cx-paid">
                <div className="cx-paid-check"><span className="material-symbols-rounded">check_circle</span></div>
                <h2>Payment received</h2>
                <p>Order {payOrder.order_id} · {rs(payOrder.total)}</p>
                {paidInfo.change !== undefined && paidInfo.change > 0 && (
                  <div className="cx-change">Change due: <strong>{rs(paidInfo.change)}</strong></div>
                )}
                <button className="cx-done" onClick={closePayment}>Done</button>
              </div>
            ) : (
              <>
                <div className="cx-modal-head">
                  <div>
                    <h2>Take payment</h2>
                    <p>Order {payOrder.order_id} · <strong>{rs(payOrder.total)}</strong></p>
                  </div>
                  <button className="cx-x" onClick={closePayment}>
                    <span className="material-symbols-rounded">close</span>
                  </button>
                </div>

                <div className="cx-method-tabs">
                  <button className={payMethod === "cash" ? "active" : ""} onClick={() => { setPayMethod("cash"); setPayMsg(""); setQr(null); setCardSession(null); }}>
                    <span className="material-symbols-rounded">payments</span> Cash
                  </button>
                  <button className={payMethod === "kharcha_qr" ? "active" : ""} onClick={() => { setPayMethod("kharcha_qr"); setPayMsg(""); setQr(null); setCardSession(null); }}>
                    <span className="material-symbols-rounded">qr_code_2</span> Kharcha QR
                  </button>
                  <button className={payMethod === "kharcha_card" ? "active" : ""} onClick={() => { setPayMethod("kharcha_card"); setPayMsg(""); setQr(null); setCardSession(null); }}>
                    <span className="material-symbols-rounded">credit_card</span> Card
                  </button>
                </div>

                <div className="cx-method-body">
                  {payMethod === "cash" && (
                    <div className="cx-cash">
                      <label>Amount tendered</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder={String(payOrder.total)}
                        value={tendered}
                        onChange={(e) => setTendered(e.target.value)}
                        autoFocus
                      />
                      {tendered && parseFloat(tendered) >= Number(payOrder.total) && (
                        <div className="cx-change-preview">
                          Change: <strong>{rs(parseFloat(tendered) - Number(payOrder.total))}</strong>
                        </div>
                      )}
                      <button className="cx-pay-btn" disabled={payBusy} onClick={doCash}>
                        {payBusy ? "Recording…" : "Confirm cash payment"}
                      </button>
                    </div>
                  )}

                  {payMethod === "kharcha_qr" && (
                    <div className="cx-qr">
                      {!qr ? (
                        <button className="cx-pay-btn" disabled={payBusy} onClick={startQr}>
                          {payBusy ? "Generating…" : "Generate QR code"}
                        </button>
                      ) : (
                        <>
                          <img className="cx-qr-img" src={qrImg(qr.qr_payload)} alt="Kharcha QR" />
                          <p className="cx-qr-hint">Ask the customer to scan this in the Kharcha app.</p>
                          <div className="cx-waiting">
                            <span className="cx-spinner" /> Waiting for payment…
                          </div>
                          <button className="cx-manual" disabled={payBusy} onClick={confirmManually}>
                            Payment received? Confirm manually
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {payMethod === "kharcha_card" && (
                    <div className="cx-card">
                      {!cardSession ? (
                        <>
                          <p className="cx-card-lead">
                            Open a card session, then have the customer tap their Kharcha
                            card and enter their PIN on the POS terminal to pay {rs(payOrder.total)}.
                          </p>
                          <button className="cx-pay-btn" disabled={payBusy} onClick={startCard}>
                            {payBusy ? "Opening session…" : "Start card payment"}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="cx-tap">
                            <span className="material-symbols-rounded">contactless</span>
                          </div>
                          <p className="cx-qr-hint">{CARD_STEP[cardStatus] || "Waiting for the terminal…"}</p>
                          <div className="cx-waiting">
                            <span className="cx-spinner" /> Waiting for the payment to go through…
                          </div>
                          <button className="cx-manual" disabled={payBusy} onClick={confirmManually}>
                            Paid on the terminal? Confirm manually
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {payMsg && <div className="cx-pay-error">{payMsg}</div>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Queue group sub-component ─────────────────────────────────
const PAY_LABEL: Record<string, string> = {
  cash: "Cash",
  kharcha_qr: "Kharcha QR",
  kharcha_card: "Kharcha Card",
  khalti: "Khalti",
  kharcha: "Kharcha",
};
const TYPE_LABEL: Record<string, string> = {
  dine_in: "Dine in",
  pickup: "Takeaway",
  delivery: "Delivery",
};
const STATUS_LABEL: Record<string, string> = {
  placed: "Placed",
  preparing: "Preparing",
  ready_for_pickup: "Ready",
  on_way: "On the way",
  delivered: "Collected",
  cancelled: "Cancelled",
  pending_payment: "Awaiting payment",
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const QueueGroup: React.FC<{
  title: string;
  subtitle?: string;
  accent?: "active" | "past";
  emptyLabel?: string;
  orders: CashierOrder[];
  onPay: (o: CashierOrder) => void;
  onCollect: (o: CashierOrder) => void;
}> = ({ title, subtitle, accent = "active", emptyLabel, orders, onPay, onCollect }) => (
  <div className={`cx-qgroup ${accent}`}>
    <div className="cx-qgroup-head">
      <h4>{title} <span>{orders.length}</span></h4>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {orders.length === 0 ? (
      <div className="cx-empty small">{emptyLabel || "Nothing here right now."}</div>
    ) : (
      <div className="cx-order-list">
        {orders.map((o) => {
          const paid = o.payment_status === "completed";
          const cancelled = o.status === "cancelled";
          const collected = o.status === "delivered";
          const ready = o.status === "ready_for_pickup";
          return (
            <div className={`cx-order ${collected ? "is-done" : ""} ${cancelled ? "is-cancelled" : ""}`} key={o.id}>
              <div className="cx-order-top">
                <span className="cx-order-id">{o.order_id}</span>
                <span className="cx-order-time">{fmtTime(o.created_at)}</span>
              </div>

              <div className="cx-order-tags">
                <span className="cx-tag type">{TYPE_LABEL[o.order_type] || o.order_type}</span>
                <span className="cx-tag status">{STATUS_LABEL[o.status] || o.status_display}</span>
                <span className={`cx-tag ${paid ? "paid" : "due"}`}>
                  {paid ? PAY_LABEL[o.payment_method] || "Paid" : "Unpaid"}
                </span>
              </div>

              <div className="cx-order-items">
                {o.items.map((it) => `${it.quantity}× ${it.name}`).join(", ")}
              </div>

              <div className="cx-order-bottom">
                <div className="cx-order-meta">
                  <strong>{`Rs. ${Number(o.total).toLocaleString("en-IN")}`}</strong>
                  <span>{o.full_name || "Walk-in"}</span>
                </div>
                {cancelled ? (
                  <span className="cx-collected cancelled">Cancelled</span>
                ) : !paid ? (
                  <button className="cx-take-pay" onClick={() => onPay(o)}>
                    <span className="material-symbols-rounded">point_of_sale</span> Take payment
                  </button>
                ) : collected ? (
                  <span className="cx-collected">
                    <span className="material-symbols-rounded">check</span> Collected
                  </span>
                ) : ready ? (
                  <button className="cx-collect" onClick={() => onCollect(o)}>
                    <span className="material-symbols-rounded">shopping_bag</span> Hand over
                  </button>
                ) : o.status === "preparing" ? (
                  <span className="cx-preparing">
                    <span className="material-symbols-rounded">skillet</span> Kitchen preparing…
                  </span>
                ) : (
                  <span className="cx-placed">
                    <span className="material-symbols-rounded">receipt_long</span> Order placed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

export default Cashier;
