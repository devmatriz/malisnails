import { initSupabaseClient, isSupabaseConfigured, supabase } from "./supabase-client.js";

const adminViews = new Set([
  "dashboard",
  "citas",
  "calendario",
  "clientes",
  "servicios",
  "ventas",
  "inventario",
  "empleados",
  "reportes"
]);

let currentSession = null;
let adminServices = [];
let adminProducts = [];
let appointmentServices = [];
let appointmentEmployees = [];
let currentAppointments = [];
let currentAppointmentDetailId = "";
let currentSalesPayments = [];
let currentClients = [];
let currentEmployees = [];
let currentWorkingHours = [];
let currentTimeBlocks = [];
let servicesLoading = false;
let productsLoading = false;
let appointmentsLoading = false;
let selectedScheduleDate = localDateValue();
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const titles = {
  dashboard: "Dashboard Administrativo",
  citas: "Gestión de Citas",
  calendario: "Calendario de Citas",
  clientes: "Gestión de Clientes",
  servicios: "Gestión de Servicios",
  ventas: "Ventas y Pagos",
  inventario: "Gestión de Inventario",
  empleados: "Gestión de Empleados",
  reportes: "Reportes Administrativos",
  login: "Iniciar sesión"
};

const subtitles = {
  dashboard: "Resumen de citas, caja e inventario del salón.",
  citas: "Agenda, solicitudes online y estados de cada cita.",
  calendario: "Agenda visual por fecha, hora y estilista.",
  clientes: "Historial, preferencias y seguimiento de clientas.",
  servicios: "Catálogo, precios y reserva online.",
  ventas: "Pagos del día y cierre de caja.",
  inventario: "Stock, mínimos y visibilidad pública.",
  empleados: "Equipo, horarios y bloqueos.",
  reportes: "Lectura gerencial por periodo.",
  login: "Acceso administrativo."
};

const viewTitle = document.querySelector("#view-title");
const viewSubtitle = document.querySelector("#view-subtitle");
const sidebar = document.querySelector("#admin-sidebar");
const sidebarToggle = document.querySelector("#sidebar-toggle");
const sidebarBackdrop = document.querySelector("#sidebar-backdrop");
const notifyBadge = document.querySelector("#notify-badge");
const notifyButton = document.querySelector("#notify-button");
const profileChip = document.querySelector("#profile-chip");
const navButtons = document.querySelectorAll("[data-view]");
const views = document.querySelectorAll(".view");
const mobileTabs = document.querySelectorAll(".mobile-tabs button");
const logoutButton = document.querySelector("#logout-button");
const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const bookingRequestList = document.querySelector("#booking-request-list");
const refreshBookingsButton = document.querySelector("#refresh-bookings");
const adminServiceGrid = document.querySelector("#admin-service-grid");
const adminProductGrid = document.querySelector("#admin-product-grid");
const serviceForm = document.querySelector("#service-form");
const serviceMessage = document.querySelector("#service-message");
const cancelServiceEdit = document.querySelector("#cancel-service-edit");
const newServiceButton = document.querySelector("#new-service-button");
const productForm = document.querySelector("#product-form");
const productMessage = document.querySelector("#product-message");
const cancelProductEdit = document.querySelector("#cancel-product-edit");
const newProductButton = document.querySelector("#new-product-button");
const salesCommand = document.querySelector("#sales-command");
const salesSummaryGrid = document.querySelector("#sales-summary-grid");
const salesPaymentList = document.querySelector("#sales-payment-list");
const salesMethodFilter = document.querySelector("#sales-method-filter");
const cashCloseChecklist = document.querySelector("#cash-close-checklist");
const exportSalesCsvButton = document.querySelector("#export-sales-csv");
const clientSummaryGrid = document.querySelector("#client-summary-grid");
const clientTableBody = document.querySelector("#client-table-body");
const clientProfileCard = document.querySelector("#client-profile-card");
const clientSearch = document.querySelector("#client-search");
const clientForm = document.querySelector("#client-form");
const clientMessage = document.querySelector("#client-message");
const clearClientForm = document.querySelector("#clear-client-form");
const newClientButton = document.querySelector("#new-client-button");
const clientSubmitButton = clientForm?.querySelector('button[type="submit"]');
const scheduleList = document.querySelector(".schedule-list");
const scheduleSummary = document.querySelector(".schedule-summary");
const scheduleDateLabel = document.querySelector(".date-switcher strong");
const scheduleDateMeta = document.querySelector(".schedule-date-meta");
const previousScheduleDay = document.querySelector('.date-switcher button[aria-label="Día anterior"]');
const nextScheduleDay = document.querySelector('.date-switcher button[aria-label="Día siguiente"]');
const scheduleEmployeeFilter = document.querySelector("#schedule-employee-filter");
const scheduleStatusFilter = document.querySelector("#schedule-status-filter");
const appointmentDetail = document.querySelector("#appointment-detail");
const appointmentForm = document.querySelector("#appointment-form");
const appointmentServiceSelect = document.querySelector("#appointment-service");
const appointmentEmployeeSelect = document.querySelector("#appointment-employee");
const appointmentDate = document.querySelector("#appointment-date");
const appointmentMessage = document.querySelector("#appointment-message");
const clearAppointmentForm = document.querySelector("#clear-appointment-form");
const newAppointmentButton = document.querySelector("#new-appointment-button");
const appointmentSubmitButton = appointmentForm?.querySelector('button[type="submit"]');
const teamSummaryGrid = document.querySelector("#team-summary-grid");
const teamGrid = document.querySelector("#team-grid");
const employeeForm = document.querySelector("#employee-form");
const employeeMessage = document.querySelector("#employee-message");
const clearEmployeeForm = document.querySelector("#clear-employee-form");
const newEmployeeButton = document.querySelector("#new-employee-button");
const employeeSubmitButton = employeeForm?.querySelector('button[type="submit"]');
const workingHoursForm = document.querySelector("#working-hours-form");
const timeBlockForm = document.querySelector("#time-block-form");
const availabilityMessage = document.querySelector("#availability-message");
const availabilityList = document.querySelector("#availability-list");
const dashboardHeadline = document.querySelector("#dashboard-headline");
const dashboardSubcopy = document.querySelector("#dashboard-subcopy");
const dashboardStatusRow = document.querySelector("#dashboard-status-row");
const dashboardMetrics = document.querySelector("#dashboard-metrics");
const dashboardAttentionList = document.querySelector("#dashboard-attention-list");
const dashboardUpcomingList = document.querySelector("#dashboard-upcoming-list");
const dashboardServiceMix = document.querySelector("#dashboard-service-mix");
const dashboardInsight = document.querySelector("#dashboard-insight");
const dashboardCloseoutList = document.querySelector("#dashboard-closeout-list");

const drawerBackdrop = document.querySelector(".drawer-backdrop");
const toastRegion = document.querySelector("#admin-toast");
let openDrawerForm = null;
// Drawers sit at body level so no animated (transformed) ancestor can trap position: fixed.
document.querySelectorAll("form.drawer").forEach((form) => document.body.insertBefore(form, drawerBackdrop));
let drawerReturnFocus = null;
let toastTimer = 0;

// Create/edit forms live in a side drawer so the working list stays visible.
function openDrawer(form, focusField) {
  if (!form) return;
  if (openDrawerForm && openDrawerForm !== form) closeDrawer({ restoreFocus: false });
  const isEdit = Boolean(form.elements.id?.value);
  const title = form.querySelector(".drawer-head h2");
  if (title) title.textContent = isEdit ? form.dataset.titleEdit : form.dataset.titleNew;
  drawerReturnFocus = openDrawerForm ? drawerReturnFocus : document.activeElement;
  form.hidden = false;
  drawerBackdrop.hidden = false;
  document.body.classList.add("has-drawer");
  openDrawerForm = form;
  requestAnimationFrame(() => {
    form.classList.add("is-open");
    drawerBackdrop.classList.add("is-open");
    const target = focusField ? form.elements[focusField] : form.querySelector("input:not([type=hidden]), select, textarea");
    target?.focus({ preventScroll: true });
  });
}

function closeDrawer({ restoreFocus = true } = {}) {
  const form = openDrawerForm;
  if (!form) return;
  openDrawerForm = null;
  form.classList.remove("is-open");
  drawerBackdrop.classList.remove("is-open");
  document.body.classList.remove("has-drawer");
  const finish = () => {
    if (openDrawerForm === form) return;
    form.hidden = true;
    if (!openDrawerForm) drawerBackdrop.hidden = true;
  };
  if (reduceMotion) finish();
  else setTimeout(finish, 260);
  if (restoreFocus && drawerReturnFocus?.isConnected) drawerReturnFocus.focus({ preventScroll: true });
}

function toast(message, tone = "success") {
  if (!toastRegion) return;
  clearTimeout(toastTimer);
  toastRegion.textContent = message;
  toastRegion.dataset.tone = tone;
  toastRegion.classList.add("is-visible");
  toastTimer = setTimeout(() => toastRegion.classList.remove("is-visible"), 3600);
}

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-drawer-close]")) closeDrawer();
});

document.addEventListener("keydown", (event) => {
  if (!openDrawerForm) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeDrawer();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...openDrawerForm.querySelectorAll("button, input:not([type=hidden]), select, textarea, a[href]")].filter((node) => !node.disabled && node.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

const weekdayLabels = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function setMessage(element, message, tone = "") {
  if (!element) return;
  element.textContent = message;
  element.dataset.tone = tone;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);
}

function isAdminView(viewName) {
  return adminViews.has(viewName);
}

function canOpenView(viewName) {
  if (!isSupabaseConfigured || !supabase) return true;
  return !isAdminView(viewName) || Boolean(currentSession);
}

function showView(viewName) {
  if (!canOpenView(viewName)) {
    setMessage(loginMessage, "Inicia sesión para entrar al panel.", "warning");
    viewName = "login";
  }

  closeDrawer({ restoreFocus: false });
  views.forEach((view) => view.classList.toggle("is-visible", view.id === viewName));
  navButtons.forEach((button) => {
    const isActive = button.dataset.view === viewName;
    button.classList.toggle("is-active", isActive);
    if (isActive) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  mobileTabs.forEach((button) => {
    const isActive = button.dataset.view === viewName;
    button.classList.toggle("is-active", isActive);
    if (isActive) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  viewTitle.textContent = titles[viewName] || "MALIS NAILS";
  if (viewSubtitle) viewSubtitle.textContent = subtitles[viewName] || "";
  setSidebarOpen(false);
  document.title = `${titles[viewName] || "MALIS NAILS"} | MALIS NAILS`;
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });

  if (viewName === "citas") {
    if (appointmentDate && !appointmentDate.value) appointmentDate.value = selectedScheduleDate;
    loadAppointmentServices();
    loadAppointmentEmployees();
    loadBookingRequests();
    loadAppointments();
  }
  if (viewName === "calendario") {
    loadCalendar();
  }
  if (viewName === "servicios") {
    loadAdminServices();
  }
  if (viewName === "inventario") {
    loadAdminProducts();
  }
  if (viewName === "ventas") {
    loadSalesData();
  }
  if (viewName === "clientes") {
    loadClients();
  }
  if (viewName === "empleados") {
    if (timeBlockForm?.elements.block_date && !timeBlockForm.elements.block_date.value) {
      timeBlockForm.elements.block_date.value = localDateValue();
      timeBlockForm.elements.block_date.min = localDateValue();
    }
    loadEmployees();
  }
  if (viewName === "dashboard") {
    loadDashboardData();
  }
}

function updateAuthUI() {
  logoutButton?.classList.toggle("is-hidden", !currentSession);
  if (profileChip) {
    const email = currentSession?.user?.email || "";
    profileChip.hidden = !currentSession;
    const nameNode = profileChip.querySelector("#profile-name");
    const emailNode = profileChip.querySelector("#profile-email");
    const avatarNode = profileChip.querySelector("#profile-avatar");
    if (emailNode) emailNode.textContent = email;
    if (nameNode) nameNode.textContent = "Administración";
    if (avatarNode) avatarNode.textContent = (email.trim()[0] || "A").toUpperCase();
  }
  if (currentSession) startPendingWatch();
  else {
    stopPendingWatch();
    setPendingRequestCount(0);
  }
}

function setNotificationCount(count) {
  if (!notifyBadge) return;
  notifyBadge.hidden = !count;
  notifyBadge.textContent = count > 99 ? "99+" : String(count);
  notifyButton?.setAttribute("aria-label", count ? `${count} pendientes por confirmar` : "Sin pendientes por confirmar");
}

// Pending approval = online requests (public_bookings) still in "pending".
// Approved/rejected ones are excluded by status; repeated submissions of the
// same phone + date + time + service count once.
const pendingBadges = document.querySelectorAll("[data-pending-badge]");
let pendingRequestCount = 0;
let pendingWatchTimer = 0;
let pendingChannel = null;
let pendingRefreshing = null;

function bookingDedupKey(booking) {
  return [
    String(booking.client_phone || "").replace(/\D/g, ""),
    booking.preferred_date || "",
    String(booking.preferred_time || "").slice(0, 5),
    booking.service_id || ""
  ].join("|");
}

function uniquePendingBookings(bookings) {
  const seen = new Set();
  return bookings.filter((booking) => {
    const key = bookingDedupKey(booking);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function setPendingRequestCount(count) {
  const changed = count !== pendingRequestCount;
  pendingRequestCount = count;
  const label = count > 99 ? "99+" : String(count);
  pendingBadges.forEach((badge) => {
    badge.hidden = !count;
    badge.textContent = label;
    badge.setAttribute("aria-label", `${count} ${count === 1 ? "solicitud pendiente" : "solicitudes pendientes"}`);
  });
  setNotificationCount(count);
  const tile = document.querySelector("#citas-summary article:first-child strong");
  if (tile && currentSession) tile.textContent = String(count);
  return changed;
}

async function refreshPendingRequests() {
  if (!supabase || !currentSession) {
    setPendingRequestCount(0);
    return false;
  }
  pendingRefreshing ??= supabase
    .from("public_bookings")
    .select("id, service_id, client_phone, preferred_date, preferred_time")
    .eq("status", "pending")
    .then(({ data, error }) => {
      if (error) {
        console.error("Pending requests count failed", error);
        return false;
      }
      return setPendingRequestCount(uniquePendingBookings(data || []).length);
    })
    .finally(() => { pendingRefreshing = null; });
  return pendingRefreshing;
}

// New online requests arrive from the public site: poll every minute, refresh
// when the tab regains focus and, if Supabase Realtime is enabled for the
// table, react immediately.
async function syncPendingRequests() {
  const changed = await refreshPendingRequests();
  if (!changed) return;
  if (document.querySelector("#citas.is-visible")) loadBookingRequests();
  if (document.querySelector("#calendario.is-visible")) loadCalendar();
}

function startPendingWatch() {
  refreshPendingRequests();
  if (pendingWatchTimer) return;
  pendingWatchTimer = setInterval(() => {
    if (document.visibilityState === "visible") syncPendingRequests();
  }, 60000);
  try {
    pendingChannel = supabase?.channel?.("admin-public-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "public_bookings" }, () => syncPendingRequests())
      .subscribe();
  } catch (error) {
    console.warn("Realtime unavailable; using polling only", error);
  }
}

function stopPendingWatch() {
  clearInterval(pendingWatchTimer);
  pendingWatchTimer = 0;
  if (pendingChannel) {
    supabase?.removeChannel?.(pendingChannel);
    pendingChannel = null;
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && currentSession) syncPendingRequests();
});

// One place to refresh every agenda surface after a create/update/approval.
function onAgendaChanged() {
  refreshPendingRequests();
  if (document.querySelector("#citas.is-visible")) loadCitasSummary();
  if (document.querySelector("#calendario.is-visible")) loadCalendar();
}


function setSidebarOpen(isOpen) {
  if (!sidebar) return;
  sidebar.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("has-sidebar", isOpen);
  sidebarToggle?.setAttribute("aria-expanded", String(isOpen));
  if (sidebarBackdrop) sidebarBackdrop.hidden = !isOpen;
}

sidebarToggle?.addEventListener("click", () => setSidebarOpen(!sidebar?.classList.contains("is-open")));
sidebarBackdrop?.addEventListener("click", () => setSidebarOpen(false));
window.matchMedia("(min-width: 1081px)").addEventListener("change", (event) => {
  if (event.matches) setSidebarOpen(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sidebar?.classList.contains("is-open")) {
    setSidebarOpen(false);
    sidebarToggle?.focus();
  }
});

function money(value) {
  return Number(value).toLocaleString("es-NI");
}

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatScheduleDate(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  return new Intl.DateTimeFormat("es-NI", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(date);
}

function formatTime(value) {
  if (!value) return "--:--";
  return new Intl.DateTimeFormat("es-NI", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

function addDays(dateValue, amount) {
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return localDateValue(date);
}

function appointmentStatusMeta(status) {
  const statuses = {
    pending: { label: "Pendiente", className: "warn", itemClass: "pending" },
    confirmed: { label: "Confirmada", className: "ok", itemClass: "confirmed" },
    in_progress: { label: "En proceso", className: "", itemClass: "confirmed" },
    completed: { label: "Completada", className: "ok", itemClass: "completed" },
    cancelled: { label: "Cancelada", className: "danger", itemClass: "pending" },
    no_show: { label: "No asistió", className: "danger", itemClass: "pending" }
  };
  return statuses[status] || statuses.pending;
}

function setBusy(form, isBusy) {
  if (!form) return;
  form.querySelectorAll("button, input, select, textarea").forEach((control) => {
    control.toggleAttribute("disabled", isBusy);
  });
  form.setAttribute("aria-busy", String(isBusy));
}

function renderEmptyState(container, title, detail, actionLabel, viewName, drawerId) {
  if (!container) return;
  const action = drawerId ? `data-drawer-open="${drawerId}"` : `data-view="${viewName || ""}"`;
  container.innerHTML = `
    <article class="empty-state">
      <strong>${title}</strong>
      <p>${detail}</p>
      ${actionLabel ? `<button class="quiet-button" type="button" ${action}>${actionLabel}</button>` : ""}
    </article>
  `;
}

// Summary tiles show a dash, not a zero, when there is no data source.
function markSignedOut(grid) {
  grid?.querySelectorAll("article").forEach((tile) => {
    const value = tile.querySelector("strong");
    const note = tile.querySelector("small");
    if (value) value.textContent = "—";
    if (note) note.textContent = "Inicia sesión";
  });
}

function renderLoadingState(container, label) {
  if (!container) return;
  container.innerHTML = `
    <article class="loading-state" aria-live="polite">
      <span></span>
      <p>${label}</p>
    </article>
  `;
}

function validateServicePayload(payload) {
  if (!payload.name) return "Escribe el nombre del servicio.";
  if (!payload.category) return "Escribe una categoría para ordenar el catálogo.";
  if (!Number.isFinite(payload.base_price) || payload.base_price < 0) return "El precio base debe ser cero o mayor.";
  if (!Number.isFinite(payload.duration_minutes) || payload.duration_minutes < 1) return "La duración debe ser de al menos 1 minuto.";
  if (payload.name.length > 100) return "El nombre del servicio debe tener menos de 100 caracteres.";
  return "";
}

function validateProductPayload(payload) {
  if (!payload.name) return "Escribe el nombre del producto.";
  if (!payload.category) return "Escribe una categoría para ordenar inventario.";
  if (!payload.unit) return "Escribe la unidad de medida.";
  if (!Number.isFinite(payload.current_stock) || payload.current_stock < 0) return "El stock actual debe ser cero o mayor.";
  if (!Number.isFinite(payload.minimum_stock) || payload.minimum_stock < 0) return "El stock mínimo debe ser cero o mayor.";
  if (!Number.isFinite(payload.cost) || payload.cost < 0) return "El costo debe ser cero o mayor.";
  if (payload.name.length > 100) return "El nombre del producto debe tener menos de 100 caracteres.";
  return "";
}

function resetServiceForm() {
  serviceForm?.reset();
  const id = serviceForm?.querySelector('[name="id"]');
  if (id) id.value = "";
  setMessage(serviceMessage, "");
  setBusy(serviceForm, false);
}

function resetProductForm() {
  productForm?.reset();
  const id = productForm?.querySelector('[name="id"]');
  if (id) id.value = "";
  setMessage(productMessage, "");
  setBusy(productForm, false);
}

function resetAppointmentForm() {
  appointmentForm?.reset();
  const id = appointmentForm?.querySelector('[name="id"]');
  if (id) id.value = "";
  if (appointmentDate) appointmentDate.value = selectedScheduleDate;
  if (appointmentSubmitButton) appointmentSubmitButton.textContent = "Guardar cita";
  setMessage(appointmentMessage, "");
  setBusy(appointmentForm, false);
}

function resetClientForm() {
  clientForm?.reset();
  const id = clientForm?.querySelector('[name="id"]');
  if (id) id.value = "";
  if (clientSubmitButton) clientSubmitButton.textContent = "Guardar cliente";
  setMessage(clientMessage, "");
  setBusy(clientForm, false);
}

function resetEmployeeForm() {
  employeeForm?.reset();
  const id = employeeForm?.querySelector('[name="id"]');
  if (id) id.value = "";
  if (employeeForm?.elements.active) employeeForm.elements.active.checked = true;
  if (employeeSubmitButton) employeeSubmitButton.textContent = "Guardar empleada";
  setMessage(employeeMessage, "");
  setBusy(employeeForm, false);
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showView(button.dataset.view);
    const focusTarget = button.dataset.focus && document.getElementById(button.dataset.focus);
    if (focusTarget && focusTarget.closest(".view.is-visible")) {
      setTimeout(() => {
        focusTarget.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        focusTarget.focus({ preventScroll: true });
      }, 60);
    }
  });
});

document.addEventListener("click", (event) => {
  const opener = event.target.closest("[data-drawer-open]");
  if (opener) {
    document.querySelector(`#${opener.dataset.drawerOpen}`)?.reset();
    const form = document.querySelector(`#${opener.dataset.drawerOpen}`);
    if (form?.elements.id) form.elements.id.value = "";
    openDrawer(form);
    return;
  }
  const button = event.target.closest(".empty-state [data-view]");
  if (!button?.dataset.view) return;
  showView(button.dataset.view);
});

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginMessage, "");

  await initSupabaseClient();

  if (!supabase) {
    setMessage(loginMessage, "No pudimos cargar Supabase. Revisa la conexion o abre el proyecto con servidor local.", "warning");
    return;
  }

  const formData = new FormData(loginForm);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setMessage(loginMessage, "No pudimos iniciar sesion. Revisa el correo y la contrasena.", "error");
    return;
  }

  currentSession = data.session;
  updateAuthUI();
  loginForm.reset();
  showView("dashboard");
});

logoutButton?.addEventListener("click", async () => {
  if (supabase) await supabase.auth.signOut();
  currentSession = null;
  updateAuthUI();
  showView("login");
});

function timeAgo(value) {
  if (!value) return "";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Recibida ahora";
  if (minutes < 60) return `Recibida hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Recibida hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `Recibida hace ${days} ${days === 1 ? "día" : "días"}`;
}

function serviceNameById(serviceId) {
  return appointmentServices.find((service) => service.id === serviceId)?.name || "";
}

function renderBookingRequests(bookings) {
  if (!bookingRequestList) return;
  const countChip = document.querySelector("#booking-request-count");
  const uniqueCount = uniquePendingBookings(bookings).length;
  if (countChip) {
    countChip.hidden = !uniqueCount;
    countChip.textContent = String(uniqueCount);
  }
  bookingRequestList.closest(".online-bookings-panel")?.classList.toggle("has-pending", Boolean(uniqueCount));

  if (!bookings.length) {
    bookingRequestList.innerHTML = '<p class="muted">No hay solicitudes online pendientes.</p>';
    return;
  }

  const seen = new Set();
  bookingRequestList.innerHTML = "";
  bookings.forEach((booking) => {
    const key = bookingDedupKey(booking);
    const isDuplicate = seen.has(key);
    seen.add(key);

    const card = document.createElement("article");
    card.className = `booking-request-card needs-attention${isDuplicate ? " is-duplicate" : ""}`;
    card.dataset.bookingId = booking.id;

    const content = document.createElement("div");
    const tags = document.createElement("div");
    const clientName = document.createElement("strong");
    const service = document.createElement("span");
    const meta = document.createElement("small");
    const serviceName = serviceNameById(booking.service_id) || (booking.service_id ? "Servicio seleccionado" : "Servicio por confirmar");

    tags.className = "booking-request-tags";
    tags.innerHTML = `<span class="status warn">Por aprobar</span>${isDuplicate ? '<span class="status danger">Posible duplicado</span>' : ""}<span class="booking-request-age">${escapeHtml(timeAgo(booking.created_at))}</span>`;
    clientName.textContent = booking.client_name;
    service.textContent = serviceName;
    meta.textContent = `${booking.client_phone} · ${formatScheduleDate(booking.preferred_date)} · ${String(booking.preferred_time || "").slice(0, 5)}`;
    content.append(tags, clientName, service, meta);

    const actions = document.createElement("div");
    actions.className = "booking-request-actions";

    const approveButton = document.createElement("button");
    approveButton.type = "button";
    approveButton.dataset.bookingAction = "approved";
    approveButton.textContent = "Aprobar";

    const rejectButton = document.createElement("button");
    rejectButton.type = "button";
    rejectButton.dataset.bookingAction = "rejected";
    rejectButton.textContent = "Rechazar";

    const calendarButton = document.createElement("button");
    calendarButton.type = "button";
    calendarButton.dataset.bookingCalendar = booking.preferred_date;
    calendarButton.textContent = "Ver en calendario";

    actions.append(approveButton, rejectButton, calendarButton);
    card.append(content, actions);

    bookingRequestList.append(card);
  });
}

async function getCurrentProfile() {
  if (!supabase || !currentSession?.user?.id) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, active")
    .eq("id", currentSession.user.id)
    .maybeSingle();

  if (error) {
    console.error("Profile check failed", error);
    return null;
  }

  return data;
}

function showBookingRequestError(message) {
  if (!bookingRequestList) return;
  bookingRequestList.insertAdjacentHTML(
    "afterbegin",
    `<p class="form-message" data-tone="error">${escapeHtml(message)}</p>`
  );
}

function bookingStartDate(booking) {
  const time = String(booking.preferred_time || "").slice(0, 5);
  return new Date(`${booking.preferred_date}T${time || "00:00"}`);
}

async function findOrCreateClient(booking) {
  const phone = String(booking.client_phone || "").trim();
  const { data: existingClients, error: findError } = await supabase
    .from("clients")
    .select("id")
    .eq("phone", phone)
    .limit(1);

  if (findError) throw findError;
  if (existingClients?.[0]?.id) return existingClients[0].id;

  const { data: client, error: createError } = await supabase
    .from("clients")
    .insert({
      full_name: String(booking.client_name || "").trim(),
      phone,
      email: booking.client_email || null
    })
    .select("id")
    .single();

  if (createError) throw createError;
  return client.id;
}

function renderAppointmentServiceOptions(services) {
  if (!appointmentServiceSelect) return;
  const selectedValue = appointmentServiceSelect.value;
  appointmentServiceSelect.innerHTML = '<option value="">Seleccionar servicio</option>';

  services.forEach((service) => {
    const option = document.createElement("option");
    option.value = service.id;
    option.textContent = `${service.name} · C$ ${money(service.base_price)} · ${service.duration_minutes} min`;
    appointmentServiceSelect.append(option);
  });

  if (selectedValue) appointmentServiceSelect.value = selectedValue;
}

async function loadAppointmentServices() {
  if (!supabase || !currentSession || !appointmentServiceSelect) return;
  if (appointmentServices.length) {
    renderAppointmentServiceOptions(appointmentServices);
    return;
  }

  const { data, error } = await supabase
    .from("services")
    .select("id, name, base_price, duration_minutes")
    .eq("active", true)
    .order("name");

  if (error) {
    setMessage(appointmentMessage, "No pudimos cargar servicios para agendar.", "error");
    return;
  }

  appointmentServices = data || [];
  renderAppointmentServiceOptions(appointmentServices);
}

function selectedAppointmentService() {
  return appointmentServices.find((service) => service.id === appointmentServiceSelect?.value);
}

function renderAppointmentEmployeeOptions(employees) {
  if (!appointmentEmployeeSelect) return;
  const selectedValue = appointmentEmployeeSelect.value;
  appointmentEmployeeSelect.innerHTML = '<option value="">Sin asignar</option>';

  employees.forEach((employee) => {
    const option = document.createElement("option");
    option.value = employee.id;
    option.textContent = employee.specialty ? `${employee.full_name} · ${employee.specialty}` : employee.full_name;
    appointmentEmployeeSelect.append(option);
  });

  if (selectedValue) appointmentEmployeeSelect.value = selectedValue;
}

function renderScheduleEmployeeFilter(employees) {
  if (!scheduleEmployeeFilter) return;
  const selectedValue = scheduleEmployeeFilter.value;
  scheduleEmployeeFilter.innerHTML = '<option value="">Todas las especialistas</option>';

  employees.forEach((employee) => {
    const option = document.createElement("option");
    option.value = employee.id;
    option.textContent = employee.full_name;
    scheduleEmployeeFilter.append(option);
  });

  if (selectedValue) scheduleEmployeeFilter.value = selectedValue;
}

async function loadAppointmentEmployees() {
  if (!supabase || !currentSession || !appointmentEmployeeSelect) return;
  if (appointmentEmployees.length) {
    renderAppointmentEmployeeOptions(appointmentEmployees);
    renderScheduleEmployeeFilter(appointmentEmployees);
    return;
  }

  const { data, error } = await supabase
    .from("employees")
    .select("id, full_name, specialty")
    .eq("active", true)
    .order("full_name");

  if (error) {
    setMessage(appointmentMessage, "No pudimos cargar especialistas para agendar.", "error");
    return;
  }

  appointmentEmployees = data || [];
  renderAppointmentEmployeeOptions(appointmentEmployees);
  renderScheduleEmployeeFilter(appointmentEmployees);

  if (!appointmentEmployees.length) {
    setMessage(appointmentMessage, "No hay especialistas activos en Supabase. Crea empleados activos para asignarlos a citas.", "warning");
  }
}

async function saveAppointment(event) {
  event.preventDefault();
  if (!supabase || !currentSession || !appointmentForm) return;
  if (!appointmentForm.reportValidity()) return;

  const service = selectedAppointmentService();
  if (!service) {
    setMessage(appointmentMessage, "Selecciona un servicio activo para crear la cita.", "warning");
    return;
  }

  const formData = new FormData(appointmentForm);
  const appointmentId = String(formData.get("id") || "");
  const date = String(formData.get("appointment_date") || "");
  const time = String(formData.get("appointment_time") || "");
  const startsAt = new Date(`${date}T${time || "00:00"}`);
  const durationMinutes = Number(service.duration_minutes || 60);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
  const clientPayload = {
    client_name: String(formData.get("client_name") || "").trim(),
    client_phone: String(formData.get("client_phone") || "").trim()
  };

  if (!clientPayload.client_name || !clientPayload.client_phone || Number.isNaN(startsAt.getTime())) {
    setMessage(appointmentMessage, "Completa cliente, teléfono, fecha y hora.", "warning");
    return;
  }

  setBusy(appointmentForm, true);
  setMessage(appointmentMessage, appointmentId ? "Actualizando cita..." : "Guardando cita...", "");

  try {
    const clientId = await findOrCreateClient(clientPayload);
    const appointmentPayload = {
      client_id: clientId,
      employee_id: String(formData.get("employee_id") || "") || null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      notes: String(formData.get("notes") || "").trim() || null
    };

    const request = appointmentId
      ? supabase.from("appointments").update(appointmentPayload).eq("id", appointmentId).select("id").single()
      : supabase.from("appointments").insert({ ...appointmentPayload, status: "confirmed" }).select("id").single();

    const { data: appointment, error: appointmentError } = await request;

    if (appointmentError) throw appointmentError;

    if (appointmentId) {
      const { error: deleteServiceError } = await supabase
        .from("appointment_services")
        .delete()
        .eq("appointment_id", appointment.id);
      if (deleteServiceError) throw deleteServiceError;
    }

    const { error: serviceError } = await supabase.from("appointment_services").insert({
      appointment_id: appointment.id,
      service_id: service.id,
      price: Number(service.base_price || 0),
      duration_minutes: durationMinutes
    });

    if (serviceError && !appointmentId) {
      await supabase.from("appointments").delete().eq("id", appointment.id);
      throw serviceError;
    }
    if (serviceError) throw serviceError;

    selectedScheduleDate = date;
    resetAppointmentForm();
    closeDrawer();
    toast(appointmentId ? "Cita actualizada." : "Cita guardada.");
    loadAppointments();
    onAgendaChanged();
  } catch (error) {
    console.error("Manual appointment failed", error);
    setBusy(appointmentForm, false);
    setMessage(appointmentMessage, "No pudimos guardar la cita. Revisa permisos y datos.", "error");
  }
}

async function approveBookingRequest(bookingId) {
  const { data: booking, error: bookingError } = await supabase
    .from("public_bookings")
    .select("id, service_id, client_name, client_phone, client_email, preferred_date, preferred_time, notes")
    .eq("id", bookingId)
    .eq("status", "pending")
    .single();

  if (bookingError || !booking) throw bookingError || new Error("Booking not found");
  if (!booking.service_id) throw new Error("Booking missing service");

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, base_price, duration_minutes")
    .eq("id", booking.service_id)
    .single();

  if (serviceError || !service) throw serviceError || new Error("Service not found");

  const clientId = await findOrCreateClient(booking);
  const startsAt = bookingStartDate(booking);
  const durationMinutes = Number(service.duration_minutes || 60);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      client_id: clientId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "confirmed",
      notes: booking.notes || "Creada desde reserva online aprobada."
    })
    .select("id")
    .single();

  if (appointmentError) throw appointmentError;

  const { error: appointmentServiceError } = await supabase.from("appointment_services").insert({
    appointment_id: appointment.id,
    service_id: booking.service_id,
    price: Number(service.base_price || 0),
    duration_minutes: durationMinutes
  });

  if (appointmentServiceError) {
    await supabase.from("appointments").delete().eq("id", appointment.id);
    throw appointmentServiceError;
  }

  const { error: updateError } = await supabase
    .from("public_bookings")
    .update({ status: "approved" })
    .eq("id", bookingId);

  if (updateError) throw updateError;
}

async function loadBookingRequests() {
  if (!bookingRequestList) return;

  if (!supabase) {
    bookingRequestList.innerHTML = '<p class="muted">Configura Supabase para cargar reservas online.</p>';
    return;
  }

  if (!currentSession) {
    bookingRequestList.innerHTML = '<p class="muted">Inicia sesion para ver solicitudes online.</p>';
    return;
  }

  bookingRequestList.innerHTML = '<p class="muted">Cargando solicitudes...</p>';

  const profile = await getCurrentProfile();
  if (!profile?.active || !["admin", "reception"].includes(profile.role)) {
    bookingRequestList.innerHTML = '<p class="form-message" data-tone="error">Tu usuario no tiene perfil administrativo activo en Supabase. RLS oculta las reservas pendientes.</p>';
    return;
  }

  const { data, error } = await supabase
    .from("public_bookings")
    .select("id, service_id, client_name, client_phone, preferred_date, preferred_time, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Booking requests failed to load", error);
    bookingRequestList.innerHTML = '<p class="form-message" data-tone="error">No pudimos cargar las reservas online.</p>';
    return;
  }

  await loadAppointmentServices();
  renderBookingRequests(data || []);
  setPendingRequestCount(uniquePendingBookings(data || []).length);
}

async function updateBookingStatus(bookingId, status) {
  if (!supabase || !bookingId) return false;

  if (status === "approved") {
    try {
      await approveBookingRequest(bookingId);
      loadBookingRequests();
      onAgendaChanged();
      return true;
    } catch (error) {
      console.error("Booking approval failed", error);
      showBookingRequestError("No pudimos aprobar la solicitud y crear la cita. Revisa servicio, cliente y permisos.");
      return false;
    }
  }

  const { error } = await supabase
    .from("public_bookings")
    .update({ status })
    .eq("id", bookingId);

  if (error) {
    showBookingRequestError("No pudimos actualizar la solicitud.");
    return false;
  }

  loadBookingRequests();
  onAgendaChanged();
  return true;
}

let citasSummarySeq = 0;

// The Citas summary reads unfiltered data so agenda filters never hide totals.
async function loadCitasSummary() {
  if (!scheduleSummary) return;
  if (!supabase || !currentSession) {
    markSignedOut(scheduleSummary);
    return;
  }
  const seq = ++citasSummarySeq;
  const today = localDateValue();
  const todayRange = dateRangeForDay(today);
  const dayRange = dateRangeForDay(selectedScheduleDate);
  const [todayResult, dayResult] = await Promise.all([
    supabase.from("appointments").select("id, status").gte("starts_at", todayRange.start).lt("starts_at", todayRange.end),
    selectedScheduleDate === today
      ? null
      : supabase.from("appointments").select("id, status").gte("starts_at", dayRange.start).lt("starts_at", dayRange.end),
    refreshPendingRequests()
  ]);
  if (seq !== citasSummarySeq) return;
  const error = todayResult.error || dayResult?.error;
  if (error) {
    console.error("Citas summary failed", error);
    return;
  }
  const todayAppointments = todayResult.data || [];
  const dayAppointments = dayResult ? dayResult.data || [] : todayAppointments;
  const scheduledToday = todayAppointments.filter((item) => !["cancelled", "no_show"].includes(item.status)).length;
  const confirmed = dayAppointments.filter((item) => item.status === "confirmed").length;
  const cancelled = dayAppointments.filter((item) => item.status === "cancelled").length;
  const dayLabel = selectedScheduleDate === today ? "Hoy" : formatScheduleDate(selectedScheduleDate);

  scheduleSummary.innerHTML = `
    <article data-tone="warning"><span>Solicitudes pendientes</span><strong>${pendingRequestCount}</strong><small>${pendingRequestCount ? '<a class="summary-link" href="#online-bookings-panel">Revisar solicitudes</a>' : "Sin solicitudes por aprobar"}</small></article>
    <article><span>Citas de hoy</span><strong>${scheduledToday}</strong><small>Programadas, sin canceladas</small></article>
    <article><span>Confirmadas</span><strong>${confirmed}</strong><small>${escapeHtml(dayLabel)}</small></article>
    <article><span>Canceladas</span><strong>${cancelled}</strong><small>${escapeHtml(dayLabel)}</small></article>
  `;
}

function appointmentService(appointment) {
  return appointment.appointment_services?.[0];
}

function renderAppointmentActions(appointment) {
  const actions = {
    pending: [
      ["confirmed", "Confirmar", "action-primary"],
      ["cancelled", "Cancelar", ""]
    ],
    confirmed: [
      ["in_progress", "Iniciar", "action-primary"],
      ["cancelled", "Cancelar", ""]
    ],
    in_progress: [["completed", "Completar", "action-primary"]],
    completed: [],
    cancelled: [],
    no_show: []
  };

  return (actions[appointment.status] || [])
    .map(([status, label, className]) => `<button type="button" class="${className}" data-appointment-status="${status}">${label}</button>`)
    .concat('<button type="button" data-appointment-detail>Detalle</button>')
    .concat('<button type="button" data-appointment-edit>Editar</button>')
    .join("");
}

function renderAppointmentDetail(appointment, sales) {
  if (!appointmentDetail) return;
  const service = appointmentService(appointment);
  const status = appointmentStatusMeta(appointment.status);
  const startsAt = `${formatScheduleDate(appointment.starts_at.slice(0, 10))} · ${formatTime(appointment.starts_at)}`;
  const sale = sales?.[0];
  const payments = sale?.payments || [];
  const paid = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const servicePrice = Number(service?.price || 0);
  const total = Number(sale?.total || servicePrice || 0);
  const balance = Math.max(total - paid, 0);
  const suggestedPayment = balance || total;

  appointmentDetail.innerHTML = `
    <strong>Detalle de cita</strong>
    <dl>
      <div><dt>Cliente</dt><dd>${escapeHtml(appointment.clients?.full_name || "Cliente sin nombre")}</dd></div>
      <div><dt>Contacto</dt><dd>${escapeHtml(appointment.clients?.phone || "Sin teléfono")}</dd></div>
      <div><dt>Servicio</dt><dd>${escapeHtml(service?.services?.name || "Servicio por confirmar")}</dd></div>
      <div><dt>Especialista</dt><dd>${escapeHtml(appointment.employees?.full_name || "Sin asignar")}</dd></div>
      <div><dt>Horario</dt><dd>${escapeHtml(startsAt)}</dd></div>
      <div><dt>Estado</dt><dd><span class="status ${status.className}">${status.label}</span></dd></div>
      <div><dt>Notas</dt><dd>${escapeHtml(appointment.notes || "Sin notas")}</dd></div>
    </dl>
    <strong>Pagos</strong>
    ${sale ? `
      <dl>
        <div><dt>Venta</dt><dd>${escapeHtml(sale.invoice_number || sale.id.slice(0, 8))}</dd></div>
        <div><dt>Total</dt><dd>C$ ${money(total)}</dd></div>
        <div><dt>Pagado</dt><dd>C$ ${money(paid)}</dd></div>
        <div><dt>Saldo</dt><dd>C$ ${money(balance)}</dd></div>
      </dl>
      <div class="payment-list">
        ${payments.length ? payments.map((payment) => `
          <div><span>${escapeHtml(payment.method)}${payment.reference ? ` · ${escapeHtml(payment.reference)}` : ""}</span><strong>C$ ${money(payment.amount)}</strong></div>
        `).join("") : "<p>No hay pagos registrados para esta venta.</p>"}
      </div>
    ` : "<p>No hay venta ni pagos asociados a esta cita.</p>"}
    <form class="payment-form" data-payment-appointment-id="${escapeHtml(appointment.id)}">
      <strong>Registrar pago</strong>
      <label>Método<select class="select" name="method" required><option value="cash">Efectivo</option><option value="transfer">Transferencia</option><option value="card">Tarjeta</option><option value="mixed">Mixto</option></select></label>
      <label>Monto<input name="amount" type="number" min="0.01" step="0.01" value="${suggestedPayment || ""}" required></label>
      <label>Referencia<input name="reference" type="text" maxlength="80" placeholder="N° transferencia, lote o nota"></label>
      <button class="primary-button" type="submit">Registrar pago</button>
      <p class="form-message" role="status"></p>
    </form>
  `;
}

async function loadAppointmentDetail(appointmentId) {
  if (!appointmentDetail) return;
  const appointment = currentAppointments.find((item) => item.id === appointmentId);
  if (!appointment) return;

  currentAppointmentDetailId = appointmentId;
  appointmentDetail.innerHTML = '<p>Cargando detalle de cita...</p>';
  const { data, error } = await supabase
    .from("sales")
    .select("id, invoice_number, subtotal, discount, total, status, created_at, payments(method, amount, reference, paid_at)")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Appointment detail failed", error);
    appointmentDetail.innerHTML = '<p class="form-message" data-tone="error">No pudimos cargar pagos asociados.</p>';
    return;
  }

  renderAppointmentDetail(appointment, data || []);
}

async function ensureAppointmentSale(appointment) {
  const service = appointmentService(appointment);
  const servicePrice = Number(service?.price || 0);
  const { data: sales, error: findError } = await supabase
    .from("sales")
    .select("id, total, payments(amount)")
    .eq("appointment_id", appointment.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (findError) throw findError;
  if (sales?.[0]) return sales[0];

  const { data: sale, error: createError } = await supabase
    .from("sales")
    .insert({
      client_id: appointment.client_id,
      appointment_id: appointment.id,
      subtotal: servicePrice,
      total: servicePrice,
      status: "pending"
    })
    .select("id, total, payments(amount)")
    .single();

  if (createError) throw createError;
  return sale;
}

async function registerAppointmentPayment(event) {
  event.preventDefault();
  const form = event.target;
  const appointmentId = form.dataset.paymentAppointmentId;
  const appointment = currentAppointments.find((item) => item.id === appointmentId);
  const message = form.querySelector(".form-message");
  if (!appointment) return;

  const formData = new FormData(form);
  const amount = Number(formData.get("amount") || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    setMessage(message, "Escribe un monto válido.", "warning");
    return;
  }

  setBusy(form, true);
  setMessage(message, "Registrando pago...", "");

  try {
    const sale = await ensureAppointmentSale(appointment);
    const { error: paymentError } = await supabase.from("payments").insert({
      sale_id: sale.id,
      method: String(formData.get("method") || "cash"),
      amount,
      reference: String(formData.get("reference") || "").trim() || null
    });

    if (paymentError) throw paymentError;

    const previousPaid = (sale.payments || []).reduce((total, payment) => total + Number(payment.amount || 0), 0);
    const totalPaid = previousPaid + amount;
    const total = Number(sale.total || 0);
    const status = totalPaid >= total ? "paid" : "partial";
    const { error: saleError } = await supabase.from("sales").update({ status }).eq("id", sale.id);
    if (saleError) throw saleError;

    await loadAppointmentDetail(appointmentId);
  } catch (error) {
    console.error("Payment registration failed", error);
    setBusy(form, false);
    setMessage(message, "No pudimos registrar el pago.", "error");
  }
}

async function editAppointment(appointmentId) {
  const appointment = currentAppointments.find((item) => item.id === appointmentId)
    || calendarState.items.find((item) => item.kind === "appointment" && item.id === appointmentId)?.raw;
  if (!appointment || !appointmentForm) return;

  await loadAppointmentServices();
  await loadAppointmentEmployees();
  const service = appointmentService(appointment);
  const startsAt = new Date(appointment.starts_at);
  const id = appointmentForm.querySelector('[name="id"]');

  if (id) id.value = appointment.id;
  appointmentForm.elements.client_name.value = appointment.clients?.full_name || "";
  appointmentForm.elements.client_phone.value = appointment.clients?.phone || "";
  appointmentForm.elements.service_id.value = service?.service_id || "";
  appointmentForm.elements.employee_id.value = appointment.employee_id || "";
  appointmentForm.elements.appointment_date.value = localDateValue(startsAt);
  appointmentForm.elements.appointment_time.value = startsAt.toTimeString().slice(0, 5);
  appointmentForm.elements.notes.value = appointment.notes || "";
  if (appointmentSubmitButton) appointmentSubmitButton.textContent = "Actualizar cita";
  setMessage(appointmentMessage, "");
  openDrawer(appointmentForm, "client_name");
}

function renderAppointments(appointments) {
  if (!scheduleList) return;

  if (scheduleDateLabel) scheduleDateLabel.textContent = formatScheduleDate(selectedScheduleDate);
  if (scheduleDateMeta) scheduleDateMeta.textContent = `${appointments.length} citas registradas`;

  if (!appointments.length) {
    scheduleList.innerHTML = `
      <article class="empty-state">
        <strong>No hay citas para este día</strong>
        <p>Las reservas aprobadas y las citas creadas aparecerán aquí.</p>
      </article>
    `;
    return;
  }

  currentAppointments = appointments;
  scheduleList.innerHTML = "";
  appointments.forEach((appointment) => {
    const status = appointmentStatusMeta(appointment.status);
    const service = appointmentService(appointment);
    const clientName = appointment.clients?.full_name || "Cliente sin nombre";
    const employeeName = appointment.employees?.full_name || "Especialista por asignar";
    const serviceName = service?.services?.name || "Servicio por confirmar";
    const duration = service?.duration_minutes ? `${service.duration_minutes} min` : "Duración pendiente";
    const note = appointment.notes || appointment.clients?.phone || "Sin notas internas";

    const item = document.createElement("div");
    item.className = `schedule-item ${status.itemClass}`;
    item.dataset.appointmentId = appointment.id;
    item.innerHTML = `
      <time>${formatTime(appointment.starts_at)}</time>
      <div class="schedule-card">
        <div>
          <strong>${escapeHtml(clientName)}</strong>
          <span>${escapeHtml(serviceName)} · ${escapeHtml(employeeName)} · ${escapeHtml(duration)}</span>
          <small>${escapeHtml(note)}</small>
        </div>
        <span class="status ${status.className}">${status.label}</span>
        <div class="schedule-actions">
          ${renderAppointmentActions(appointment)}
        </div>
      </div>
    `;
    scheduleList.append(item);
  });
}

async function loadAppointments() {
  if (!scheduleList) return;
  if (!supabase) {
    scheduleList.innerHTML = '<p class="muted">Configura Supabase para cargar citas reales.</p>';
    if (scheduleDateMeta) scheduleDateMeta.textContent = "Sin conexión";
    return;
  }
  if (!currentSession) {
    scheduleList.innerHTML = '<p class="muted">Inicia sesión para cargar la agenda real.</p>';
    markSignedOut(scheduleSummary);
    if (scheduleDateMeta) scheduleDateMeta.textContent = "Sin sesión";
    return;
  }
  if (appointmentsLoading) return;

  loadCitasSummary();
  appointmentsLoading = true;
  renderLoadingState(scheduleList, "Cargando agenda...");
  if (scheduleDateLabel) scheduleDateLabel.textContent = formatScheduleDate(selectedScheduleDate);
  if (scheduleDateMeta) scheduleDateMeta.textContent = "Cargando citas reales";

  const start = new Date(`${selectedScheduleDate}T00:00:00`).toISOString();
  const end = new Date(`${addDays(selectedScheduleDate, 1)}T00:00:00`).toISOString();
  let query = supabase
    .from("appointments")
    .select("id, client_id, employee_id, starts_at, ends_at, status, notes, clients(full_name, phone), employees(full_name), appointment_services(service_id, price, duration_minutes, services(name))")
    .gte("starts_at", start)
    .lt("starts_at", end);

  if (scheduleEmployeeFilter?.value) {
    query = query.eq("employee_id", scheduleEmployeeFilter.value);
  }

  if (scheduleStatusFilter?.value) {
    query = query.eq("status", scheduleStatusFilter.value);
  }

  const { data, error } = await query.order("starts_at", { ascending: true });

  appointmentsLoading = false;
  if (error) {
    scheduleList.innerHTML = '<p class="form-message" data-tone="error">No pudimos cargar la agenda real.</p>';
    return;
  }

  renderAppointments(data || []);
}

async function updateAppointmentStatus(appointmentId, status) {
  if (!supabase || !appointmentId) return false;
  const { error } = await supabase.from("appointments").update({ status }).eq("id", appointmentId);
  if (error) {
    scheduleList?.insertAdjacentHTML("afterbegin", '<p class="form-message" data-tone="error">No pudimos actualizar la cita.</p>');
    return false;
  }
  loadAppointments();
  onAgendaChanged();
  return true;
}

function paymentMethodLabel(method) {
  const labels = {
    cash: "Efectivo",
    transfer: "Transferencia",
    card: "Tarjeta",
    mixed: "Mixto"
  };
  return labels[method] || method || "Pago";
}

function saleStatusMeta(status) {
  const statuses = {
    paid: { label: "Pagada", className: "ok" },
    partial: { label: "Parcial", className: "warn" },
    pending: { label: "Pendiente", className: "danger" },
    refunded: { label: "Reembolsada", className: "warn" },
    cancelled: { label: "Cancelada", className: "danger" }
  };
  return statuses[status] || statuses.pending;
}

function renderSalesSummary(payments) {
  if (!salesSummaryGrid || !salesCommand) return;
  const total = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const byMethod = payments.reduce((totals, payment) => {
    totals[payment.method] = (totals[payment.method] || 0) + Number(payment.amount || 0);
    return totals;
  }, {});
  const missingTransferRefs = payments.filter((payment) => payment.method === "transfer" && !payment.reference).length;

  salesSummaryGrid.innerHTML = `
    <article class="receipt-total"><span>Total cobrado</span><strong>C$ ${money(total)}</strong><small>${payments.length} pagos registrados hoy</small></article>
    <article><span>Efectivo</span><strong>C$ ${money(byMethod.cash || 0)}</strong><small>Disponible en caja</small></article>
    <article><span>Transferencia</span><strong>C$ ${money(byMethod.transfer || 0)}</strong><small>${missingTransferRefs} sin referencia</small></article>
    <article><span>Tarjeta</span><strong>C$ ${money(byMethod.card || 0)}</strong><small>Lote abierto</small></article>
  `;

  salesCommand.innerHTML = `
    <div><strong>Corte pendiente</strong><span>${missingTransferRefs ? `${missingTransferRefs} transferencias necesitan referencia.` : "Sin transferencias pendientes de referencia."}</span></div>
    <div><strong>Caja esperada</strong><span>C$ ${money(total)} registrados hoy.</span></div>
    <div><strong>Siguiente acción</strong><span>${payments.length ? "Revisar pagos parciales antes del cierre." : "Registrar pagos desde el detalle de citas."}</span></div>
  `;

  renderCashCloseChecklist(payments, { total, byMethod, missingTransferRefs });
}

function renderCashCloseChecklist(payments, summary) {
  if (!cashCloseChecklist) return;
  const partialSales = payments.filter((payment) => payment.sales?.status === "partial").length;
  const cashTotal = summary.byMethod.cash || 0;

  cashCloseChecklist.innerHTML = `
    <label><input type="checkbox" ${summary.missingTransferRefs ? "" : "checked"}> ${summary.missingTransferRefs ? `${summary.missingTransferRefs} transferencias sin referencia` : "Referencias bancarias validadas"}</label>
    <label><input type="checkbox"> Confirmar efectivo físico: C$ ${money(cashTotal)}</label>
    <label><input type="checkbox" ${partialSales ? "" : "checked"}> ${partialSales ? `${partialSales} ventas parciales por revisar` : "Sin ventas parciales pendientes"}</label>
    <label><input type="checkbox" ${payments.length ? "" : "disabled"}> Exportar ${payments.length} pagos del día</label>
  `;
}

function renderSalesPayments(payments) {
  if (!salesPaymentList) return;
  if (!payments.length) {
    salesPaymentList.innerHTML = '<tr><td colspan="7">No hay pagos registrados hoy.</td></tr>';
    return;
  }

  salesPaymentList.innerHTML = payments.map((payment) => {
    const sale = payment.sales || {};
    const status = saleStatusMeta(sale.status);
    const client = sale.clients?.full_name || "Cliente sin asignar";
    const invoice = sale.invoice_number || (sale.id ? sale.id.slice(0, 8) : "Sin venta");
    return `
      <tr>
        <td>${escapeHtml(invoice)}</td>
        <td>${escapeHtml(client)}</td>
        <td>${escapeHtml(paymentMethodLabel(payment.method))}</td>
        <td>${escapeHtml(formatTime(payment.paid_at))}</td>
        <td><span class="status ${status.className}">${status.label}</span></td>
        <td>C$ ${money(payment.amount)}</td>
        <td>${payment.reference ? escapeHtml(payment.reference) : "Sin referencia"}</td>
      </tr>
    `;
  }).join("");
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function exportSalesCsv() {
  if (!currentSalesPayments.length) return;
  const rows = [
    ["Factura", "Cliente", "Metodo", "Hora", "Estado", "Monto", "Referencia"],
    ...currentSalesPayments.map((payment) => {
      const sale = payment.sales || {};
      const status = saleStatusMeta(sale.status);
      return [
        sale.invoice_number || (sale.id ? sale.id.slice(0, 8) : "Sin venta"),
        sale.clients?.full_name || "Cliente sin asignar",
        paymentMethodLabel(payment.method),
        formatTime(payment.paid_at),
        status.label,
        Number(payment.amount || 0),
        payment.reference || ""
      ];
    })
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cierre-caja-${localDateValue()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function clientStats(client) {
  const appointments = client.appointments || [];
  const sales = client.sales || [];
  const total = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const latestAppointment = appointments
    .map((appointment) => appointment.starts_at)
    .filter(Boolean)
    .sort()
    .at(-1);
  const preferredService = appointments
    .map((appointment) => appointment.appointment_services?.[0]?.services?.name)
    .filter(Boolean)
    .at(-1) || client.preferences || "Sin preferencia";
  const status = client.allergies || client.internal_notes ? "Seguimiento" : appointments.length >= 3 ? "Frecuente" : "Activa";
  return { appointments, sales, total, latestAppointment, preferredService, status };
}

function renderClientSummary(clients) {
  if (!clientSummaryGrid) return;
  const frequent = clients.filter((client) => clientStats(client).appointments.length >= 3).length;
  const followUp = clients.filter((client) => client.allergies || client.internal_notes).length;
  clientSummaryGrid.innerHTML = `
    <article><span>Clientes</span><strong>${clients.length}</strong><small>Registros activos</small></article>
    <article><span>Frecuentes</span><strong>${frequent}</strong><small>3+ citas registradas</small></article>
    <article><span>Seguimiento</span><strong>${followUp}</strong><small>Con notas o alergias</small></article>
  `;
}

function renderClients(clients) {
  if (!clientTableBody) return;
  const query = clientSearch?.value.trim().toLowerCase() || "";
  const filtered = clients.filter((client) => {
    const haystack = `${client.full_name} ${client.phone} ${client.preferences || ""} ${client.allergies || ""}`.toLowerCase();
    return haystack.includes(query);
  });

  if (!filtered.length) {
    clientTableBody.innerHTML = '<tr><td colspan="7">No hay clientes que coincidan.</td></tr>';
    return;
  }

  clientTableBody.innerHTML = filtered.map((client) => {
    const stats = clientStats(client);
    const statusClass = stats.status === "Seguimiento" ? "warn" : stats.status === "Frecuente" ? "ok" : "";
    return `
      <tr data-client-id="${escapeHtml(client.id)}">
        <td><strong>${escapeHtml(client.full_name)}</strong><small>${escapeHtml(client.preferences || client.allergies || "Sin notas")}</small></td>
        <td>${escapeHtml(client.phone)}</td>
        <td>${stats.latestAppointment ? escapeHtml(stats.latestAppointment.slice(0, 10)) : "Sin citas"}</td>
        <td>${escapeHtml(stats.preferredService)}</td>
        <td><span class="status ${statusClass}">${stats.status}</span></td>
        <td>C$ ${money(stats.total)}</td>
        <td><button class="text-button" type="button" data-client-profile>Ver perfil</button> <button class="text-button" type="button" data-client-edit-row>Editar</button></td>
      </tr>
    `;
  }).join("");
}

function renderClientProfile(client) {
  if (!clientProfileCard) return;
  const stats = clientStats(client);
  const nextAction = client.allergies
    ? `Revisar alergias: ${client.allergies}`
    : client.internal_notes || "Sin acción pendiente";
  clientProfileCard.innerHTML = `
    <h2>${escapeHtml(client.full_name)}</h2>
    <p class="muted">${escapeHtml(stats.status)} · ${escapeHtml(stats.preferredService)}</p>
    <dl>
      <div><dt>Teléfono</dt><dd>${escapeHtml(client.phone)}</dd></div>
      <div><dt>Última visita</dt><dd>${stats.latestAppointment ? escapeHtml(stats.latestAppointment.slice(0, 10)) : "Sin citas"}</dd></div>
      <div><dt>Citas</dt><dd>${stats.appointments.length}</dd></div>
      <div><dt>Total histórico</dt><dd>C$ ${money(stats.total)}</dd></div>
      <div><dt>Próxima acción</dt><dd>${escapeHtml(nextAction)}</dd></div>
    </dl>
    <div class="client-profile-actions">
      <button class="primary-button" type="button" data-client-fill="${escapeHtml(client.id)}">Agendar cita</button>
      <button class="quiet-button" type="button" data-client-edit="${escapeHtml(client.id)}">Editar cliente</button>
    </div>
  `;
}

function fillClientForm(client) {
  if (!clientForm || !client) return;
  clientForm.elements.id.value = client.id;
  clientForm.elements.full_name.value = client.full_name || "";
  clientForm.elements.phone.value = client.phone || "";
  clientForm.elements.email.value = client.email || "";
  clientForm.elements.preferences.value = client.preferences || "";
  clientForm.elements.allergies.value = client.allergies || "";
  clientForm.elements.internal_notes.value = client.internal_notes || "";
  if (clientSubmitButton) clientSubmitButton.textContent = "Actualizar cliente";
  setMessage(clientMessage, "");
  openDrawer(clientForm, "full_name");
}

async function saveClient(event) {
  event.preventDefault();
  if (!supabase || !currentSession || !clientForm) return;
  if (!clientForm.reportValidity()) return;

  const formData = new FormData(clientForm);
  const id = String(formData.get("id") || "");
  const payload = {
    full_name: String(formData.get("full_name") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    email: String(formData.get("email") || "").trim() || null,
    preferences: String(formData.get("preferences") || "").trim() || null,
    allergies: String(formData.get("allergies") || "").trim() || null,
    internal_notes: String(formData.get("internal_notes") || "").trim() || null
  };

  if (!payload.full_name || !payload.phone) {
    setMessage(clientMessage, "Nombre y teléfono son obligatorios.", "warning");
    return;
  }

  setBusy(clientForm, true);
  setMessage(clientMessage, id ? "Actualizando cliente..." : "Creando cliente...", "");

  const request = id
    ? supabase.from("clients").update(payload).eq("id", id)
    : supabase.from("clients").insert(payload);
  const { error } = await request;

  if (error) {
    console.error("Client save failed", error);
    setBusy(clientForm, false);
    setMessage(clientMessage, "No pudimos guardar el cliente.", "error");
    return;
  }

  resetClientForm();
  closeDrawer();
  toast(id ? "Cliente actualizado." : "Cliente creado.");
  loadClients();
}

async function loadClients() {
  if (!clientTableBody) return;
  if (!supabase || !currentSession) {
    clientTableBody.innerHTML = '<tr><td colspan="7">Inicia sesión para cargar clientes reales.</td></tr>';
    markSignedOut(clientSummaryGrid);
    return;
  }

  clientTableBody.innerHTML = '<tr><td colspan="7">Cargando clientes reales...</td></tr>';
  const { data, error } = await supabase
    .from("clients")
    .select("id, full_name, phone, email, preferences, allergies, internal_notes, created_at, appointments(id, starts_at, status, appointment_services(services(name))), sales(id, total, status, created_at)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Clients failed to load", error);
    clientTableBody.innerHTML = '<tr><td colspan="7">No pudimos cargar clientes reales.</td></tr>';
    return;
  }

  currentClients = data || [];
  renderClientSummary(currentClients);
  renderClients(currentClients);
  if (currentClients[0]) renderClientProfile(currentClients[0]);
}

function renderEmployeeSummary(employees) {
  if (!teamSummaryGrid) return;
  const activeEmployees = employees.filter((employee) => employee.active);
  const averageCommission = activeEmployees.length
    ? activeEmployees.reduce((total, employee) => total + Number(employee.commission_rate || 0), 0) / activeEmployees.length
    : 0;

  teamSummaryGrid.innerHTML = `
    <article><span>Equipo</span><strong>${employees.length}</strong><small>Registros creados</small></article>
    <article><span>Activas</span><strong>${activeEmployees.length}</strong><small>Disponibles para agenda</small></article>
    <article><span>Comisión media</span><strong>${averageCommission.toFixed(1)}%</strong><small>Equipo activo</small></article>
  `;
}

function renderEmployees(employees) {
  if (!teamGrid) return;

  if (!employees.length) {
    renderEmptyState(teamGrid, "No hay empleadas registradas", "Crea el equipo para asignar especialistas a la agenda.", "Agregar empleada", "empleados");
    return;
  }

  teamGrid.innerHTML = employees.map((employee, index) => {
    const statusClass = employee.active ? "ok" : "danger";
    const statusLabel = employee.active ? "Activa" : "Inactiva";
    const seed = encodeURIComponent(employee.full_name || `empleada-${index}`);
    return `
      <article class="team-card" data-employee-id="${escapeHtml(employee.id)}">
        <img src="https://picsum.photos/seed/${seed}/160/160" alt="Retrato de ${escapeHtml(employee.full_name)}">
        <div><h3>${escapeHtml(employee.full_name)}</h3><span>${escapeHtml(employee.specialty || "Sin especialidad")}</span></div>
        <strong>${escapeHtml(employee.phone || "Sin teléfono")}</strong>
        <p>Comisión ${Number(employee.commission_rate || 0).toFixed(2)}% · ${employee.active ? "Disponible para citas" : "Oculta en agenda"}</p>
        <div class="admin-record-meta"><span class="status ${statusClass}">${statusLabel}</span><span class="status">ID interno</span></div>
        <div class="team-card-actions">
          <button class="text-button" type="button" data-employee-edit>Editar</button>
          <button class="text-button" type="button" data-employee-toggle>${employee.active ? "Desactivar" : "Activar"}</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderAvailabilityEmployeeOptions(employees) {
  const selects = [workingHoursForm?.elements.employee_id, timeBlockForm?.elements.employee_id].filter(Boolean);
  selects.forEach((select) => {
    const selectedValue = select.value;
    select.innerHTML = '<option value="">Seleccionar</option>';
    employees.filter((employee) => employee.active).forEach((employee) => {
      const option = document.createElement("option");
      option.value = employee.id;
      option.textContent = employee.full_name;
      select.append(option);
    });
    if (selectedValue) select.value = selectedValue;
  });
}

function renderAvailabilityList() {
  if (!availabilityList) return;
  const rows = [];

  currentWorkingHours.forEach((hour) => {
    const employee = currentEmployees.find((item) => item.id === hour.employee_id);
    rows.push({
      id: hour.id,
      table: "employee_working_hours",
      type: "Horario",
      time: `${String(hour.start_time).slice(0, 5)}-${String(hour.end_time).slice(0, 5)}`,
      title: employee?.full_name || "Especialista",
      detail: `${weekdayLabels[Number(hour.weekday)] || "Día"} · ${hour.active ? "Activo" : "Inactivo"}`
    });
  });

  currentTimeBlocks.forEach((block) => {
    const employee = currentEmployees.find((item) => item.id === block.employee_id);
    rows.push({
      id: block.id,
      table: "employee_time_blocks",
      type: "Bloqueo",
      time: `${String(block.start_time).slice(0, 5)}-${String(block.end_time).slice(0, 5)}`,
      title: employee?.full_name || "Especialista",
      detail: `${block.block_date} · ${block.reason || "Sin motivo"}`
    });
  });

  if (!rows.length) {
    availabilityList.innerHTML = '<div><time>--:--</time><strong>Sin disponibilidad configurada</strong><span>Agrega horarios semanales para activar horas públicas.</span></div>';
    return;
  }

  availabilityList.innerHTML = rows.map((row) => `
    <div>
      <time>${escapeHtml(row.time)}</time>
      <strong>${escapeHtml(row.title)}</strong>
      <span>${escapeHtml(row.type)} · ${escapeHtml(row.detail)}</span>
      <button class="text-button" type="button" data-availability-delete="${escapeHtml(row.id)}" data-availability-table="${escapeHtml(row.table)}">Eliminar</button>
    </div>
  `).join("");
}

async function deleteAvailabilityRecord(recordId, tableName) {
  if (!supabase || !currentSession || !recordId || !["employee_working_hours", "employee_time_blocks"].includes(tableName)) return;

  const { error } = await supabase.from(tableName).delete().eq("id", recordId);
  if (error) {
    console.error("Availability delete failed", error);
    setMessage(availabilityMessage, "No pudimos eliminar el registro.", "error");
    return;
  }

  setMessage(availabilityMessage, "Registro eliminado.", "success");
  loadAvailability();
}

async function loadAvailability() {
  if (!supabase || !currentSession || !availabilityList) return;

  const [{ data: hours, error: hoursError }, { data: blocks, error: blocksError }] = await Promise.all([
    supabase.from("employee_working_hours").select("id, employee_id, weekday, start_time, end_time, active").order("weekday").order("start_time"),
    supabase.from("employee_time_blocks").select("id, employee_id, block_date, start_time, end_time, reason").gte("block_date", localDateValue()).order("block_date").order("start_time")
  ]);

  if (hoursError || blocksError) {
    console.error("Availability failed to load", hoursError || blocksError);
    setMessage(availabilityMessage, "Disponibilidad no disponible. Aplica el schema actualizado en Supabase.", "warning");
    renderAvailabilityList();
    return;
  }

  currentWorkingHours = hours || [];
  currentTimeBlocks = blocks || [];
  renderAvailabilityList();
}

async function saveWorkingHours(event) {
  event.preventDefault();
  if (!supabase || !currentSession || !workingHoursForm) return;

  const formData = new FormData(workingHoursForm);
  const payload = {
    employee_id: String(formData.get("employee_id") || ""),
    weekday: Number(formData.get("weekday")),
    start_time: String(formData.get("start_time") || ""),
    end_time: String(formData.get("end_time") || ""),
    active: true
  };

  if (!payload.employee_id || !payload.start_time || !payload.end_time || payload.start_time >= payload.end_time) {
    setMessage(availabilityMessage, "Selecciona especialista y un rango válido.", "warning");
    return;
  }

  setBusy(workingHoursForm, true);
  const { error } = await supabase.from("employee_working_hours").insert(payload);
  setBusy(workingHoursForm, false);

  if (error) {
    console.error("Working hours save failed", error);
    setMessage(availabilityMessage, "No pudimos guardar el horario. Revisa permisos o schema.", "error");
    return;
  }

  setMessage(availabilityMessage, "Horario agregado.", "success");
  loadAvailability();
}

async function saveTimeBlock(event) {
  event.preventDefault();
  if (!supabase || !currentSession || !timeBlockForm) return;

  const formData = new FormData(timeBlockForm);
  const payload = {
    employee_id: String(formData.get("employee_id") || ""),
    block_date: String(formData.get("block_date") || ""),
    start_time: String(formData.get("start_time") || ""),
    end_time: String(formData.get("end_time") || ""),
    reason: String(formData.get("reason") || "").trim() || null
  };

  if (!payload.employee_id || !payload.block_date || !payload.start_time || !payload.end_time || payload.start_time >= payload.end_time) {
    setMessage(availabilityMessage, "Completa especialista, fecha y rango válido.", "warning");
    return;
  }

  setBusy(timeBlockForm, true);
  const { error } = await supabase.from("employee_time_blocks").insert(payload);
  setBusy(timeBlockForm, false);

  if (error) {
    console.error("Time block save failed", error);
    setMessage(availabilityMessage, "No pudimos guardar el bloqueo. Revisa permisos o schema.", "error");
    return;
  }

  timeBlockForm.elements.reason.value = "";
  setMessage(availabilityMessage, "Bloqueo agregado.", "success");
  loadAvailability();
}

function fillEmployeeForm(employee) {
  if (!employeeForm || !employee) return;
  employeeForm.elements.id.value = employee.id;
  employeeForm.elements.full_name.value = employee.full_name || "";
  employeeForm.elements.phone.value = employee.phone || "";
  employeeForm.elements.specialty.value = employee.specialty || "";
  employeeForm.elements.commission_rate.value = Number(employee.commission_rate || 0);
  employeeForm.elements.active.checked = Boolean(employee.active);
  if (employeeSubmitButton) employeeSubmitButton.textContent = "Actualizar empleada";
  setMessage(employeeMessage, "");
  openDrawer(employeeForm, "full_name");
}

async function saveEmployee(event) {
  event.preventDefault();
  if (!supabase || !currentSession || !employeeForm) return;
  if (!employeeForm.reportValidity()) return;

  const formData = new FormData(employeeForm);
  const id = String(formData.get("id") || "");
  const payload = {
    full_name: String(formData.get("full_name") || "").trim(),
    phone: String(formData.get("phone") || "").trim() || null,
    specialty: String(formData.get("specialty") || "").trim() || null,
    commission_rate: Number(formData.get("commission_rate") || 0),
    active: formData.get("active") === "on"
  };

  if (!payload.full_name || !payload.specialty) {
    setMessage(employeeMessage, "Nombre y especialidad son obligatorios.", "warning");
    return;
  }
  if (!Number.isFinite(payload.commission_rate) || payload.commission_rate < 0 || payload.commission_rate > 100) {
    setMessage(employeeMessage, "La comisión debe estar entre 0 y 100%.", "warning");
    return;
  }

  setBusy(employeeForm, true);
  setMessage(employeeMessage, id ? "Actualizando empleada..." : "Creando empleada...", "");

  const request = id
    ? supabase.from("employees").update(payload).eq("id", id)
    : supabase.from("employees").insert(payload);
  const { error } = await request;

  if (error) {
    console.error("Employee save failed", error);
    setBusy(employeeForm, false);
    setMessage(employeeMessage, "No pudimos guardar la empleada.", "error");
    return;
  }

  resetEmployeeForm();
  closeDrawer();
  toast(id ? "Especialista actualizada." : "Especialista creada.");
  appointmentEmployees = [];
  await loadEmployees();
  await loadAppointmentEmployees();
  if (document.querySelector("#citas")?.classList.contains("is-visible")) loadAppointments();
}

async function toggleEmployee(employeeId) {
  const employee = currentEmployees.find((item) => item.id === employeeId);
  if (!employee || !supabase || !currentSession) return;

  const { error } = await supabase
    .from("employees")
    .update({ active: !employee.active })
    .eq("id", employee.id);

  if (error) {
    console.error("Employee toggle failed", error);
    setMessage(employeeMessage, "No pudimos cambiar el estado de la empleada.", "error");
    return;
  }

  appointmentEmployees = [];
  await loadEmployees();
  await loadAppointmentEmployees();
  if (document.querySelector("#citas")?.classList.contains("is-visible")) loadAppointments();
}

async function loadEmployees() {
  if (!teamGrid) return;
  if (!supabase || !currentSession) {
    renderEmptyState(teamGrid, "Inicia sesión", "Necesitas acceso administrativo para cargar empleados reales.");
    markSignedOut(teamSummaryGrid);
    return;
  }

  renderLoadingState(teamGrid, "Cargando empleados reales...");
  const { data, error } = await supabase
    .from("employees")
    .select("id, full_name, phone, specialty, commission_rate, active, created_at")
    .order("full_name");

  if (error) {
    console.error("Employees failed to load", error);
    renderEmptyState(teamGrid, "No pudimos cargar empleados", "Revisa permisos RLS o conexión de Supabase.");
    return;
  }

  currentEmployees = data || [];
  renderEmployeeSummary(currentEmployees);
  renderEmployees(currentEmployees);
  renderAvailabilityEmployeeOptions(currentEmployees);
  loadAvailability();
}

async function loadSalesData() {
  if (!salesPaymentList) return;
  if (!supabase || !currentSession) {
    salesPaymentList.innerHTML = '<tr><td colspan="7">Inicia sesión para cargar caja real.</td></tr>';
    markSignedOut(salesSummaryGrid);
    return;
  }

  salesPaymentList.innerHTML = '<tr><td colspan="7">Cargando pagos reales...</td></tr>';
  const today = localDateValue();
  const start = new Date(`${today}T00:00:00`).toISOString();
  const end = new Date(`${addDays(today, 1)}T00:00:00`).toISOString();
  let query = supabase
    .from("payments")
    .select("id, method, amount, reference, paid_at, sales(id, invoice_number, status, total, clients(full_name))")
    .gte("paid_at", start)
    .lt("paid_at", end);

  if (salesMethodFilter?.value) {
    query = query.eq("method", salesMethodFilter.value);
  }

  const { data, error } = await query.order("paid_at", { ascending: false });
  if (error) {
    console.error("Sales data failed", error);
    salesPaymentList.innerHTML = '<tr><td colspan="7">No pudimos cargar pagos reales.</td></tr>';
    return;
  }

  const payments = data || [];
  currentSalesPayments = payments;
  renderSalesSummary(payments);
  renderSalesPayments(payments);
}

bookingRequestList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-booking-action], [data-booking-calendar]");
  if (!button) return;
  if (button.dataset.bookingCalendar) {
    openCalendarOn(button.dataset.bookingCalendar, "day");
    return;
  }

  const card = button.closest(".booking-request-card");
  card?.setAttribute("aria-busy", "true");
  card?.querySelectorAll("button").forEach((control) => control.setAttribute("disabled", ""));
  updateBookingStatus(card?.dataset.bookingId, button.dataset.bookingAction);
});

refreshBookingsButton?.addEventListener("click", loadBookingRequests);

scheduleList?.addEventListener("click", (event) => {
  const detailButton = event.target.closest("[data-appointment-detail]");
  if (detailButton) {
    const item = detailButton.closest("[data-appointment-id]");
    loadAppointmentDetail(item?.dataset.appointmentId);
    return;
  }

  const editButton = event.target.closest("[data-appointment-edit]");
  if (editButton) {
    const item = editButton.closest("[data-appointment-id]");
    editAppointment(item?.dataset.appointmentId);
    return;
  }

  const button = event.target.closest("[data-appointment-status]");
  if (!button) return;
  const item = button.closest("[data-appointment-id]");
  item?.setAttribute("aria-busy", "true");
  item?.querySelectorAll("button").forEach((control) => control.setAttribute("disabled", ""));
  updateAppointmentStatus(item?.dataset.appointmentId, button.dataset.appointmentStatus);
});

previousScheduleDay?.addEventListener("click", () => {
  selectedScheduleDate = addDays(selectedScheduleDate, -1);
  if (appointmentDate) appointmentDate.value = selectedScheduleDate;
  loadAppointments();
});

nextScheduleDay?.addEventListener("click", () => {
  selectedScheduleDate = addDays(selectedScheduleDate, 1);
  if (appointmentDate) appointmentDate.value = selectedScheduleDate;
  loadAppointments();
});

scheduleEmployeeFilter?.addEventListener("change", loadAppointments);
scheduleStatusFilter?.addEventListener("change", loadAppointments);
salesMethodFilter?.addEventListener("change", loadSalesData);
exportSalesCsvButton?.addEventListener("click", exportSalesCsv);
clientSearch?.addEventListener("input", () => renderClients(currentClients));

clientTableBody?.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-client-edit-row]");
  if (editButton) {
    const row = editButton.closest("[data-client-id]");
    const client = currentClients.find((item) => item.id === row?.dataset.clientId);
    fillClientForm(client);
    return;
  }

  const button = event.target.closest("[data-client-profile]");
  if (!button) return;
  const row = button.closest("[data-client-id]");
  const client = currentClients.find((item) => item.id === row?.dataset.clientId);
  if (client) renderClientProfile(client);
});

clientProfileCard?.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-client-edit]");
  if (editButton) {
    const client = currentClients.find((item) => item.id === editButton.dataset.clientEdit);
    fillClientForm(client);
    return;
  }

  const button = event.target.closest("[data-client-fill]");
  if (!button) return;
  const client = currentClients.find((item) => item.id === button.dataset.clientFill);
  if (!client || !appointmentForm) return;
  showView("citas");
  resetAppointmentForm();
  appointmentForm.elements.client_name.value = client.full_name || "";
  appointmentForm.elements.client_phone.value = client.phone || "";
  openDrawer(appointmentForm, "service_id");
});

clientForm?.addEventListener("submit", saveClient);
clearClientForm?.addEventListener("click", resetClientForm);
newClientButton?.addEventListener("click", () => {
  resetClientForm();
  openDrawer(clientForm);
});

teamGrid?.addEventListener("click", (event) => {
  const card = event.target.closest("[data-employee-id]");
  if (!card) return;

  const employee = currentEmployees.find((item) => item.id === card.dataset.employeeId);
  if (event.target.closest("[data-employee-edit]")) {
    fillEmployeeForm(employee);
    return;
  }
  if (event.target.closest("[data-employee-toggle]")) {
    toggleEmployee(card.dataset.employeeId);
  }
});

employeeForm?.addEventListener("submit", saveEmployee);
clearEmployeeForm?.addEventListener("click", resetEmployeeForm);
newEmployeeButton?.addEventListener("click", () => {
  resetEmployeeForm();
  openDrawer(employeeForm);
});
workingHoursForm?.addEventListener("submit", saveWorkingHours);
timeBlockForm?.addEventListener("submit", saveTimeBlock);
availabilityList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-availability-delete]");
  if (!button) return;
  deleteAvailabilityRecord(button.dataset.availabilityDelete, button.dataset.availabilityTable);
});

appointmentDetail?.addEventListener("submit", (event) => {
  if (!event.target.matches(".payment-form")) return;
  registerAppointmentPayment(event);
});

appointmentForm?.addEventListener("submit", saveAppointment);
clearAppointmentForm?.addEventListener("click", resetAppointmentForm);
newAppointmentButton?.addEventListener("click", () => {
  resetAppointmentForm();
  openDrawer(appointmentForm);
});

function renderAdminServices(services) {
  if (!adminServiceGrid || !services.length) return;

  adminServiceGrid.innerHTML = "";
  services.forEach((service, index) => {
    const card = document.createElement("article");
    card.className = "service-card admin-record-card";

    const number = document.createElement("span");
    const title = document.createElement("h3");
    const description = document.createElement("p");
    const price = document.createElement("strong");
    const meta = document.createElement("div");
    const actions = document.createElement("div");

    card.dataset.serviceId = service.id;
    number.textContent = service.category || `Servicio ${index + 1}`;
    title.textContent = service.name;
    description.textContent = service.description || service.category;
    price.textContent = `C$ ${money(service.base_price)} · ${service.duration_minutes} min`;
    meta.className = "admin-record-meta";
    meta.innerHTML = `
      <span class="status ${service.active ? "ok" : "warn"}">${service.active ? "Activo" : "Inactivo"}</span>
      <span class="status ${service.online_booking_enabled ? "ok" : ""}">${service.online_booking_enabled ? "Reserva online" : "Solo admin"}</span>
    `;
    actions.className = "admin-record-actions";
    actions.innerHTML = `
      <button type="button" data-service-action="edit">Editar</button>
      <button type="button" data-service-action="toggle-active">${service.active ? "Desactivar" : "Activar"}</button>
      <button type="button" data-service-action="toggle-online">${service.online_booking_enabled ? "Ocultar online" : "Mostrar online"}</button>
      <button type="button" data-service-action="delete">Eliminar</button>
    `;

    card.append(number, title, description, price, meta, actions);
    adminServiceGrid.append(card);
  });
}

async function loadAdminServices() {
  if (!adminServiceGrid) return;
  if (!supabase || !currentSession) {
    renderEmptyState(adminServiceGrid, "Sin sesión", "Inicia sesión para ver y editar el catálogo.", "Iniciar sesión", "login");
    return;
  }
  if (servicesLoading) return;
  servicesLoading = true;
  renderLoadingState(adminServiceGrid, "Cargando servicios...");

  const { data, error } = await supabase
    .from("services")
    .select("id, name, category, description, base_price, duration_minutes, active, online_booking_enabled")
    .order("name");

  if (error) {
    servicesLoading = false;
    setMessage(serviceMessage, "No pudimos cargar servicios.", "error");
    renderEmptyState(adminServiceGrid, "No se cargaron los servicios", "Revisa la conexión y vuelve a intentarlo.", "Reintentar", "servicios");
    return;
  }
  adminServices = data || [];
  servicesLoading = false;
  if (!adminServices.length) {
    renderEmptyState(adminServiceGrid, "Aún no hay servicios", "Crea el primer servicio para alimentar el catálogo y la reserva online.", "Crear servicio", "", "service-form");
    return;
  }
  renderAdminServices(adminServices);
}

function fillServiceForm(service) {
  if (!serviceForm) return;
  serviceForm.elements.id.value = service.id;
  serviceForm.elements.name.value = service.name || "";
  serviceForm.elements.category.value = service.category || "";
  serviceForm.elements.base_price.value = service.base_price || 0;
  serviceForm.elements.duration_minutes.value = service.duration_minutes || 1;
  serviceForm.elements.description.value = service.description || "";
  serviceForm.elements.active.checked = Boolean(service.active);
  serviceForm.elements.online_booking_enabled.checked = Boolean(service.online_booking_enabled);
  setMessage(serviceMessage, "");
  openDrawer(serviceForm, "name");
}

async function saveService(event) {
  event.preventDefault();
  if (!supabase || !currentSession || !serviceForm) return;
  if (!serviceForm.reportValidity()) return;

  const formData = new FormData(serviceForm);
  const id = String(formData.get("id") || "");
  const payload = {
    name: String(formData.get("name") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    description: String(formData.get("description") || "").trim() || null,
    base_price: Number(formData.get("base_price") || 0),
    duration_minutes: Number(formData.get("duration_minutes") || 1),
    active: formData.get("active") === "on",
    online_booking_enabled: formData.get("online_booking_enabled") === "on"
  };
  const validationMessage = validateServicePayload(payload);
  if (validationMessage) {
    setMessage(serviceMessage, validationMessage, "warning");
    return;
  }

  setBusy(serviceForm, true);
  setMessage(serviceMessage, id ? "Guardando cambios del servicio..." : "Creando servicio...", "");
  const request = id
    ? supabase.from("services").update(payload).eq("id", id)
    : supabase.from("services").insert(payload);
  const { error } = await request;

  if (error) {
    setBusy(serviceForm, false);
    setMessage(serviceMessage, "No pudimos guardar el servicio.", "error");
    return;
  }

  resetServiceForm();
  closeDrawer();
  toast("Servicio guardado.");
  loadAdminServices();
}

async function updateServiceField(serviceId, payload) {
  if (!supabase || !serviceId) return;
  setMessage(serviceMessage, "Actualizando servicio...", "");
  const { error } = await supabase.from("services").update(payload).eq("id", serviceId);
  if (error) {
    setMessage(serviceMessage, "No pudimos actualizar el servicio.", "error");
    return;
  }
  loadAdminServices();
}

async function deleteService(serviceId) {
  if (!supabase || !serviceId) return;
  const confirmed = window.confirm("Eliminar este servicio puede afectar citas asociadas. Esta acción no se puede deshacer. ¿Deseas continuar?");
  if (!confirmed) return;
  setMessage(serviceMessage, "Eliminando servicio...", "");
  const { error } = await supabase.from("services").delete().eq("id", serviceId);
  if (error) {
    setMessage(serviceMessage, "No pudimos eliminar el servicio. Puede estar asociado a citas.", "error");
    return;
  }
  loadAdminServices();
}

adminServiceGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-service-action]");
  if (!button) return;

  const serviceId = button.closest(".admin-record-card")?.dataset.serviceId;
  const service = adminServices.find((item) => item.id === serviceId);
  if (!service) return;

  const action = button.dataset.serviceAction;
  if (action === "edit") fillServiceForm(service);
  if (action === "toggle-active") updateServiceField(serviceId, { active: !service.active });
  if (action === "toggle-online") updateServiceField(serviceId, { online_booking_enabled: !service.online_booking_enabled });
  if (action === "delete") deleteService(serviceId);
});

serviceForm?.addEventListener("submit", saveService);
cancelServiceEdit?.addEventListener("click", resetServiceForm);
newServiceButton?.addEventListener("click", () => {
  resetServiceForm();
  openDrawer(serviceForm);
});

function renderAdminProducts(products) {
  if (!adminProductGrid || !products.length) return;

  adminProductGrid.innerHTML = "";
  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "stock-card admin-record-card";

    const level = document.createElement("span");
    const title = document.createElement("h3");
    const brand = document.createElement("p");
    const stock = document.createElement("strong");
    const meta = document.createElement("div");
    const actions = document.createElement("div");

    card.dataset.productId = product.id;
    const currentStock = Number(product.current_stock || 0);
    const minimumStock = Number(product.minimum_stock || 0);
    level.className = `stock-level ${currentStock <= minimumStock ? "low" : "high"}`;
    title.textContent = product.name;
    brand.textContent = product.brand || product.category;
    stock.textContent = `${currentStock} ${product.unit || "unidad"}`;
    const stockIsLow = currentStock <= minimumStock;
    meta.className = "admin-record-meta";
    meta.innerHTML = `
      <span class="status ${product.active ? "ok" : "warn"}">${product.active ? "Activo" : "Inactivo"}</span>
      <span class="status ${stockIsLow ? "danger" : "ok"}">${stockIsLow ? "Stock bajo" : "Stock suficiente"}</span>
      <span class="status ${product.public_visible ? "ok" : ""}">${product.public_visible ? "Visible publico" : "Oculto publico"}</span>
    `;
    actions.className = "admin-record-actions";
    actions.innerHTML = `
      <button type="button" data-product-action="edit">Editar</button>
      <button type="button" data-product-action="toggle-active">${product.active ? "Desactivar" : "Activar"}</button>
      <button type="button" data-product-action="toggle-public">${product.public_visible ? "Ocultar publico" : "Mostrar publico"}</button>
      <button type="button" data-product-action="delete">Eliminar</button>
    `;

    card.append(level, title, brand, stock, meta, actions);
    adminProductGrid.append(card);
  });
}

async function loadAdminProducts() {
  if (!adminProductGrid) return;
  if (!supabase || !currentSession) {
    renderEmptyState(adminProductGrid, "Sin sesión", "Inicia sesión para ver y editar el inventario.", "Iniciar sesión", "login");
    return;
  }
  if (productsLoading) return;
  productsLoading = true;
  renderLoadingState(adminProductGrid, "Cargando productos...");

  const { data, error } = await supabase
    .from("products")
    .select("id, name, brand, category, unit, current_stock, minimum_stock, cost, supplier, active, public_visible")
    .order("name");

  if (error) {
    productsLoading = false;
    setMessage(productMessage, "No pudimos cargar productos.", "error");
    renderEmptyState(adminProductGrid, "No se cargó el inventario", "Revisa la conexión y vuelve a intentarlo.", "Reintentar", "inventario");
    return;
  }
  adminProducts = data || [];
  productsLoading = false;
  if (!adminProducts.length) {
    renderEmptyState(adminProductGrid, "Aún no hay productos", "Registra productos para controlar stock mínimo y visibilidad pública.", "Crear producto", "inventario");
    return;
  }
  renderAdminProducts(adminProducts);
}

function fillProductForm(product) {
  if (!productForm) return;
  productForm.elements.id.value = product.id;
  productForm.elements.name.value = product.name || "";
  productForm.elements.brand.value = product.brand || "";
  productForm.elements.category.value = product.category || "";
  productForm.elements.unit.value = product.unit || "unidad";
  productForm.elements.current_stock.value = product.current_stock || 0;
  productForm.elements.minimum_stock.value = product.minimum_stock || 0;
  productForm.elements.cost.value = product.cost || 0;
  productForm.elements.supplier.value = product.supplier || "";
  productForm.elements.active.checked = Boolean(product.active);
  productForm.elements.public_visible.checked = Boolean(product.public_visible);
  setMessage(productMessage, "");
  openDrawer(productForm, "name");
}

async function saveProduct(event) {
  event.preventDefault();
  if (!supabase || !currentSession || !productForm) return;
  if (!productForm.reportValidity()) return;

  const formData = new FormData(productForm);
  const id = String(formData.get("id") || "");
  const payload = {
    name: String(formData.get("name") || "").trim(),
    brand: String(formData.get("brand") || "").trim() || null,
    category: String(formData.get("category") || "").trim(),
    unit: String(formData.get("unit") || "unidad").trim(),
    current_stock: Number(formData.get("current_stock") || 0),
    minimum_stock: Number(formData.get("minimum_stock") || 0),
    cost: Number(formData.get("cost") || 0),
    supplier: String(formData.get("supplier") || "").trim() || null,
    active: formData.get("active") === "on",
    public_visible: formData.get("public_visible") === "on"
  };
  const validationMessage = validateProductPayload(payload);
  if (validationMessage) {
    setMessage(productMessage, validationMessage, "warning");
    return;
  }

  setBusy(productForm, true);
  setMessage(productMessage, id ? "Guardando cambios del producto..." : "Creando producto...", "");
  const request = id
    ? supabase.from("products").update(payload).eq("id", id)
    : supabase.from("products").insert(payload);
  const { error } = await request;

  if (error) {
    setBusy(productForm, false);
    setMessage(productMessage, "No pudimos guardar el producto.", "error");
    return;
  }

  resetProductForm();
  closeDrawer();
  toast("Producto guardado.");
  loadAdminProducts();
}

async function updateProductField(productId, payload) {
  if (!supabase || !productId) return;
  setMessage(productMessage, "Actualizando producto...", "");
  const { error } = await supabase.from("products").update(payload).eq("id", productId);
  if (error) {
    setMessage(productMessage, "No pudimos actualizar el producto.", "error");
    return;
  }
  loadAdminProducts();
}

async function deleteProduct(productId) {
  if (!supabase || !productId) return;
  const confirmed = window.confirm("Eliminar este producto quitará su registro del inventario. Esta acción no se puede deshacer. ¿Deseas continuar?");
  if (!confirmed) return;
  setMessage(productMessage, "Eliminando producto...", "");
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) {
    setMessage(productMessage, "No pudimos eliminar el producto.", "error");
    return;
  }
  loadAdminProducts();
}

adminProductGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-product-action]");
  if (!button) return;

  const productId = button.closest(".admin-record-card")?.dataset.productId;
  const product = adminProducts.find((item) => item.id === productId);
  if (!product) return;

  const action = button.dataset.productAction;
  if (action === "edit") fillProductForm(product);
  if (action === "toggle-active") updateProductField(productId, { active: !product.active });
  if (action === "toggle-public") updateProductField(productId, { public_visible: !product.public_visible });
  if (action === "delete") deleteProduct(productId);
});

productForm?.addEventListener("submit", saveProduct);
cancelProductEdit?.addEventListener("click", resetProductForm);
newProductButton?.addEventListener("click", () => {
  resetProductForm();
  openDrawer(productForm);
});
dashboardAttentionList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (button?.dataset.view) showView(button.dataset.view);
});

function dateRangeForDay(dateValue) {
  return {
    start: new Date(`${dateValue}T00:00:00`).toISOString(),
    end: new Date(`${addDays(dateValue, 1)}T00:00:00`).toISOString()
  };
}

function shortWeekday(dateValue) {
  return new Intl.DateTimeFormat("es-NI", { weekday: "short" }).format(new Date(`${dateValue}T12:00:00`));
}

function renderDashboardLoading() {
  if (dashboardHeadline) dashboardHeadline.textContent = "Cargando decisiones de hoy...";
  if (dashboardSubcopy) dashboardSubcopy.textContent = "Estamos leyendo citas, caja e inventario reales.";
}

function renderDashboardEmpty(message) {
  if (dashboardHeadline) dashboardHeadline.textContent = "Sin datos del día";
  if (dashboardSubcopy) dashboardSubcopy.textContent = message;
  dashboardMetrics?.removeAttribute("aria-busy");
  if (dashboardMetrics) renderEmptyState(dashboardMetrics, "Sin datos operativos", "Cuando registres citas, pagos y productos, el resumen se actualizará aquí.");
  const idle = '<p class="muted">Disponible al iniciar sesión.</p>';
  [dashboardAttentionList, dashboardUpcomingList, dashboardServiceMix, dashboardCloseoutList].forEach((node) => { if (node) node.innerHTML = idle; });
  if (dashboardInsight) dashboardInsight.textContent = "Sin pagos cargados.";
}

function metricIcon(name) {
  return `<i class="metric-icon" aria-hidden="true"><svg class="icon"><use href="#i-${name}"/></svg></i>`;
}

function renderRevenueTrend(todayRevenue, yesterdayRevenue) {
  if (!yesterdayRevenue) return "";
  const change = Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);
  const direction = change >= 0 ? "up" : "down";
  const label = `${change >= 0 ? "+" : ""}${change}%`;
  return `<em class="metric-trend" data-direction="${direction}" title="Comparado con ayer"><svg class="icon" aria-hidden="true"><use href="#i-trend_${direction}"/></svg>${label} vs ayer</em>`;
}

function renderDashboardMetrics({ todayRevenue, yesterdayRevenue, todayAppointments, pendingAppointments, newClients, averageTicket }) {
  if (!dashboardMetrics) return;
  const dailyGoal = 22000;
  const progress = Math.min(Math.round((todayRevenue / dailyGoal) * 100), 100);
  const confirmed = Math.max(todayAppointments - pendingAppointments, 0);
  const confirmedShare = todayAppointments ? Math.round((confirmed / todayAppointments) * 100) : 0;
  dashboardMetrics.removeAttribute("aria-busy");
  dashboardMetrics.innerHTML = `
    <article class="metric-card priority" data-tone="focus" data-gradient="pink">
      <div class="metric-head">${metricIcon("wallet")}<span>Ingresos de hoy</span></div>
      <strong>C$ ${money(todayRevenue)}</strong>
      <div class="metric-foot"><small>Meta diaria: C$ ${money(dailyGoal)} · ${progress}%</small>${renderRevenueTrend(todayRevenue, yesterdayRevenue)}</div>
      <div class="metric-progress" role="progressbar" aria-label="Avance de la meta diaria" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width: ${progress}%"></span></div>
    </article>
    <article class="metric-card" data-tone="warning" data-gradient="purple">
      <div class="metric-head">${metricIcon("calendar_month")}<span>Citas de hoy</span></div>
      <strong>${todayAppointments}</strong>
      <div class="metric-foot"><small>${pendingAppointments} pendientes de confirmar</small></div>
      ${todayAppointments ? `<div class="metric-progress" role="progressbar" aria-label="Citas confirmadas" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${confirmedShare}"><span style="width: ${confirmedShare}%"></span></div>` : ""}
    </article>
    <article class="metric-card" data-tone="ok" data-gradient="blue">
      <div class="metric-head">${metricIcon("person_add")}<span>Clientes nuevos</span></div>
      <strong>${newClients}</strong>
      <div class="metric-foot"><small>Registrados hoy</small></div>
    </article>
    <article class="metric-card" data-tone="neutral" data-gradient="orange">
      <div class="metric-head">${metricIcon("receipt")}<span>Ticket promedio</span></div>
      <strong>C$ ${money(averageTicket)}</strong>
      <div class="metric-foot"><small>Según pagos registrados hoy</small></div>
    </article>
  `;
}

function renderDashboardAttention({ pendingAppointments, pendingBookings, lowProducts, missingTransferRefs }) {
  if (!dashboardAttentionList) return;
  const items = [
    { view: "citas", tone: "danger", title: `${pendingAppointments} ${pendingAppointments === 1 ? "cita" : "citas"} sin confirmar`, detail: "Revisar agenda de hoy" },
    { view: "citas", tone: "warn", title: `${pendingBookings} ${pendingBookings === 1 ? "solicitud online" : "solicitudes online"}`, detail: "Aprobar o rechazar reservas" },
    { view: "inventario", tone: "warn", title: `${lowProducts.length} ${lowProducts.length === 1 ? "producto" : "productos"} bajo mínimo`, detail: lowProducts[0] ? `${lowProducts[0].name}: ${lowProducts[0].current_stock} ${lowProducts[0].unit || "unidad"}` : "Stock estable" },
    { view: "ventas", tone: "", title: `${missingTransferRefs} ${missingTransferRefs === 1 ? "transferencia" : "transferencias"} sin referencia`, detail: "Completar cierre de caja" }
  ];

  const pending = items.filter((item) => !/^0 /.test(item.title));
  if (!pending.length) {
    dashboardAttentionList.innerHTML = '<article class="empty-state compact"><strong>Todo al día</strong><p>No hay citas, solicitudes, stock ni pagos pendientes.</p></article>';
    return;
  }
  dashboardAttentionList.innerHTML = pending.map((item) => `
    <button data-view="${item.view}">
      <span class="alert-dot ${item.tone}" aria-hidden="true"></span>
      <strong>${escapeHtml(item.title)}</strong>
      <small>${escapeHtml(item.detail)}</small>
    </button>
  `).join("");
}

function renderDashboardUpcoming(appointments) {
  if (!dashboardUpcomingList) return;
  const activeAppointments = appointments
    .filter((appointment) => !["completed", "cancelled", "no_show"].includes(appointment.status))
    .slice(0, 4);

  if (!activeAppointments.length) {
    dashboardUpcomingList.innerHTML = '<article class="empty-state compact"><strong>Sin próximas citas</strong><p>Las citas activas de hoy aparecerán aquí.</p></article>';
    return;
  }

  dashboardUpcomingList.innerHTML = activeAppointments.map((appointment) => {
    const status = appointmentStatusMeta(appointment.status);
    const service = appointmentService(appointment);
    return `
      <div class="appointment-row">
        <time>${formatTime(appointment.starts_at)}</time>
        <div><strong>${escapeHtml(appointment.clients?.full_name || "Cliente sin nombre")}</strong><span>${escapeHtml(service?.services?.name || "Servicio por confirmar")}${appointment.employees?.full_name ? ` con ${escapeHtml(appointment.employees.full_name)}` : ""}</span></div>
        <span class="status ${status.className}">${status.label}</span>
      </div>
    `;
  }).join("");
}

function renderDashboardServiceMix(appointments) {
  if (!dashboardServiceMix) return;
  const totals = appointments.reduce((acc, appointment) => {
    const serviceName = appointmentService(appointment)?.services?.name || "Sin servicio";
    acc[serviceName] = (acc[serviceName] || 0) + 1;
    return acc;
  }, {});
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (!entries.length) {
    dashboardServiceMix.innerHTML = '<p class="muted">Sin servicios agendados hoy.</p>';
    return;
  }

  dashboardServiceMix.innerHTML = entries.map(([name, count]) => {
    const percent = Math.round((count / total) * 100);
    return `<div><span>${escapeHtml(name)}</span><strong>${percent}%</strong><i style="width: ${percent}%"></i></div>`;
  }).join("");
}

function renderDashboardCloseout({ partialSales, lowProducts, missingTransferRefs, pendingTomorrowBookings }) {
  if (!dashboardCloseoutList) return;
  dashboardCloseoutList.innerHTML = `
    <label><input type="checkbox" ${missingTransferRefs ? "" : "checked"}> ${missingTransferRefs ? `${missingTransferRefs} transferencias pendientes de referencia` : "Transferencias conciliadas"}</label>
    <label><input type="checkbox" ${lowProducts.length ? "" : "checked"}> ${lowProducts.length ? `${lowProducts.length} productos bajo mínimo` : "Inventario sin alertas críticas"}</label>
    <label><input type="checkbox" ${pendingTomorrowBookings ? "" : "checked"}> ${pendingTomorrowBookings ? `${pendingTomorrowBookings} reservas de mañana por confirmar` : "Reservas de mañana revisadas"}</label>
    <label><input type="checkbox" ${partialSales ? "" : "checked"}> ${partialSales ? `${partialSales} ventas parciales por revisar` : "Sin ventas parciales pendientes"}</label>
  `;
}

async function loadDashboardData() {
  if (!dashboardMetrics) return;
  if (!supabase || !currentSession) {
    renderDashboardEmpty("Inicia sesión para cargar citas, caja e inventario.");
    return;
  }

  renderDashboardLoading();
  const today = localDateValue();
  const tomorrow = addDays(today, 1);
  const todayRange = dateRangeForDay(today);
  const tomorrowRange = dateRangeForDay(tomorrow);
  const weekStart = dateRangeForDay(addDays(today, -6)).start;

  const [appointmentsResult, bookingsResult, clientsResult, productsResult, paymentsResult, weekPaymentsResult, tomorrowBookingsResult, partialSalesResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, client_id, employee_id, starts_at, ends_at, status, clients(full_name, phone), employees(full_name), appointment_services(service_id, price, duration_minutes, services(name))")
      .gte("starts_at", todayRange.start)
      .lt("starts_at", todayRange.end)
      .order("starts_at", { ascending: true }),
    supabase.from("public_bookings").select("id, service_id, client_phone, preferred_date, preferred_time").eq("status", "pending"),
    supabase.from("clients").select("id").gte("created_at", todayRange.start).lt("created_at", todayRange.end),
    supabase.from("products").select("id, name, current_stock, minimum_stock, unit").eq("active", true),
    supabase.from("payments").select("id, amount, method, reference, sales(id, status, total)").gte("paid_at", todayRange.start).lt("paid_at", todayRange.end),
    supabase.from("payments").select("amount, paid_at").gte("paid_at", weekStart).lt("paid_at", todayRange.end),
    supabase.from("public_bookings").select("id").eq("status", "pending").eq("preferred_date", tomorrow),
    supabase.from("sales").select("id").eq("status", "partial")
  ]);

  const firstError = [appointmentsResult, bookingsResult, clientsResult, productsResult, paymentsResult, weekPaymentsResult, tomorrowBookingsResult, partialSalesResult].find((result) => result.error)?.error;
  if (firstError) {
    console.error("Dashboard failed to load", firstError);
    renderDashboardEmpty("No pudimos cargar el dashboard. Revisa la conexión o los permisos.");
    return;
  }

  const appointments = appointmentsResult.data || [];
  const payments = paymentsResult.data || [];
  const lowProducts = (productsResult.data || []).filter((product) => Number(product.current_stock || 0) <= Number(product.minimum_stock || 0));
  const todayRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const uniqueSaleIds = new Set(payments.map((payment) => payment.sales?.id).filter(Boolean));
  const averageTicket = uniqueSaleIds.size ? Math.round(todayRevenue / uniqueSaleIds.size) : 0;
  const pendingAppointments = appointments.filter((appointment) => appointment.status === "pending").length;
  const pendingBookings = (bookingsResult.data || []).length;
  const missingTransferRefs = payments.filter((payment) => payment.method === "transfer" && !payment.reference).length;
  const decisions = pendingAppointments + pendingBookings + lowProducts.length + missingTransferRefs;

  if (dashboardHeadline) dashboardHeadline.textContent = decisions ? `${decisions} ${decisions === 1 ? "pendiente" : "pendientes"} antes del cierre` : "Sin alertas antes del cierre";
  if (dashboardSubcopy) dashboardSubcopy.textContent = `Actualizado a las ${new Intl.DateTimeFormat("es-NI", { hour: "numeric", minute: "2-digit" }).format(new Date())}.`;
  if (dashboardStatusRow) {
    dashboardStatusRow.innerHTML = `
      <span><strong>Horario</strong> 9:00 a. m. – 6:00 p. m.</span>
      ${pendingBookings ? `<span><strong>Prioridad</strong> Confirmar ${pendingBookings} ${pendingBookings === 1 ? "reserva online" : "reservas online"}</span>` : ""}
      ${lowProducts[0] ? `<span><strong>Stock</strong> ${escapeHtml(lowProducts[0].name)} bajo mínimo</span>` : ""}
    `;
  }

  const weekPayments = weekPaymentsResult.data || [];
  revenueChartLabels = Array.from({ length: 7 }, (_, index) => index === 6 ? "Hoy" : shortWeekday(addDays(today, index - 6)));
  revenueChartValues = Array.from({ length: 7 }, (_, index) => {
    const dateValue = addDays(today, index - 6);
    return weekPayments
      .filter((payment) => localDateValue(new Date(payment.paid_at)) === dateValue)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  });
  setPendingRequestCount(uniquePendingBookings(bookingsResult.data || []).length);

  renderDashboardMetrics({
    todayRevenue,
    yesterdayRevenue: revenueChartValues[5],
    todayAppointments: appointments.length,
    pendingAppointments,
    newClients: (clientsResult.data || []).length,
    averageTicket
  });
  renderDashboardAttention({ pendingAppointments, pendingBookings, lowProducts, missingTransferRefs });
  renderDashboardUpcoming(appointments);
  renderDashboardServiceMix(appointments);
  renderDashboardCloseout({
    partialSales: (partialSalesResult.data || []).length,
    lowProducts,
    missingTransferRefs,
    pendingTomorrowBookings: (tomorrowBookingsResult.data || []).length
  });

  const dailyGoal = 22000;
  const remaining = Math.max(dailyGoal - todayRevenue, 0);
  if (dashboardInsight) dashboardInsight.textContent = remaining ? `Faltan C$ ${money(remaining)} para la meta diaria.` : "Meta diaria alcanzada.";
  drawRevenueChart();
}

function loadAdminData() {
  loadDashboardData();
  loadAdminServices();
  loadAdminProducts();
}

const canvas = document.querySelector("#revenue-chart");
let revenueChartValues = [0, 0, 0, 0, 0, 0, 0];
let revenueChartLabels = ["", "", "", "", "", "", "Hoy"];

function drawRevenueChart() {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const values = revenueChartValues;
  const labels = revenueChartLabels;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = 260 * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const width = rect.width;
  const height = 260;
  const padTop = 18;
  const padBottom = 34;
  const padRight = 16;
  const padLeft = 56;
  const plotHeight = height - padTop - padBottom;
  const maxValue = Math.max(...values, 100);
  const step = niceStep(maxValue / 4);
  const max = step * 4;
  const points = values.map((value, index) => {
    const x = padLeft + index * ((width - padLeft - padRight) / Math.max(values.length - 1, 1));
    const y = padTop + plotHeight - (value / max) * plotHeight;
    return { x, y };
  });

  ctx.clearRect(0, 0, width, height);

  // Subtle dashed grid + compact Y labels.
  ctx.font = "500 12px 'Outfit', system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padTop + plotHeight - (i / 4) * plotHeight;
    ctx.strokeStyle = i === 0 ? "#EDE7F0" : "#F3EEF5";
    ctx.setLineDash(i === 0 ? [] : [4, 6]);
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(width - padRight, y);
    ctx.stroke();
    ctx.fillStyle = "#A1A1AA";
    ctx.fillText(compactMoney(step * i), padLeft - 12, y);
  }
  ctx.setLineDash([]);

  const tracePath = () => {
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1];
      const point = points[i];
      const midX = (prev.x + point.x) / 2;
      ctx.bezierCurveTo(midX, prev.y, midX, point.y, point.x, point.y);
    }
  };

  const gradient = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
  gradient.addColorStop(0, "rgba(236, 72, 153, 0.30)");
  gradient.addColorStop(0.6, "rgba(236, 72, 153, 0.08)");
  gradient.addColorStop(1, "rgba(236, 72, 153, 0)");
  ctx.beginPath();
  tracePath();
  ctx.lineTo(points[points.length - 1].x, height - padBottom);
  ctx.lineTo(points[0].x, height - padBottom);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  const lineGradient = ctx.createLinearGradient(padLeft, 0, width - padRight, 0);
  lineGradient.addColorStop(0, "#F472B6");
  lineGradient.addColorStop(1, "#DB2777");
  ctx.beginPath();
  tracePath();
  ctx.strokeStyle = lineGradient;
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.fillStyle = "#71717A";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  labels.forEach((label, index) => {
    ctx.font = index === labels.length - 1 ? "600 12px 'Outfit', system-ui, sans-serif" : "500 12px 'Outfit', system-ui, sans-serif";
    ctx.fillStyle = index === labels.length - 1 ? "#DB2777" : "#71717A";
    ctx.fillText(label, points[index].x, height - 10);
  });

  points.forEach((point, index) => {
    const isToday = index === points.length - 1;
    ctx.beginPath();
    ctx.arc(point.x, point.y, isToday ? 6.5 : 4, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.lineWidth = isToday ? 3.5 : 2.5;
    ctx.strokeStyle = "#EC4899";
    ctx.stroke();
  });
}

function niceStep(raw) {
  if (raw <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

function compactMoney(value) {
  if (value >= 1000) return `C$ ${Number((value / 1000).toFixed(1)).toLocaleString("es-NI")}k`;
  return `C$ ${Math.round(value)}`;
}

if (canvas) {
  drawRevenueChart();
  // Redraw when the panel itself changes size (sidebar, view switch, window resize).
  if ("ResizeObserver" in window) new ResizeObserver(() => drawRevenueChart()).observe(canvas);
  else window.addEventListener("resize", drawRevenueChart);
}

document.querySelector("#global-search")?.addEventListener("input", (event) => {
  const value = event.target.value.toLowerCase();
  document.querySelectorAll(".view.is-visible tbody tr").forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(value) ? "" : "none";
  });
});

// ==========================================================================
// Calendario. Reads the same appointments and public_bookings tables as Citas
// and writes through the same functions, so both views always agree.
// ==========================================================================
const calendarBoard = document.querySelector("#calendar-board");
const calendarRangeLabel = document.querySelector("#calendar-range-label");
const calendarDetailPanel = document.querySelector("#calendar-detail");
const calendarDetailBody = document.querySelector("#calendar-detail-body");
const calendarEmployeeFilter = document.querySelector("#calendar-employee-filter");
const calendarStatusFilter = document.querySelector("#calendar-status-filter");
const calendarShowRequests = document.querySelector("#calendar-show-requests");
const calendarModeButtons = document.querySelectorAll("[data-calendar-mode]");
const CAL_HOUR_HEIGHT = 72;
const CAL_PX_PER_MIN = CAL_HOUR_HEIGHT / 60;
const CAL_SNAP_MIN = 15;
const CAL_DEFAULT_START = 8;
const CAL_DEFAULT_END = 20;
const CAL_UNASSIGNED = "__unassigned";
const CAL_APPOINTMENT_SELECT = "id, client_id, employee_id, starts_at, ends_at, status, notes, clients(full_name, phone), employees(full_name), appointment_services(service_id, price, duration_minutes, services(name))";
const CAL_STATUS_LABELS = {
  request: "Solicitud por aprobar",
  pending: "Pendiente",
  confirmed: "Confirmada",
  in_progress: "En proceso",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió"
};
const CAL_TRANSITIONS = {
  pending: [["confirmed", "Confirmar", true], ["cancelled", "Cancelar", false]],
  confirmed: [["in_progress", "Iniciar", true], ["cancelled", "Cancelar", false]],
  in_progress: [["completed", "Completar", true]]
};

const calendarState = {
  mode: window.matchMedia("(max-width: 720px)").matches ? "day" : "week",
  date: localDateValue(),
  items: [],
  lanes: [],
  hours: { startHour: CAL_DEFAULT_START, endHour: CAL_DEFAULT_END },
  selectedKey: "",
  renderKey: "",
  seq: 0,
  drag: null,
  suppressClick: false
};

function calMinutesBetween(start, end) {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

function calSnap(minutes) {
  return Math.round(minutes / CAL_SNAP_MIN) * CAL_SNAP_MIN;
}

function calMinutesToTime(minutes) {
  const safe = Math.max(0, Math.min(24 * 60, minutes));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function calTimeToMinutes(value) {
  const [hours, minutes] = String(value || "0:0").split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function calCapitalize(text) {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

function calFormat(dateValue, options) {
  return new Intl.DateTimeFormat("es-NI", options).format(new Date(`${dateValue}T12:00:00`));
}

function calInitials(name) {
  return String(name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "?";
}

function startOfWeek(dateValue) {
  const offset = (new Date(`${dateValue}T12:00:00`).getDay() + 6) % 7;
  return addDays(dateValue, -offset);
}

function calendarRange() {
  const { mode, date } = calendarState;
  if (mode === "day") return { start: date, end: addDays(date, 1), days: [date] };
  if (mode === "week") {
    const start = startOfWeek(date);
    return { start, end: addDays(start, 7), days: Array.from({ length: 7 }, (_, index) => addDays(start, index)) };
  }
  const first = `${date.slice(0, 7)}-01`;
  const nextMonth = new Date(`${first}T12:00:00`);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const lastDay = addDays(localDateValue(nextMonth), -1);
  const start = startOfWeek(first);
  const end = addDays(startOfWeek(lastDay), 7);
  const days = [];
  for (let day = start; day < end; day = addDays(day, 1)) days.push(day);
  return { start, end, days, month: date.slice(0, 7) };
}

function calendarRangeText(range) {
  if (calendarState.mode === "day") {
    return calCapitalize(calFormat(range.start, { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }
  if (calendarState.mode === "week") {
    const last = range.days[6];
    if (range.start.slice(0, 7) === last.slice(0, 7)) {
      return `${calFormat(range.start, { day: "numeric" })} – ${calFormat(last, { day: "numeric", month: "long", year: "numeric" })}`;
    }
    return `${calFormat(range.start, { day: "numeric", month: "short" })} – ${calFormat(last, { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return calCapitalize(calFormat(`${range.month}-01`, { month: "long", year: "numeric" }));
}

function appointmentToCalendarItem(appointment) {
  const start = new Date(appointment.starts_at);
  const services = appointment.appointment_services || [];
  const planned = services.reduce((sum, service) => sum + Number(service.duration_minutes || 0), 0);
  let end = appointment.ends_at ? new Date(appointment.ends_at) : null;
  if (!end || end <= start) end = new Date(start.getTime() + (planned || 60) * 60000);
  return {
    key: `a:${appointment.id}`,
    kind: "appointment",
    id: appointment.id,
    start,
    end,
    status: appointment.status,
    client: appointment.clients?.full_name || "Cliente sin nombre",
    phone: appointment.clients?.phone || "",
    email: "",
    service: services.map((service) => service.services?.name).filter(Boolean).join(" + ") || "Servicio por confirmar",
    employeeId: appointment.employee_id || "",
    employeeName: appointment.employees?.full_name || "",
    notes: appointment.notes || "",
    raw: appointment
  };
}

function bookingToCalendarItem(booking) {
  const start = new Date(`${booking.preferred_date}T${String(booking.preferred_time || "00:00").slice(0, 5)}`);
  const service = appointmentServices.find((item) => item.id === booking.service_id);
  const employee = appointmentEmployees.find((item) => item.id === booking.preferred_employee_id);
  return {
    key: `r:${booking.id}`,
    kind: "request",
    id: booking.id,
    start,
    end: new Date(start.getTime() + Number(service?.duration_minutes || 60) * 60000),
    status: "request",
    client: booking.client_name || "Cliente",
    phone: booking.client_phone || "",
    email: booking.client_email || "",
    service: service?.name || (booking.service_id ? "Servicio seleccionado" : "Servicio por confirmar"),
    employeeId: booking.preferred_employee_id || "",
    employeeName: employee?.full_name || "",
    notes: booking.notes || "",
    createdAt: booking.created_at,
    raw: booking
  };
}

function findCalendarItem(key) {
  return key ? calendarState.items.find((item) => item.key === key) : null;
}

function calendarLaneId(item) {
  return item.employeeId || CAL_UNASSIGNED;
}

function calendarLanes(items) {
  const filterId = calendarEmployeeFilter?.value || "";
  const lanes = appointmentEmployees
    .filter((employee) => !filterId || employee.id === filterId)
    .map((employee) => ({ id: employee.id, name: employee.full_name }));
  items.forEach((item) => {
    if (item.employeeId && !lanes.some((lane) => lane.id === item.employeeId)) {
      lanes.push({ id: item.employeeId, name: item.employeeName || "Estilista inactiva" });
    }
  });
  if (!filterId && (items.some((item) => !item.employeeId) || !lanes.length)) {
    lanes.push({ id: CAL_UNASSIGNED, name: "Sin asignar" });
  }
  return lanes.map((lane, index) => ({ ...lane, tone: lane.id === CAL_UNASSIGNED ? "none" : String(index % 4) }));
}

function calendarHours(items) {
  let startHour = CAL_DEFAULT_START;
  let endHour = CAL_DEFAULT_END;
  items.forEach((item) => {
    startHour = Math.min(startHour, item.start.getHours());
    const crossesMidnight = localDateValue(item.end) !== localDateValue(item.start);
    endHour = crossesMidnight ? 24 : Math.max(endHour, item.end.getHours() + (item.end.getMinutes() ? 1 : 0));
  });
  return { startHour, endHour: Math.min(24, endHour) };
}

function layoutLaneItems(items) {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const placed = [];
  let cluster = [];
  let clusterEnd = 0;
  const flush = () => {
    const columns = [];
    cluster.forEach((item) => {
      let column = columns.findIndex((end) => end <= item.start.getTime());
      if (column < 0) {
        column = columns.length;
        columns.push(0);
      }
      columns[column] = item.end.getTime();
      placed.push({ item, column });
    });
    const total = columns.length;
    placed.slice(placed.length - cluster.length).forEach((entry) => { entry.columns = total; });
    cluster = [];
    clusterEnd = 0;
  };
  sorted.forEach((item) => {
    if (cluster.length && item.start.getTime() >= clusterEnd) flush();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end.getTime());
  });
  if (cluster.length) flush();
  return placed;
}

function canDragCalendarItem(item) {
  return item.kind === "appointment" && ["pending", "confirmed"].includes(item.status) && calendarState.mode !== "month";
}

function renderCalendarEvent({ item, column, columns }) {
  const { startHour, endHour } = calendarState.hours;
  const dayStart = new Date(item.start);
  dayStart.setHours(startHour, 0, 0, 0);
  const dayEnd = new Date(item.start);
  dayEnd.setHours(endHour, 0, 0, 0);
  const visibleEnd = item.end < dayEnd ? item.end : dayEnd;
  const top = Math.max(0, calMinutesBetween(dayStart, item.start)) * CAL_PX_PER_MIN;
  const height = Math.max(24, calMinutesBetween(item.start, visibleEnd) * CAL_PX_PER_MIN - 2);
  const width = 100 / columns;
  const statusLabel = CAL_STATUS_LABELS[item.status] || item.status;
  const timeText = `${formatTime(item.start)} – ${formatTime(item.end)}`;
  const stylist = item.employeeName || (item.kind === "request" ? "Sin preferencia" : "Sin asignar");
  const label = `${statusLabel}. ${timeText}. ${item.client}. ${item.service}. ${stylist}.`;
  const size = height < 40 ? " is-compact" : height < 62 ? " is-short" : height >= 92 ? " is-tall" : "";
  const classes = `cal-event${size}${item.key === calendarState.selectedKey ? " is-selected" : ""}${canDragCalendarItem(item) ? " is-draggable" : ""}`;
  return `
    <button type="button" class="${classes}" data-cal-status="${escapeHtml(item.status)}" data-cal-key="${escapeHtml(item.key)}"
      style="top:${top}px;height:${height}px;left:calc(${column * width}% + 3px);width:calc(${width}% - 6px)"
      aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">
      <span class="cal-event-time">${escapeHtml(formatTime(item.start))}<span class="cal-event-end"> – ${escapeHtml(formatTime(item.end))}</span></span>
      <strong class="cal-event-client">${escapeHtml(item.client)}</strong>
      <span class="cal-event-service">${escapeHtml(item.service)}</span>
      <span class="cal-event-meta"><span>${escapeHtml(stylist)}</span><span class="cal-event-status">${escapeHtml(statusLabel)}</span></span>
    </button>`;
}

function renderTimeGrid(range) {
  const { lanes } = calendarState;
  const { startHour, endHour } = calendarState.hours;
  const isDay = calendarState.mode === "day";
  const laneMin = isDay ? 170 : lanes.length > 1 ? 82 : 132;
  const today = localDateValue();
  const showNames = isDay || lanes.length === 1;
  const hourRows = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
  const parts = [];

  parts.push(`<div class="cal-scroll"><div class="cal-grid ${isDay ? "is-day" : "is-week"}${laneMin < 100 ? " is-narrow" : ""}" style="--cal-columns:${range.days.length * lanes.length};--cal-lane-min:${laneMin}px;--cal-hour-h:${CAL_HOUR_HEIGHT}px;--cal-body-h:${hourRows.length * CAL_HOUR_HEIGHT}px">`);
  parts.push('<div class="cal-corner cal-corner-top"></div>');
  range.days.forEach((day) => {
    const date = new Date(`${day}T12:00:00`);
    const weekday = new Intl.DateTimeFormat("es-NI", { weekday: isDay ? "long" : "short" }).format(date).replace(".", "");
    parts.push(`<button type="button" class="cal-day-head${day === today ? " is-today" : ""}" style="grid-column: span ${lanes.length}" data-cal-goto="${day}" ${isDay ? "disabled" : ""} aria-label="Ver ${escapeHtml(formatScheduleDate(day))}"><span>${escapeHtml(weekday)}</span><strong>${date.getDate()}</strong></button>`);
  });
  parts.push('<div class="cal-corner cal-corner-lanes"><span>Hora</span></div>');
  range.days.forEach(() => {
    lanes.forEach((lane, index) => {
      parts.push(`<div class="cal-lane-head${index === 0 ? " is-day-start" : ""}" title="${escapeHtml(lane.name)}"><span class="cal-avatar" data-tone="${lane.tone}">${lane.id === CAL_UNASSIGNED ? "—" : escapeHtml(calInitials(lane.name))}</span>${showNames ? `<span class="cal-lane-name">${escapeHtml(lane.name)}</span>` : ""}</div>`);
    });
  });
  parts.push(`<div class="cal-times">${hourRows.map((hour, index) => `<span style="top:${index * CAL_HOUR_HEIGHT}px">${String(hour).padStart(2, "0")}:00</span>`).join("")}</div>`);
  range.days.forEach((day) => {
    lanes.forEach((lane, index) => {
      const laneItems = calendarState.items.filter((item) => localDateValue(item.start) === day && calendarLaneId(item) === lane.id);
      parts.push(`<div class="cal-lane${index === 0 ? " is-day-start" : ""}${day === today ? " is-today" : ""}" data-cal-day="${day}" data-cal-lane="${escapeHtml(lane.id)}" data-cal-lane-name="${escapeHtml(lane.name)}">${layoutLaneItems(laneItems).map(renderCalendarEvent).join("")}${day === today ? '<span class="cal-now" aria-hidden="true"></span>' : ""}</div>`);
    });
  });
  parts.push("</div></div>");
  if (!calendarState.items.length) parts.push('<p class="cal-empty-note">No hay citas ni solicitudes en este periodo con los filtros actuales.</p>');
  calendarBoard.innerHTML = parts.join("");
  positionNowLines();
}

function renderMonthGrid(range) {
  const today = localDateValue();
  const byDay = new Map();
  calendarState.items.forEach((item) => {
    const day = localDateValue(item.start);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(item);
  });
  const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const cells = range.days.map((day) => {
    const items = (byDay.get(day) || []).sort((a, b) => a.start - b.start);
    const chips = items.slice(0, 3).map((item) => {
      const label = `${CAL_STATUS_LABELS[item.status] || item.status}. ${formatTime(item.start)}. ${item.client}. ${item.service}.`;
      return `<button type="button" class="cal-chip${item.key === calendarState.selectedKey ? " is-selected" : ""}" data-cal-status="${escapeHtml(item.status)}" data-cal-key="${escapeHtml(item.key)}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"><span>${escapeHtml(formatTime(item.start))}</span>${escapeHtml(item.client)}</button>`;
    }).join("");
    const more = items.length > 3 ? `<button type="button" class="cal-more" data-cal-goto="${day}">+${items.length - 3} más</button>` : "";
    const dots = items.length ? `<span class="cal-month-dots" aria-hidden="true">${items.slice(0, 4).map((item) => `<i data-cal-status="${escapeHtml(item.status)}"></i>`).join("")}</span>` : "";
    return `
      <div class="cal-month-cell${day.startsWith(range.month) ? "" : " is-outside"}${day === today ? " is-today" : ""}" data-cal-goto="${day}">
        <button type="button" class="cal-month-date" data-cal-goto="${day}" aria-label="Ver ${escapeHtml(formatScheduleDate(day))}${items.length ? `, ${items.length} registros` : ""}">${Number(day.slice(8))}</button>
        <div class="cal-month-items">${chips}${more}</div>
        ${dots}
      </div>`;
  }).join("");
  calendarBoard.innerHTML = `
    <div class="cal-month">
      <div class="cal-month-head">${weekdays.map((day) => `<span>${day}</span>`).join("")}</div>
      <div class="cal-month-grid">${cells}</div>
    </div>`;
}

function positionNowLines() {
  const { startHour, endHour } = calendarState.hours;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes() - startHour * 60;
  const visible = minutes >= 0 && minutes <= (endHour - startHour) * 60;
  calendarBoard?.querySelectorAll(".cal-now").forEach((line) => {
    line.hidden = !visible || !line.closest(`[data-cal-day="${localDateValue(now)}"]`);
    line.style.top = `${minutes * CAL_PX_PER_MIN}px`;
  });
}

function updateCalendarToolbar(range) {
  if (calendarRangeLabel) calendarRangeLabel.textContent = calendarRangeText(range);
  calendarModeButtons.forEach((button) => {
    const isActive = button.dataset.calendarMode === calendarState.mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderCalendarEmployeeFilter() {
  if (!calendarEmployeeFilter) return;
  const selected = calendarEmployeeFilter.value;
  calendarEmployeeFilter.innerHTML = '<option value="">Todas las estilistas</option>';
  appointmentEmployees.forEach((employee) => {
    const option = document.createElement("option");
    option.value = employee.id;
    option.textContent = employee.full_name;
    calendarEmployeeFilter.append(option);
  });
  if (selected && appointmentEmployees.some((employee) => employee.id === selected)) calendarEmployeeFilter.value = selected;
}

function setCalendarBusy(isBusy) {
  calendarBoard?.setAttribute("aria-busy", String(isBusy));
  calendarBoard?.classList.toggle("is-busy", isBusy);
}

function renderCalendar() {
  if (!calendarBoard) return;
  const range = calendarRange();
  updateCalendarToolbar(range);
  const renderKey = `${calendarState.mode}:${range.start}:${calendarEmployeeFilter?.value || ""}`;
  const scroller = calendarBoard.querySelector(".cal-scroll");
  const previousScroll = scroller && renderKey === calendarState.renderKey ? [scroller.scrollLeft, scroller.scrollTop] : null;

  if (calendarState.mode === "month") {
    renderMonthGrid(range);
  } else {
    calendarState.lanes = calendarLanes(calendarState.items);
    calendarState.hours = calendarHours(calendarState.items);
    renderTimeGrid(range);
    const nextScroller = calendarBoard.querySelector(".cal-scroll");
    if (nextScroller && previousScroll) {
      [nextScroller.scrollLeft, nextScroller.scrollTop] = previousScroll;
    } else if (nextScroller) {
      const now = new Date();
      const focusMinutes = range.days.includes(localDateValue(now))
        ? now.getHours() * 60 + now.getMinutes() - 60
        : Math.min(...calendarState.items.map((item) => item.start.getHours() * 60), 24 * 60) - 30;
      nextScroller.scrollTop = Math.max(0, (focusMinutes - calendarState.hours.startHour * 60) * CAL_PX_PER_MIN);
      // Week view can be wider than the screen: start at the selected day.
      const focusDay = range.days.includes(localDateValue(now)) && calendarState.date === localDateValue(now) ? localDateValue(now) : calendarState.date;
      const dayLane = nextScroller.querySelector(`.cal-lane.is-day-start[data-cal-day="${focusDay}"]`);
      if (dayLane && calendarState.mode === "week") nextScroller.scrollLeft = Math.max(0, dayLane.offsetLeft - 62);
    }
  }
  calendarState.renderKey = renderKey;

  const selected = findCalendarItem(calendarState.selectedKey);
  if (!selected) calendarState.selectedKey = "";
  renderCalendarDetail(selected);
}

async function loadCalendar() {
  if (!calendarBoard) return;
  const range = calendarRange();
  updateCalendarToolbar(range);
  if (!supabase || !currentSession) {
    calendarBoard.innerHTML = '<article class="empty-state"><strong>Inicia sesión para ver el calendario</strong><p>El calendario muestra la agenda real del salón.</p></article>';
    renderCalendarDetail(null);
    return;
  }

  const seq = ++calendarState.seq;
  setCalendarBusy(true);
  if (!calendarBoard.querySelector(".cal-scroll, .cal-month")) renderLoadingState(calendarBoard, "Cargando calendario…");
  await Promise.all([loadAppointmentServices(), loadAppointmentEmployees()]);
  renderCalendarEmployeeFilter();

  const employeeId = calendarEmployeeFilter?.value || "";
  const status = calendarStatusFilter?.value || "";
  const wantRequests = Boolean(calendarShowRequests?.checked) && (!status || status === "request");
  let appointmentsQuery = null;
  if (status !== "request") {
    appointmentsQuery = supabase
      .from("appointments")
      .select(CAL_APPOINTMENT_SELECT)
      .gte("starts_at", new Date(`${range.start}T00:00:00`).toISOString())
      .lt("starts_at", new Date(`${range.end}T00:00:00`).toISOString());
    if (employeeId) appointmentsQuery = appointmentsQuery.eq("employee_id", employeeId);
    if (status) appointmentsQuery = appointmentsQuery.eq("status", status);
    appointmentsQuery = appointmentsQuery.order("starts_at", { ascending: true });
  }
  let requestsQuery = null;
  if (wantRequests) {
    requestsQuery = supabase
      .from("public_bookings")
      .select("id, service_id, preferred_employee_id, client_name, client_phone, client_email, preferred_date, preferred_time, notes, status, created_at")
      .eq("status", "pending")
      .gte("preferred_date", range.start)
      .lt("preferred_date", range.end);
    if (employeeId) requestsQuery = requestsQuery.eq("preferred_employee_id", employeeId);
    requestsQuery = requestsQuery.order("created_at", { ascending: true });
  }

  const [appointmentsResult, requestsResult] = await Promise.all([appointmentsQuery, requestsQuery]);
  if (seq !== calendarState.seq) return;
  setCalendarBusy(false);

  const error = appointmentsResult?.error || requestsResult?.error;
  if (error) {
    console.error("Calendar failed to load", error);
    calendarBoard.innerHTML = '<p class="form-message" data-tone="error">No pudimos cargar el calendario. Revisa la conexión o los permisos.</p>';
    return;
  }

  calendarState.items = [
    ...(appointmentsResult?.data || []).map(appointmentToCalendarItem),
    ...uniquePendingBookings(requestsResult?.data || []).map(bookingToCalendarItem)
  ];
  renderCalendar();
}

function renderCalendarDetail(item) {
  if (!calendarDetailBody) return;
  if (calendarDetailPanel) calendarDetailPanel.hidden = !item;
  if (!item) {
    calendarDetailBody.innerHTML = "";
    return;
  }
  const isRequest = item.kind === "request";
  const statusLabel = CAL_STATUS_LABELS[item.status] || item.status;
  const dateValue = localDateValue(item.start);
  const stylist = item.employeeName || (isRequest ? "Sin preferencia" : "Sin asignar");
  const actions = isRequest
    ? [
        '<button class="primary-button" type="button" data-cal-action="approve">Aprobar y crear cita</button>',
        '<button class="quiet-button" type="button" data-cal-action="reject">Rechazar</button>'
      ]
    : [
        ...(CAL_TRANSITIONS[item.status] || []).map(([status, label, primary]) => `<button class="${primary ? "primary-button" : "quiet-button"}" type="button" data-cal-action="status" data-cal-next="${status}">${label}</button>`),
        '<button class="quiet-button" type="button" data-cal-action="edit">Editar</button>'
      ];
  actions.push('<button class="text-button" type="button" data-cal-action="citas">Ver en Citas</button>');

  calendarDetailBody.innerHTML = `
    <div class="cal-detail-head" data-cal-status="${escapeHtml(item.status)}">
      <span class="cal-detail-badge">${escapeHtml(statusLabel)}</span>
      <h3>${escapeHtml(item.client)}</h3>
      <p>${escapeHtml(calCapitalize(formatScheduleDate(dateValue)))} · ${escapeHtml(formatTime(item.start))} – ${escapeHtml(formatTime(item.end))}</p>
    </div>
    ${isRequest ? '<p class="cal-detail-note">Solicitud online sin aprobar. Todavía no es una cita confirmada ni bloquea la agenda.</p>' : ""}
    <dl class="cal-detail-list">
      <div><dt>Servicio</dt><dd>${escapeHtml(item.service)}</dd></div>
      <div><dt>${isRequest ? "Estilista preferida" : "Estilista"}</dt><dd>${escapeHtml(stylist)}</dd></div>
      <div><dt>Duración</dt><dd>${calMinutesBetween(item.start, item.end)} min</dd></div>
      <div><dt>Teléfono</dt><dd>${escapeHtml(item.phone || "Sin teléfono")}</dd></div>
      ${item.email ? `<div><dt>Correo</dt><dd>${escapeHtml(item.email)}</dd></div>` : ""}
      ${isRequest && item.createdAt ? `<div><dt>Recibida</dt><dd>${escapeHtml(timeAgo(item.createdAt).replace("Recibida ", ""))}</dd></div>` : ""}
      <div><dt>Notas</dt><dd>${escapeHtml(item.notes || "Sin notas")}</dd></div>
    </dl>
    <div class="cal-detail-actions">${actions.join("")}</div>
  `;
}

function selectCalendarItem(key) {
  const item = findCalendarItem(key);
  if (!item) return;
  calendarState.selectedKey = key;
  calendarBoard.querySelectorAll("[data-cal-key]").forEach((node) => node.classList.toggle("is-selected", node.dataset.calKey === key));
  renderCalendarDetail(item);
  calendarDetailPanel?.focus({ preventScroll: true });
}

function closeCalendarDetail() {
  const key = calendarState.selectedKey;
  calendarState.selectedKey = "";
  calendarBoard?.querySelectorAll(".is-selected").forEach((node) => node.classList.remove("is-selected"));
  renderCalendarDetail(null);
  if (key) calendarBoard?.querySelector(`[data-cal-key="${CSS.escape(key)}"]`)?.focus({ preventScroll: true });
}

document.querySelector("#calendar-detail-close")?.addEventListener("click", closeCalendarDetail);
calendarDetailPanel?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCalendarDetail();
});

function openCalendarOn(dateValue, mode) {
  if (dateValue) calendarState.date = dateValue;
  if (mode) calendarState.mode = mode;
  showView("calendario");
}

async function openNewAppointment({ date = "", time = "", employeeId = "" } = {}) {
  if (!appointmentForm) return;
  await Promise.all([loadAppointmentServices(), loadAppointmentEmployees()]);
  resetAppointmentForm();
  if (date) appointmentForm.elements.appointment_date.value = date;
  appointmentForm.elements.appointment_time.value = time;
  appointmentForm.elements.employee_id.value = employeeId;
  openDrawer(appointmentForm);
}

async function findScheduleConflict({ appointmentId, employeeId, start, end }) {
  if (!employeeId) return "";
  const { data, error } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, appointment_services(duration_minutes)")
    .eq("employee_id", employeeId)
    .gte("starts_at", new Date(start.getTime() - 24 * 3600000).toISOString())
    .lt("starts_at", end.toISOString());
  if (error) throw error;

  const clash = (data || []).find((row) => {
    if (row.id === appointmentId || ["cancelled", "no_show"].includes(row.status)) return false;
    return appointmentToCalendarItem(row).start < end && appointmentToCalendarItem(row).end > start;
  });
  if (clash) {
    const other = appointmentToCalendarItem(clash);
    return `La estilista ya tiene una cita de ${formatTime(other.start)} a ${formatTime(other.end)} en ese horario.`;
  }

  // Shift and block tables are optional: when they are missing or empty only
  // the overlap with other appointments is validated.
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = startMinutes + calMinutesBetween(start, end);
  const [hoursResult, blocksResult] = await Promise.all([
    supabase.from("employee_working_hours").select("weekday, start_time, end_time, active").eq("employee_id", employeeId),
    supabase.from("employee_time_blocks").select("start_time, end_time, reason").eq("employee_id", employeeId).eq("block_date", localDateValue(start))
  ]);
  if (!hoursResult.error) {
    const shifts = (hoursResult.data || []).filter((shift) => shift.active !== false);
    const fits = shifts.some((shift) => Number(shift.weekday) === start.getDay()
      && calTimeToMinutes(shift.start_time) <= startMinutes
      && calTimeToMinutes(shift.end_time) >= endMinutes);
    if (shifts.length && !fits) return "Ese horario queda fuera del turno configurado para la estilista.";
  }
  if (!blocksResult.error) {
    const block = (blocksResult.data || []).find((row) => calTimeToMinutes(row.start_time) < endMinutes && calTimeToMinutes(row.end_time) > startMinutes);
    if (block) return `La estilista tiene un bloqueo en ese horario${block.reason ? ` (${block.reason})` : ""}.`;
  }
  return "";
}

async function rescheduleAppointment(item, newStart, employeeId) {
  const duration = calMinutesBetween(item.start, item.end);
  const newEnd = new Date(newStart.getTime() + duration * 60000);
  if (newStart < new Date()) {
    toast("No se puede mover una cita a una hora que ya pasó.", "error");
    return;
  }
  const employeeName = employeeId
    ? appointmentEmployees.find((employee) => employee.id === employeeId)?.full_name || item.employeeName || "la estilista"
    : "Sin asignar";

  setCalendarBusy(true);
  try {
    const problem = await findScheduleConflict({ appointmentId: item.id, employeeId, start: newStart, end: newEnd });
    if (problem) {
      toast(problem, "error");
      return;
    }
    const when = `${calCapitalize(formatScheduleDate(localDateValue(newStart)))}, ${formatTime(newStart)} – ${formatTime(newEnd)}`;
    if (!window.confirm(`¿Reprogramar la cita de ${item.client}?\n\nNuevo horario: ${when}\nEstilista: ${employeeName}`)) return;

    const { error } = await supabase
      .from("appointments")
      .update({ starts_at: newStart.toISOString(), ends_at: newEnd.toISOString(), employee_id: employeeId || null })
      .eq("id", item.id);
    if (error) throw error;

    calendarState.selectedKey = item.key;
    toast("Cita reprogramada.");
    onAgendaChanged();
  } catch (error) {
    console.error("Calendar reschedule failed", error);
    toast("No pudimos reprogramar la cita. Revisa permisos y conexión.", "error");
  } finally {
    setCalendarBusy(false);
  }
}

// Drag and drop (mouse and pen). Touch keeps native scrolling; use Editar there.
function onCalendarDragMove(event) {
  const drag = calendarState.drag;
  if (!drag) return;
  if (!drag.active) {
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
    drag.active = true;
    drag.el.classList.add("is-dragging");
    document.body.classList.add("is-cal-dragging");
    drag.preview = document.createElement("div");
    drag.preview.className = "cal-drop-preview";
  }
  event.preventDefault();
  const lane = document.elementFromPoint(event.clientX, event.clientY)?.closest(".cal-lane");
  if (!lane) {
    drag.preview.remove();
    drag.target = null;
    return;
  }
  const { startHour } = calendarState.hours;
  const duration = calMinutesBetween(drag.item.start, drag.item.end);
  const rect = lane.getBoundingClientRect();
  const offset = calSnap((event.clientY - drag.grabOffset - rect.top) / CAL_PX_PER_MIN);
  const startMinutes = Math.max(0, Math.min(24 * 60 - duration, startHour * 60 + offset));
  drag.target = { day: lane.dataset.calDay, lane: lane.dataset.calLane, startMinutes };
  drag.preview.style.top = `${(startMinutes - startHour * 60) * CAL_PX_PER_MIN}px`;
  drag.preview.style.height = `${Math.max(24, duration * CAL_PX_PER_MIN - 2)}px`;
  drag.preview.textContent = `${calMinutesToTime(startMinutes)} – ${calMinutesToTime(startMinutes + duration)} · ${lane.dataset.calLaneName || ""}`;
  if (drag.preview.parentElement !== lane) lane.append(drag.preview);
}

function onCalendarDragEnd() {
  window.removeEventListener("pointermove", onCalendarDragMove);
  const drag = calendarState.drag;
  calendarState.drag = null;
  if (!drag?.active) return;

  calendarState.suppressClick = true;
  setTimeout(() => { calendarState.suppressClick = false; }, 0);
  drag.preview?.remove();
  drag.el.classList.remove("is-dragging");
  document.body.classList.remove("is-cal-dragging");
  if (!drag.target) return;

  const newStart = new Date(`${drag.target.day}T${calMinutesToTime(drag.target.startMinutes)}`);
  const employeeId = drag.target.lane === CAL_UNASSIGNED ? "" : drag.target.lane;
  if (newStart.getTime() === drag.item.start.getTime() && employeeId === drag.item.employeeId) return;
  rescheduleAppointment(drag.item, newStart, employeeId);
}

calendarBoard?.addEventListener("pointerdown", (event) => {
  const element = event.target.closest(".cal-event.is-draggable");
  if (!element || event.button !== 0 || event.pointerType === "touch") return;
  const item = findCalendarItem(element.dataset.calKey);
  if (!item) return;
  calendarState.drag = {
    item,
    el: element,
    startX: event.clientX,
    startY: event.clientY,
    grabOffset: event.clientY - element.getBoundingClientRect().top,
    active: false,
    target: null,
    preview: null
  };
  window.addEventListener("pointermove", onCalendarDragMove);
  window.addEventListener("pointerup", onCalendarDragEnd, { once: true });
});

calendarBoard?.addEventListener("click", (event) => {
  if (calendarState.suppressClick) {
    calendarState.suppressClick = false;
    return;
  }
  const eventNode = event.target.closest("[data-cal-key]");
  if (eventNode) {
    selectCalendarItem(eventNode.dataset.calKey);
    return;
  }
  const goto = event.target.closest("[data-cal-goto]");
  if (goto && (goto.matches("button") || calendarState.mode === "month")) {
    openCalendarOn(goto.dataset.calGoto, "day");
    return;
  }
  const lane = event.target.closest(".cal-lane");
  if (!lane || !supabase || !currentSession) return;
  const minutes = calendarState.hours.startHour * 60
    + Math.floor((event.clientY - lane.getBoundingClientRect().top) / CAL_PX_PER_MIN / CAL_SNAP_MIN) * CAL_SNAP_MIN;
  openNewAppointment({
    date: lane.dataset.calDay,
    time: calMinutesToTime(minutes),
    employeeId: lane.dataset.calLane === CAL_UNASSIGNED ? "" : lane.dataset.calLane
  });
});

calendarDetailBody?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-cal-action]");
  const item = findCalendarItem(calendarState.selectedKey);
  if (!button || !item) return;
  const action = button.dataset.calAction;

  if (action === "edit") {
    editAppointment(item.id);
    return;
  }
  if (action === "citas") {
    selectedScheduleDate = localDateValue(item.start);
    if (appointmentDate) appointmentDate.value = selectedScheduleDate;
    showView("citas");
    if (item.kind === "request") {
      setTimeout(() => document.querySelector("#online-bookings-panel")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }), 60);
    }
    return;
  }
  if (action === "reject" && !window.confirm(`¿Rechazar la solicitud de ${item.client}?`)) return;

  calendarDetailBody.querySelectorAll("button").forEach((control) => control.setAttribute("disabled", ""));
  let ok = false;
  let message = "";
  if (action === "status") {
    ok = await updateAppointmentStatus(item.id, button.dataset.calNext);
    message = ok ? `Cita marcada como ${CAL_STATUS_LABELS[button.dataset.calNext].toLowerCase()}.` : "No pudimos actualizar la cita.";
  } else if (action === "approve") {
    ok = await updateBookingStatus(item.id, "approved");
    message = ok ? "Solicitud aprobada: la cita quedó confirmada." : "No pudimos aprobar la solicitud. Revisa servicio, cliente y permisos.";
  } else if (action === "reject") {
    ok = await updateBookingStatus(item.id, "rejected");
    message = ok ? "Solicitud rechazada." : "No pudimos rechazar la solicitud.";
  }
  toast(message, ok ? "success" : "error");
  if (!ok) renderCalendarDetail(item);
});

function shiftCalendar(direction) {
  const { mode, date } = calendarState;
  if (mode === "day") calendarState.date = addDays(date, direction);
  else if (mode === "week") calendarState.date = addDays(date, direction * 7);
  else {
    const next = new Date(`${date.slice(0, 7)}-01T12:00:00`);
    next.setMonth(next.getMonth() + direction);
    calendarState.date = localDateValue(next);
  }
  loadCalendar();
}

document.querySelector("#calendar-prev")?.addEventListener("click", () => shiftCalendar(-1));
document.querySelector("#calendar-next")?.addEventListener("click", () => shiftCalendar(1));
document.querySelector("#calendar-today")?.addEventListener("click", () => {
  calendarState.date = localDateValue();
  loadCalendar();
});
document.querySelector("#calendar-new-button")?.addEventListener("click", () => {
  const date = calendarState.mode === "month" && !calendarState.date.startsWith(localDateValue().slice(0, 7)) ? `${calendarState.date.slice(0, 7)}-01` : calendarState.date;
  openNewAppointment({ date });
});
calendarModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    calendarState.mode = button.dataset.calendarMode;
    loadCalendar();
  });
});
[calendarEmployeeFilter, calendarStatusFilter, calendarShowRequests].forEach((control) => control?.addEventListener("change", loadCalendar));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && calendarState.drag?.active) {
    calendarState.drag.preview?.remove();
    calendarState.drag.target = null;
  }
});
setInterval(() => {
  if (document.querySelector("#calendario.is-visible")) positionNowLines();
}, 60000);


async function initAuth() {
  await initSupabaseClient();

  if (!supabase) {
    updateAuthUI();
    setMessage(loginMessage, "Supabase no está disponible. Puedes navegar, pero el acceso real queda desactivado.", "warning");
    loadAdminData();
    return;
  }

  const { data } = await supabase.auth.getSession();
  currentSession = data.session;
  updateAuthUI();
  loadAdminData();

  supabase.auth.onAuthStateChange((_event, session) => {
    currentSession = session;
    updateAuthUI();
    if (session) loadAdminData();
  });

  if (!currentSession && document.querySelector("#dashboard")?.classList.contains("is-visible")) {
    showView("login");
  }
}

initAuth();
