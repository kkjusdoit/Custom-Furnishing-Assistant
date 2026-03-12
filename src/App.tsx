import { useMemo, useState, type CSSProperties } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Calculator,
  Boxes,
  Users,
  Bell,
  Plus,
  ArrowRight,
} from "lucide-react";

type ViewId = "dashboard" | "orders" | "quotes" | "inventory" | "customers";

type OrderStatus = "initial" | "measured" | "quoted" | "producing" | "installing" | "delivered";

type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  style: string;
  budget: string;
  createdAt: string;
};

type Order = {
  id: string;
  customerId: string;
  title: string;
  status: OrderStatus;
  total: number;
  statusUpdatedAt: string;
  note: string;
};

type Quote = {
  id: string;
  orderId: string | null;
  createdAt: string;
  pricingMode: "projection" | "expansion";
  area: number;
  materialCost: number;
  hardwareCost: number;
  addonCost: number;
  total: number;
};

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  safe: number;
};

type Reminder = {
  id: string;
  title: string;
  dueAt: string;
  orderId?: string;
};

const STATUS_FLOW: { id: OrderStatus; label: string; hint: string }[] = [
  { id: "initial", label: "初洽", hint: "确认需求" },
  { id: "measured", label: "已量尺", hint: "等待出图" },
  { id: "quoted", label: "已报价", hint: "客户确认" },
  { id: "producing", label: "生产中", hint: "20天交付" },
  { id: "installing", label: "待安装", hint: "安排上门" },
  { id: "delivered", label: "已交付", hint: "回访收尾" },
];

const CABINET_FACTORS: Record<string, number> = {
  wardrobe: 2.2,
  kitchen: 2.6,
  shoe: 1.9,
  custom: 2.3,
};

const createId = () => Math.random().toString(36).slice(2, 9);

const formatMoney = (value: number) =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const addDays = (value: string, days: number) => {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const daysLeft = (value: string) => {
  const diff = new Date(value).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "c1",
    name: "王总",
    phone: "138-8855-0231",
    address: "星河湾 2-1802",
    style: "现代简约",
    budget: "6-8万",
    createdAt: "2026-03-03T09:00:00.000Z",
  },
  {
    id: "c2",
    name: "刘女士",
    phone: "137-1122-2234",
    address: "绿地悦城 5-901",
    style: "奶油风",
    budget: "4-6万",
    createdAt: "2026-03-08T13:40:00.000Z",
  },
  {
    id: "c3",
    name: "陈工",
    phone: "159-3344-6677",
    address: "滨江壹号 9-1201",
    style: "原木+极简",
    budget: "8-10万",
    createdAt: "2026-02-21T10:30:00.000Z",
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: "o1",
    customerId: "c1",
    title: "主卧衣柜+书房",
    status: "producing",
    total: 45800,
    statusUpdatedAt: "2026-02-24T08:00:00.000Z",
    note: "封边条需要加急",
  },
  {
    id: "o2",
    customerId: "c2",
    title: "全屋定制",
    status: "quoted",
    total: 61200,
    statusUpdatedAt: "2026-03-06T10:00:00.000Z",
    note: "等待客户确认方案",
  },
  {
    id: "o3",
    customerId: "c3",
    title: "厨房+鞋柜",
    status: "measured",
    total: 28600,
    statusUpdatedAt: "2026-03-01T15:30:00.000Z",
    note: "量尺完成，准备出图",
  },
  {
    id: "o4",
    customerId: "c1",
    title: "阳台储物柜",
    status: "installing",
    total: 9800,
    statusUpdatedAt: "2026-03-10T09:15:00.000Z",
    note: "安排师傅上门",
  },
];

const INITIAL_QUOTES: Quote[] = [
  {
    id: "q1",
    orderId: "o2",
    createdAt: "2026-03-06T10:05:00.000Z",
    pricingMode: "expansion",
    area: 24.6,
    materialCost: 14200,
    hardwareCost: 8600,
    addonCost: 1800,
    total: 61200,
  },
  {
    id: "q2",
    orderId: "o1",
    createdAt: "2026-02-20T09:30:00.000Z",
    pricingMode: "projection",
    area: 18.2,
    materialCost: 9800,
    hardwareCost: 6200,
    addonCost: 1200,
    total: 45800,
  },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: "i1", name: "铰链 110度", unit: "个", stock: 186, safe: 80 },
  { id: "i2", name: "抽轨 450mm", unit: "副", stock: 62, safe: 40 },
  { id: "i3", name: "拉手 128mm", unit: "个", stock: 138, safe: 60 },
  { id: "i4", name: "封边条 1mm", unit: "卷", stock: 34, safe: 20 },
];

const INITIAL_REMINDERS: Reminder[] = [
  {
    id: "r1",
    title: "明天下午 2 点 星河湾量尺",
    dueAt: "2026-03-13T06:00:00.000Z",
  },
  {
    id: "r2",
    title: "刘女士确认效果图",
    dueAt: "2026-03-14T02:00:00.000Z",
  },
];

const NAV_ITEMS: { id: ViewId; label: string; icon: JSX.Element }[] = [
  { id: "dashboard", label: "概览", icon: <LayoutDashboard size={18} /> },
  { id: "orders", label: "订单流", icon: <ClipboardList size={18} /> },
  { id: "quotes", label: "报价器", icon: <Calculator size={18} /> },
  { id: "inventory", label: "库存", icon: <Boxes size={18} /> },
  { id: "customers", label: "客户", icon: <Users size={18} /> },
];

function App() {
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [manualReminders, setManualReminders] = useState<Reminder[]>(INITIAL_REMINDERS);

  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    address: "",
    style: "",
    budget: "",
  });

  const [orderForm, setOrderForm] = useState({
    customerId: customers[0]?.id ?? "",
    title: "",
    status: "initial" as OrderStatus,
    total: 0,
    note: "",
  });

  const [quoteForm, setQuoteForm] = useState({
    cabinetType: "wardrobe",
    length: 2400,
    height: 2600,
    width: 600,
    boardCount: 6,
    drawerCount: 2,
    pricingMode: "projection" as "projection" | "expansion",
    materialPrice: 580,
    hingePrice: 18,
    drawerPrice: 55,
    handlePrice: 12,
    addon: 200,
  });

  const [quoteOrderId, setQuoteOrderId] = useState<string>(orders[0]?.id ?? "");

  const [reminderForm, setReminderForm] = useState({
    title: "",
    dueInDays: 1,
  });

  const ordersByStatus = useMemo(
    () =>
      STATUS_FLOW.map((status) => ({
        ...status,
        orders: orders.filter((order) => order.status === status.id),
      })),
    [orders],
  );

  const autoReminders = useMemo(() => {
    return orders.flatMap((order) => {
      const customer = customers.find((item) => item.id === order.customerId);
      if (order.status === "producing") {
        return [
          {
            id: `auto-${order.id}-prod`,
            title: `${customer?.name ?? "客户"} 交货倒计时`,
            dueAt: addDays(order.statusUpdatedAt, 20),
            orderId: order.id,
          },
        ];
      }
      if (order.status === "installing") {
        return [
          {
            id: `auto-${order.id}-install`,
            title: `${customer?.name ?? "客户"} 安装窗口确认`,
            dueAt: addDays(order.statusUpdatedAt, 2),
            orderId: order.id,
          },
        ];
      }
      return [];
    });
  }, [orders, customers]);

  const reminders = useMemo(() => {
    return [...manualReminders, ...autoReminders].sort(
      (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
    );
  }, [manualReminders, autoReminders]);

  const stats = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyCustomers = customers.filter(
      (customer) => new Date(customer.createdAt) >= monthStart,
    ).length;
    const activeOrders = orders.filter((order) => order.status !== "delivered").length;
    const producingOrders = orders.filter(
      (order) => order.status === "producing" || order.status === "installing",
    ).length;
    const pipelineValue = orders.reduce((sum, order) => sum + order.total, 0);

    return {
      monthlyCustomers,
      activeOrders,
      producingOrders,
      pipelineValue,
    };
  }, [customers, orders]);

  const quotePreview = useMemo(() => {
    const projectionArea = (quoteForm.length * quoteForm.height) / 1_000_000;
    const shelfArea = (quoteForm.length * quoteForm.width) / 1_000_000 * quoteForm.boardCount;
    const expansionArea =
      projectionArea * (CABINET_FACTORS[quoteForm.cabinetType] ?? 2.2) + shelfArea;
    const areaUsed = quoteForm.pricingMode === "projection" ? projectionArea : expansionArea;

    const doorCount = Math.max(1, Math.round(quoteForm.length / 450));
    const hingeCount = doorCount * 2;
    const drawerRailCount = quoteForm.drawerCount * 2;
    const handleCount = doorCount + quoteForm.drawerCount;

    const materialCost = areaUsed * quoteForm.materialPrice;
    const hardwareCost =
      hingeCount * quoteForm.hingePrice
      + drawerRailCount * quoteForm.drawerPrice
      + handleCount * quoteForm.handlePrice;
    const addonCost = quoteForm.addon;

    const total = materialCost + hardwareCost + addonCost;

    return {
      projectionArea,
      expansionArea,
      areaUsed,
      doorCount,
      hingeCount,
      drawerRailCount,
      handleCount,
      materialCost,
      hardwareCost,
      addonCost,
      total,
    };
  }, [quoteForm]);

  const handleAdvanceOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const currentIndex = STATUS_FLOW.findIndex((status) => status.id === order.status);
        const nextStatus = STATUS_FLOW[Math.min(currentIndex + 1, STATUS_FLOW.length - 1)].id;
        return {
          ...order,
          status: nextStatus,
          statusUpdatedAt: new Date().toISOString(),
        };
      }),
    );
  };

  const handleAddCustomer = () => {
    if (!customerForm.name.trim()) return;
    const newCustomer: Customer = {
      id: createId(),
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
      address: customerForm.address.trim(),
      style: customerForm.style.trim(),
      budget: customerForm.budget.trim(),
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    setCustomerForm({ name: "", phone: "", address: "", style: "", budget: "" });
    setOrderForm((prev) => ({
      ...prev,
      customerId: prev.customerId || newCustomer.id,
    }));
  };

  const handleAddOrder = () => {
    if (!orderForm.title.trim() || !orderForm.customerId) return;
    const newOrder: Order = {
      id: createId(),
      customerId: orderForm.customerId,
      title: orderForm.title.trim(),
      status: orderForm.status,
      total: orderForm.total,
      statusUpdatedAt: new Date().toISOString(),
      note: orderForm.note.trim(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    setOrderForm({ customerId: orderForm.customerId, title: "", status: "initial", total: 0, note: "" });
  };

  const handleCreateQuote = () => {
    const newQuote: Quote = {
      id: createId(),
      orderId: quoteOrderId || null,
      createdAt: new Date().toISOString(),
      pricingMode: quoteForm.pricingMode,
      area: quotePreview.areaUsed,
      materialCost: quotePreview.materialCost,
      hardwareCost: quotePreview.hardwareCost,
      addonCost: quotePreview.addonCost,
      total: quotePreview.total,
    };

    setQuotes((prev) => [newQuote, ...prev].slice(0, 12));

    if (quoteOrderId) {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === quoteOrderId
            ? { ...order, total: Math.round(newQuote.total) }
            : order,
        ),
      );
    }
  };

  const handleInventoryChange = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, stock: Math.max(0, item.stock + delta) }
          : item,
      ),
    );
  };

  const handleAddReminder = () => {
    if (!reminderForm.title.trim()) return;
    const dueAt = addDays(new Date().toISOString(), reminderForm.dueInDays);
    const newReminder: Reminder = {
      id: createId(),
      title: reminderForm.title.trim(),
      dueAt,
    };
    setManualReminders((prev) => [newReminder, ...prev]);
    setReminderForm({ title: "", dueInDays: 1 });
  };

  const activeOrders = orders.filter((order) => order.status !== "delivered");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">全屋定制小管家</div>
          <div className="brand-subtitle">Lite MVP · 轻量业务流</div>
        </div>
        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-button ${activeView === item.id ? "active" : ""}`}
              onClick={() => setActiveView(item.id)}
              type="button"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="chip">MVP 版本 · 2-3 人团队</div>
          <div className="chip soft">极简流程 · 快速报价</div>
        </div>
      </aside>

      <main className="main">
        <header className="hero">
          <div>
            <p className="hero-kicker">今日重点</p>
            <h1 className="hero-title">把报价做快，把节点做稳</h1>
            <p className="hero-subtitle">
              自动计算板材与五金成本，订单节点清晰可见，提醒不漏单。
            </p>
          </div>
          <div className="hero-actions">
            <button className="button" type="button" onClick={() => setActiveView("quotes")}>
              <Plus size={16} />
              生成报价
            </button>
            <button className="button ghost" type="button" onClick={() => setActiveView("orders")}>
              <ArrowRight size={16} />
              查看订单
            </button>
          </div>
        </header>

        <section className="content">
          {activeView === "dashboard" && (
            <div className="view-grid">
              <div className="stat-grid">
                <div className="stat-card reveal" style={{ "--delay": "0s" } as CSSProperties}>
                  <div className="stat-label">本月新增客户</div>
                  <div className="stat-value">{stats.monthlyCustomers}</div>
                  <div className="stat-meta">客户沉淀中</div>
                </div>
                <div className="stat-card reveal" style={{ "--delay": "0.05s" } as CSSProperties}>
                  <div className="stat-label">在途订单</div>
                  <div className="stat-value">{stats.activeOrders}</div>
                  <div className="stat-meta">含量尺与生产</div>
                </div>
                <div className="stat-card reveal" style={{ "--delay": "0.1s" } as CSSProperties}>
                  <div className="stat-label">待安装节点</div>
                  <div className="stat-value">{stats.producingOrders}</div>
                  <div className="stat-meta">重点关注交付</div>
                </div>
                <div className="stat-card reveal" style={{ "--delay": "0.15s" } as CSSProperties}>
                  <div className="stat-label">订单金额池</div>
                  <div className="stat-value">{formatMoney(stats.pipelineValue)}</div>
                  <div className="stat-meta">估算总额</div>
                </div>
              </div>

              <div className="split">
                <div className="card">
                  <div className="card-header">
                    <div>
                      <h3>订单看板</h3>
                      <p>快速扫一眼当前节点</p>
                    </div>
                    <button className="button secondary" type="button" onClick={() => setActiveView("orders")}>
                      进入详情
                    </button>
                  </div>
                  <div className="board compact">
                    {ordersByStatus.slice(0, 4).map((group) => (
                      <div className="board-column" key={group.id}>
                        <div className="board-title">
                          <span>{group.label}</span>
                          <span className="count">{group.orders.length}</span>
                        </div>
                        <div className="board-cards">
                          {group.orders.slice(0, 2).map((order) => {
                            const customer = customers.find((item) => item.id === order.customerId);
                            return (
                              <div className="order-card" key={order.id}>
                                <div className="order-title">{order.title}</div>
                                <div className="order-meta">
                                  <span>{customer?.name}</span>
                                  <span>{formatMoney(order.total)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div>
                      <h3>待办提醒</h3>
                      <p>系统自动 + 手动闹钟</p>
                    </div>
                    <span className="badge"><Bell size={14} /> {reminders.length}</span>
                  </div>
                  <div className="reminder-form">
                    <input
                      className="input"
                      placeholder="新增提醒，例如：下午 3 点去量尺"
                      value={reminderForm.title}
                      onChange={(event) =>
                        setReminderForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                    />
                    <select
                      className="select"
                      value={reminderForm.dueInDays}
                      onChange={(event) =>
                        setReminderForm((prev) => ({
                          ...prev,
                          dueInDays: Number(event.target.value),
                        }))
                      }
                    >
                      <option value={0}>今天</option>
                      <option value={1}>明天</option>
                      <option value={2}>后天</option>
                      <option value={7}>一周后</option>
                    </select>
                    <button className="button" type="button" onClick={handleAddReminder}>
                      添加
                    </button>
                  </div>
                  <div className="list">
                    {reminders.slice(0, 6).map((reminder) => (
                      <div className="list-item" key={reminder.id}>
                        <div>
                          <div className="list-title">{reminder.title}</div>
                          <div className="list-meta">
                            {formatDate(reminder.dueAt)} · 剩余 {daysLeft(reminder.dueAt)} 天
                          </div>
                        </div>
                        <span className={`status-pill ${daysLeft(reminder.dueAt) <= 1 ? "urgent" : ""}`}>
                          {daysLeft(reminder.dueAt) <= 0 ? "已到期" : "待处理"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === "orders" && (
            <div className="view-grid">
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>快速建单</h3>
                    <p>不走审批，马上记录</p>
                  </div>
                </div>
                <div className="form-grid">
                  <label className="field">
                    <span>客户</span>
                    <select
                      className="select"
                      value={orderForm.customerId}
                      onChange={(event) =>
                        setOrderForm((prev) => ({ ...prev, customerId: event.target.value }))
                      }
                    >
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} · {customer.phone}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>订单名称</span>
                    <input
                      className="input"
                      placeholder="例如：主卧衣柜+书房"
                      value={orderForm.title}
                      onChange={(event) =>
                        setOrderForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>状态</span>
                    <select
                      className="select"
                      value={orderForm.status}
                      onChange={(event) =>
                        setOrderForm((prev) => ({
                          ...prev,
                          status: event.target.value as OrderStatus,
                        }))
                      }
                    >
                      {STATUS_FLOW.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>预计金额</span>
                    <input
                      className="input"
                      type="number"
                      value={orderForm.total}
                      onChange={(event) =>
                        setOrderForm((prev) => ({ ...prev, total: Number(event.target.value) }))
                      }
                    />
                  </label>
                  <label className="field field-full">
                    <span>备注</span>
                    <input
                      className="input"
                      placeholder="如：需要加急封边"
                      value={orderForm.note}
                      onChange={(event) =>
                        setOrderForm((prev) => ({ ...prev, note: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <button className="button" type="button" onClick={handleAddOrder}>
                  保存订单
                </button>
              </div>

              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>订单看板</h3>
                    <p>拖拽暂不做，用“下一步”流转</p>
                  </div>
                  <span className="badge">在途 {activeOrders.length}</span>
                </div>
                <div className="board">
                  {ordersByStatus.map((group) => (
                    <div className="board-column" key={group.id}>
                      <div className="board-title">
                        <div>
                          <div>{group.label}</div>
                          <div className="board-hint">{group.hint}</div>
                        </div>
                        <span className="count">{group.orders.length}</span>
                      </div>
                      <div className="board-cards">
                        {group.orders.map((order) => {
                          const customer = customers.find((item) => item.id === order.customerId);
                          return (
                            <div className="order-card" key={order.id}>
                              <div className="order-title">{order.title}</div>
                              <div className="order-meta">
                                <span>{customer?.name}</span>
                                <span>{customer?.address}</span>
                              </div>
                              <div className="order-meta">
                                <span>{formatMoney(order.total)}</span>
                                <span>更新 {formatDate(order.statusUpdatedAt)}</span>
                              </div>
                              <div className="order-actions">
                                <span className={`status-pill ${order.status}`}>{group.label}</span>
                                {order.status !== "delivered" && (
                                  <button
                                    className="button ghost small"
                                    type="button"
                                    onClick={() => handleAdvanceOrder(order.id)}
                                  >
                                    下一步
                                    <ArrowRight size={14} />
                                  </button>
                                )}
                              </div>
                              {order.note ? <p className="order-note">{order.note}</p> : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === "quotes" && (
            <div className="view-grid">
              <div className="split">
                <div className="card">
                  <div className="card-header">
                    <div>
                      <h3>智能报价计算器</h3>
                      <p>快速输入尺寸，自动拆分板材与五金</p>
                    </div>
                  </div>
                  <div className="form-grid">
                    <label className="field">
                      <span>关联订单</span>
                      <select
                        className="select"
                        value={quoteOrderId}
                        onChange={(event) => setQuoteOrderId(event.target.value)}
                      >
                        <option value="">通用报价</option>
                        {orders.map((order) => (
                          <option key={order.id} value={order.id}>
                            {order.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>柜体类型</span>
                      <select
                        className="select"
                        value={quoteForm.cabinetType}
                        onChange={(event) =>
                          setQuoteForm((prev) => ({ ...prev, cabinetType: event.target.value }))
                        }
                      >
                        <option value="wardrobe">衣柜</option>
                        <option value="kitchen">橱柜</option>
                        <option value="shoe">鞋柜</option>
                        <option value="custom">其他定制</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>长 (mm)</span>
                      <input
                        className="input"
                        type="number"
                        value={quoteForm.length}
                        onChange={(event) =>
                          setQuoteForm((prev) => ({ ...prev, length: Number(event.target.value) }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>高 (mm)</span>
                      <input
                        className="input"
                        type="number"
                        value={quoteForm.height}
                        onChange={(event) =>
                          setQuoteForm((prev) => ({ ...prev, height: Number(event.target.value) }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>深 (mm)</span>
                      <input
                        className="input"
                        type="number"
                        value={quoteForm.width}
                        onChange={(event) =>
                          setQuoteForm((prev) => ({ ...prev, width: Number(event.target.value) }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>隔板数量</span>
                      <input
                        className="input"
                        type="number"
                        value={quoteForm.boardCount}
                        onChange={(event) =>
                          setQuoteForm((prev) => ({ ...prev, boardCount: Number(event.target.value) }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>抽屉数量</span>
                      <input
                        className="input"
                        type="number"
                        value={quoteForm.drawerCount}
                        onChange={(event) =>
                          setQuoteForm((prev) => ({ ...prev, drawerCount: Number(event.target.value) }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>计价模式</span>
                      <select
                        className="select"
                        value={quoteForm.pricingMode}
                        onChange={(event) =>
                          setQuoteForm((prev) => ({
                            ...prev,
                            pricingMode: event.target.value as "projection" | "expansion",
                          }))
                        }
                      >
                        <option value="projection">投影面积</option>
                        <option value="expansion">展开面积</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>板材单价 (元/㎡)</span>
                      <input
                        className="input"
                        type="number"
                        value={quoteForm.materialPrice}
                        onChange={(event) =>
                          setQuoteForm((prev) => ({
                            ...prev,
                            materialPrice: Number(event.target.value),
                          }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>铰链单价</span>
                      <input
                        className="input"
                        type="number"
                        value={quoteForm.hingePrice}
                        onChange={(event) =>
                          setQuoteForm((prev) => ({ ...prev, hingePrice: Number(event.target.value) }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>抽轨单价</span>
                      <input
                        className="input"
                        type="number"
                        value={quoteForm.drawerPrice}
                        onChange={(event) =>
                          setQuoteForm((prev) => ({ ...prev, drawerPrice: Number(event.target.value) }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>拉手单价</span>
                      <input
                        className="input"
                        type="number"
                        value={quoteForm.handlePrice}
                        onChange={(event) =>
                          setQuoteForm((prev) => ({ ...prev, handlePrice: Number(event.target.value) }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>附加费</span>
                      <input
                        className="input"
                        type="number"
                        value={quoteForm.addon}
                        onChange={(event) =>
                          setQuoteForm((prev) => ({ ...prev, addon: Number(event.target.value) }))
                        }
                      />
                    </label>
                  </div>
                  <button className="button" type="button" onClick={handleCreateQuote}>
                    一键生成报价
                  </button>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div>
                      <h3>报价预览</h3>
                      <p>投影 / 展开面积自动估算</p>
                    </div>
                    <span className="badge">自动计算</span>
                  </div>
                  <div className="quote-summary">
                    <div>
                      <div className="quote-total">{formatMoney(Math.round(quotePreview.total))}</div>
                      <div className="quote-meta">当前估算总价</div>
                    </div>
                    <div className="quote-area">
                      <div>投影面积 {quotePreview.projectionArea.toFixed(2)} ㎡</div>
                      <div>展开面积 {quotePreview.expansionArea.toFixed(2)} ㎡</div>
                      <div>计价面积 {quotePreview.areaUsed.toFixed(2)} ㎡</div>
                    </div>
                  </div>
                  <div className="divider" />
                  <div className="quote-breakdown">
                    <div className="break-row">
                      <span>板材成本</span>
                      <span>{formatMoney(Math.round(quotePreview.materialCost))}</span>
                    </div>
                    <div className="break-row">
                      <span>五金成本</span>
                      <span>{formatMoney(Math.round(quotePreview.hardwareCost))}</span>
                    </div>
                    <div className="break-row">
                      <span>附加费</span>
                      <span>{formatMoney(Math.round(quotePreview.addonCost))}</span>
                    </div>
                    <div className="break-row total">
                      <span>总价</span>
                      <span>{formatMoney(Math.round(quotePreview.total))}</span>
                    </div>
                  </div>
                  <div className="quote-hardware">
                    <div>
                      铰链 {quotePreview.hingeCount} 个 · 抽轨 {quotePreview.drawerRailCount} 副
                    </div>
                    <div>拉手 {quotePreview.handleCount} 个 · 隔板 {quoteForm.boardCount} 块</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>最近报价</h3>
                    <p>生成后即可分享</p>
                  </div>
                </div>
                <div className="list">
                  {quotes.map((quote) => {
                    const order = orders.find((item) => item.id === quote.orderId);
                    return (
                      <div className="list-item" key={quote.id}>
                        <div>
                          <div className="list-title">{order?.title ?? "通用报价"}</div>
                          <div className="list-meta">
                            {formatDate(quote.createdAt)} · {quote.pricingMode === "projection" ? "投影" : "展开"}
                            · {quote.area.toFixed(1)} ㎡
                          </div>
                        </div>
                        <span className="badge">{formatMoney(Math.round(quote.total))}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeView === "inventory" && (
            <div className="view-grid">
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3>轻量库存</h3>
                    <p>只管理常用五金和耗材</p>
                  </div>
                </div>
                <div className="inventory-list">
                  {inventory.map((item) => (
                    <div className="inventory-row" key={item.id}>
                      <div>
                        <div className="list-title">{item.name}</div>
                        <div className="list-meta">
                          安全库存 {item.safe} {item.unit}
                        </div>
                      </div>
                      <div className={`inventory-stock ${item.stock <= item.safe ? "low" : ""}`}>
                        {item.stock} {item.unit}
                      </div>
                      <div className="inventory-actions">
                        <button
                          className="button ghost small"
                          type="button"
                          onClick={() => handleInventoryChange(item.id, -1)}
                        >
                          -1
                        </button>
                        <button
                          className="button secondary small"
                          type="button"
                          onClick={() => handleInventoryChange(item.id, 10)}
                        >
                          +10
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === "customers" && (
            <div className="view-grid">
              <div className="split">
                <div className="card">
                  <div className="card-header">
                    <div>
                      <h3>新增客户</h3>
                      <p>客户档案一键录入</p>
                    </div>
                  </div>
                  <div className="form-grid">
                    <label className="field">
                      <span>姓名</span>
                      <input
                        className="input"
                        value={customerForm.name}
                        onChange={(event) =>
                          setCustomerForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>电话</span>
                      <input
                        className="input"
                        value={customerForm.phone}
                        onChange={(event) =>
                          setCustomerForm((prev) => ({ ...prev, phone: event.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>小区地址</span>
                      <input
                        className="input"
                        value={customerForm.address}
                        onChange={(event) =>
                          setCustomerForm((prev) => ({ ...prev, address: event.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>意向风格</span>
                      <input
                        className="input"
                        value={customerForm.style}
                        onChange={(event) =>
                          setCustomerForm((prev) => ({ ...prev, style: event.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>预算</span>
                      <input
                        className="input"
                        value={customerForm.budget}
                        onChange={(event) =>
                          setCustomerForm((prev) => ({ ...prev, budget: event.target.value }))
                        }
                      />
                    </label>
                  </div>
                  <button className="button" type="button" onClick={handleAddCustomer}>
                    保存客户
                  </button>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div>
                      <h3>客户列表</h3>
                      <p>可直接关联订单与报价</p>
                    </div>
                    <span className="badge">{customers.length} 位</span>
                  </div>
                  <div className="list">
                    {customers.map((customer) => (
                      <div className="list-item" key={customer.id}>
                        <div>
                          <div className="list-title">{customer.name}</div>
                          <div className="list-meta">
                            {customer.phone} · {customer.address}
                          </div>
                        </div>
                        <span className="tag">{customer.style || "待确认"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
