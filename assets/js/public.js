import { initSupabaseClient } from "./supabase-client.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const form = $("#booking-form");
const message = $("#booking-message");
const serviceOptions = $("#booking-service");
const timeSlots = $("#booking-time");
const steps = $$("[data-booking-step]");
const indicators = $$("[data-step-indicator]");
const prevButton = $("#booking-prev");
const nextButton = $("#booking-next");
const submitButton = $("#booking-submit");
const summary = $("#booking-summary");
const done = $("#booking-done");
const doneDetail = $("#booking-done-detail");
const controls = $(".booking-controls");
const publicServiceList = $("#public-service-list");
const publicProductList = $("#public-product-list");

// Used when Supabase is reachable but has no working hours for the chosen day.
const FALLBACK_TIMES = ["10:00", "11:30", "14:00", "15:30", "17:00"];
const STEP_MESSAGES = [
  "Selecciona el servicio que quieres reservar.",
  "Elige una fecha y una hora para solicitar la cita.",
  "Escribe tu nombre y un teléfono válido para que podamos confirmar.",
  ""
];

let currentStep = 0;
let services = [];
let slotRequest = 0;

const money = (value) => Number(value).toLocaleString("es-NI");
const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : "");
const dateFormatter = new Intl.DateTimeFormat("es-NI", { weekday: "long", day: "numeric", month: "long" });

function setMessage(text, tone = "") {
  if (!message) return;
  message.textContent = text;
  message.dataset.tone = tone;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function localDateValue(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDate(value) {
  if (!value) return "";
  const text = dateFormatter.format(new Date(`${value}T12:00:00`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function timeToMinutes(value) {
  const [hours, minutes] = String(value || "").slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function formatTime(value) {
  const minutes = timeToMinutes(value);
  const hours = Math.floor(minutes / 60);
  const suffix = hours < 12 ? "a. m." : "p. m.";
  return `${((hours + 11) % 12) + 1}:${String(minutes % 60).padStart(2, "0")} ${suffix}`;
}

const fieldValue = (name) => String(form?.elements[name]?.value ?? "").trim();
const selectedService = () => services.find((service) => service.id === fieldValue("service_id"));

/* ---------- Summary ---------- */

function updateSummary() {
  if (!summary) return;
  const service = selectedService();
  const name = fieldValue("client_name");
  const phone = fieldValue("client_phone");
  const values = {
    service: service ? `${service.name} · C$ ${money(service.base_price)} · ${service.duration_minutes} min` : "Pendiente",
    date: formatDate(fieldValue("preferred_date")) || "Pendiente",
    time: fieldValue("preferred_time") ? formatTime(fieldValue("preferred_time")) : "Pendiente",
    contact: name && phone ? `${name} · ${phone}` : "Pendiente"
  };
  Object.entries(values).forEach(([key, value]) => {
    $(`[data-summary="${key}"]`, summary).textContent = value;
  });
}

/* ---------- Steps ---------- */

function stepIsValid(index) {
  if (!form) return false;
  if (index === 0) return Boolean(selectedService());
  if (index === 1) return form.elements.preferred_date.checkValidity() && Boolean(fieldValue("preferred_time"));
  if (index === 2) return form.elements.client_name.checkValidity() && form.elements.client_phone.checkValidity();
  return true;
}

function firstInvalidStep() {
  return [0, 1, 2].find((index) => !stepIsValid(index)) ?? -1;
}

function showStep(index, { focus = true } = {}) {
  if (!steps.length) return;
  currentStep = Math.max(0, Math.min(index, steps.length - 1));
  const last = steps.length - 1;

  steps.forEach((step, i) => step.classList.toggle("is-active", i === currentStep));
  indicators.forEach((indicator, i) => {
    indicator.classList.toggle("is-active", i === currentStep);
    indicator.classList.toggle("is-complete", i < currentStep);
    const button = $("button", indicator);
    button.disabled = i > currentStep;
    if (i === currentStep) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });

  prevButton?.classList.toggle("is-invisible", currentStep === 0);
  nextButton?.classList.toggle("is-hidden", currentStep === last);
  submitButton?.classList.toggle("is-hidden", currentStep !== last);
  setMessage("");
  updateSummary();

  if (!focus) return;
  const active = steps[currentStep];
  active.focus({ preventScroll: true });
  const top = form.getBoundingClientRect().top;
  if (top < 0 || top > window.innerHeight * 0.6) form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function reportStep(index) {
  const field = [
    () => $("input[name='service_id']", serviceOptions),
    () => (!form.elements.preferred_date.checkValidity() ? form.elements.preferred_date : $("input[name='preferred_time']", timeSlots)),
    () => [form.elements.client_name, form.elements.client_phone].find((input) => !input.checkValidity())
  ][index]?.();
  field?.setAttribute("aria-invalid", "true");
  field?.focus();
  setMessage(STEP_MESSAGES[index], "warning");
}

function goToStep(index) {
  // Moving forward requires every step before the target to be valid.
  for (let i = currentStep; i < index; i += 1) {
    if (!stepIsValid(i)) {
      showStep(i);
      reportStep(i);
      return;
    }
  }
  showStep(index);
}

/* ---------- Services ---------- */

function renderServiceOptions(list) {
  serviceOptions.removeAttribute("aria-busy");
  serviceOptions.replaceChildren();
  list.forEach((service) => {
    const option = el("label", "service-option");
    const input = el("input");
    Object.assign(input, { type: "radio", name: "service_id", value: service.id, required: true });
    const body = el("span", "service-option-body");
    body.append(el("strong", "", service.name), el("span", "", `${service.duration_minutes} min${service.category ? ` · ${capitalize(service.category)}` : ""}`));
    option.append(input, body, el("span", "service-option-price", `C$ ${money(service.base_price)}`));
    serviceOptions.append(option);
  });
}

function renderServiceError() {
  serviceOptions.removeAttribute("aria-busy");
  const state = el("div", "options-state is-error");
  const retry = el("button", "text-link", "Intentar de nuevo");
  retry.type = "button";
  retry.addEventListener("click", () => {
    serviceOptions.setAttribute("aria-busy", "true");
    serviceOptions.replaceChildren(el("p", "options-state", "Cargando servicios disponibles…"));
    loadServices();
  });
  state.append(el("p", "", "No pudimos cargar los servicios en este momento. Revisa tu conexión o escríbenos para agendar."), retry);
  serviceOptions.replaceChildren(state);
}

function renderPublicServices(list) {
  if (!publicServiceList || !list.length) return;
  publicServiceList.replaceChildren(
    ...list.slice(0, 4).map((service, index) => {
      const card = el("article", `public-service-card${index === 0 ? " featured" : ""}`);
      const meta = el("span", "", capitalize(service.category) || `${service.duration_minutes} min`);
      const description = el("p", "", service.description || `Sesión de ${service.duration_minutes} minutos aproximados.`);
      const aside = el("div", "public-service-action");
      const book = el("button", "text-link", "Reservar");
      book.type = "button";
      book.dataset.bookService = service.id;
      book.setAttribute("aria-label", `Reservar ${service.name}`);
      aside.append(el("strong", "", `C$ ${money(service.base_price)}`), book);
      card.append(meta, el("h3", "", service.name), description, aside);
      return card;
    })
  );
}

async function loadServices() {
  const supabase = await initSupabaseClient();
  if (!supabase) return renderServiceError();

  const { data, error } = await supabase
    .from("services")
    .select("id, name, category, description, base_price, duration_minutes")
    .eq("active", true)
    .eq("online_booking_enabled", true)
    .order("name");

  if (error || !data?.length) return renderServiceError();
  services = data;
  renderServiceOptions(data);
  renderPublicServices(data);
}

function bookService(serviceId) {
  const input = $(`input[name='service_id'][value='${CSS.escape(serviceId)}']`, serviceOptions);
  if (!input) return;
  input.checked = true;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  showStep(1, { focus: false });
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  steps[1].focus({ preventScroll: true });
}

/* ---------- Products ---------- */

const productsNote = $("#products-note");
const SVG_NS = "http://www.w3.org/2000/svg";

// Illustration and tint per category until the product has its own photo.
function productArt(category = "") {
  const key = category.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/cuidado|aceite|cuticula|crema/.test(key)) return { art: "dropper", tone: "amber" };
  if (/acrilico|monomero|liquido/.test(key)) return { art: "liquid", tone: "stone" };
  if (/prepara|base/.test(key)) return { art: "bottle", tone: "rose" };
  return { art: "bottle", tone: "clear" };
}

function productStock(product) {
  if (product.current_stock === undefined) return { stock: "in", label: "Disponible en el salón" };
  if (Number(product.current_stock) <= 0) return { stock: "out", label: "Agotado" };
  if (Number(product.current_stock) <= Number(product.minimum_stock || 0)) return { stock: "low", label: "Pocas unidades" };
  return { stock: "in", label: "Disponible" };
}

function productCard(product) {
  const { art, tone } = productArt(product.category);
  const { stock, label } = productStock(product);
  const card = el("article", "product-card");
  card.dataset.stock = stock;

  const media = el("div", "product-media");
  media.dataset.tone = tone;
  if (product.image_url) {
    const img = el("img");
    Object.assign(img, { src: product.image_url, alt: product.name, loading: "lazy", decoding: "async", width: 400, height: 500 });
    media.append(img);
  } else {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "product-art");
    svg.setAttribute("viewBox", "0 0 120 150");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", `Ilustración de ${product.name}`);
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", `#product-${art}`);
    svg.append(use);
    media.append(svg);
  }
  if (product.category) media.append(el("span", "product-category", capitalize(product.category)));

  const body = el("div", "product-body");
  const stockLine = el("p", "product-stock");
  const dot = el("span", "stock-dot");
  dot.setAttribute("aria-hidden", "true");
  stockLine.append(dot, label);

  const foot = el("div", "product-foot");
  foot.append(el("strong", "product-price", product.sale_price ? `C$ ${money(product.sale_price)}` : "Precio en el salón"));
  if (stock === "out") {
    foot.append(el("span", "product-unavailable", "Pregunta por reposición"));
  } else {
    const order = el("button", "product-order", "Pedir en mi cita");
    order.type = "button";
    order.dataset.orderProduct = product.brand ? `${product.name} (${product.brand})` : product.name;
    foot.append(order);
  }

  body.append(
    el("p", "product-brand", product.brand || "MALIS NAILS"),
    el("h3", "", product.name),
    el("p", "product-desc", product.description || "Producto profesional usado y recomendado por el salón."),
    stockLine,
    foot
  );
  card.append(media, body);
  return card;
}

async function loadProducts() {
  const supabase = await initSupabaseClient();
  if (!supabase || !publicProductList) return;

  // Add description, sale_price, image_url and stock columns here once they exist in Supabase.
  const { data, error } = await supabase
    .from("products")
    .select("id, name, brand, category")
    .eq("active", true)
    .eq("public_visible", true)
    .limit(8);

  if (error || !data?.length) return; // Keep the example cards in the HTML.
  publicProductList.replaceChildren(...data.map(productCard));
  syncOrderButtons();
}

/* Products requested for pickup travel with the booking as a notes line. */
const ORDER_PREFIX = "Productos para llevar: ";

function orderedProducts() {
  const line = (form?.elements.notes.value || "").split("\n").find((text) => text.startsWith(ORDER_PREFIX));
  return line ? line.slice(ORDER_PREFIX.length).split("; ").filter(Boolean) : [];
}

function setOrderedProducts(list) {
  const notes = form.elements.notes;
  const others = notes.value.split("\n").filter((text) => text && !text.startsWith(ORDER_PREFIX));
  notes.value = [...(list.length ? [ORDER_PREFIX + list.join("; ")] : []), ...others].join("\n");
  syncOrderButtons();
}

function syncOrderButtons() {
  const list = orderedProducts();
  $$("[data-order-product]").forEach((button) => {
    const added = list.includes(button.dataset.orderProduct);
    button.setAttribute("aria-pressed", String(added));
    button.textContent = added ? "Agregado" : "Pedir en mi cita";
  });
  if (!productsNote) return;
  productsNote.replaceChildren();
  if (!list.length) return;
  const link = el("a", "text-link", "Continuar con la reserva");
  link.href = "#reserva";
  productsNote.append(`${list.length === 1 ? "1 producto quedará apartado" : `${list.length} productos quedarán apartados`} para tu cita. `, link);
}

function toggleProductOrder(name) {
  if (!form) return;
  const list = orderedProducts();
  setOrderedProducts(list.includes(name) ? list.filter((item) => item !== name) : [...list, name]);
}

/* ---------- Time slots ---------- */

function renderSlots(slots, note = "") {
  const previous = fieldValue("preferred_time");
  const unique = [...new Set(slots.map((slot) => String(slot).slice(0, 5)))].sort();
  timeSlots.removeAttribute("aria-busy");

  if (!unique.length) {
    const closed = new Date(`${fieldValue("preferred_date")}T12:00:00`).getDay() === 0;
    timeSlots.replaceChildren(el("p", "options-state", closed ? "El salón atiende de lunes a sábado. Elige otra fecha." : "No quedan horas libres ese día. Prueba con otra fecha."));
    updateSummary();
    return;
  }

  const grid = el("div", "time-slot-grid");
  unique.forEach((slot) => {
    const label = el("label", "time-slot");
    const input = el("input");
    Object.assign(input, { type: "radio", name: "preferred_time", value: slot, required: true, checked: slot === previous });
    label.append(input, el("span", "", formatTime(slot)));
    grid.append(label);
  });
  timeSlots.replaceChildren(grid);
  if (note) timeSlots.append(el("p", "options-note", note));
  updateSummary();
}

async function localSlots(supabase, dateValue) {
  const weekday = new Date(`${dateValue}T12:00:00`).getDay();
  const [{ data: hours, error }, { data: blocks }] = await Promise.all([
    supabase.from("employee_working_hours").select("employee_id, start_time, end_time").eq("weekday", weekday).eq("active", true),
    supabase.from("employee_time_blocks").select("employee_id, start_time, end_time").eq("block_date", dateValue)
  ]);
  if (error || !hours?.length) return null;

  const duration = Number(selectedService()?.duration_minutes || 60);
  const slots = [];
  hours.forEach((hour) => {
    const own = (blocks || []).filter((block) => block.employee_id === hour.employee_id);
    for (let slot = timeToMinutes(hour.start_time); slot + duration <= timeToMinutes(hour.end_time); slot += 30) {
      const blocked = own.some((block) => slot < timeToMinutes(block.end_time) && slot + duration > timeToMinutes(block.start_time));
      if (!blocked) slots.push(minutesToTime(slot));
    }
  });
  return slots;
}

async function loadSlots() {
  const dateValue = fieldValue("preferred_date");
  if (!dateValue) {
    timeSlots.replaceChildren(el("p", "options-state", "Elige una fecha para ver las horas disponibles."));
    return;
  }

  const request = ++slotRequest;
  timeSlots.setAttribute("aria-busy", "true");
  timeSlots.replaceChildren(el("p", "options-state is-loading", "Buscando horas disponibles…"));

  const supabase = await initSupabaseClient();
  let slots = null;
  if (supabase && selectedService()) {
    const { data, error } = await supabase.rpc("get_public_available_slots", { p_date: dateValue, p_service_id: selectedService().id });
    if (!error && data) slots = data.map((item) => item.slot);
  }
  if (!slots && supabase) slots = await localSlots(supabase, dateValue);
  if (request !== slotRequest) return; // A newer date or service was chosen meanwhile.

  if (slots) renderSlots(slots);
  else if (new Date(`${dateValue}T12:00:00`).getDay() === 0) renderSlots([], "");
  else renderSlots(FALLBACK_TIMES, "Horario de referencia: el equipo confirmará la hora exacta.");
}

/* ---------- Submit ---------- */

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Enviando…" : "Enviar solicitud";
  form.setAttribute("aria-busy", String(isSubmitting));
}

function showDone(payload) {
  const service = selectedService();
  const article = timeToMinutes(payload.preferred_time) < 120 && timeToMinutes(payload.preferred_time) >= 60 ? "a la" : "a las";
  doneDetail.textContent = `Te contactaremos al ${payload.client_phone} para confirmar ${service?.name || "tu cita"} el ${formatDate(payload.preferred_date).toLowerCase()} ${article} ${formatTime(payload.preferred_time)}`;
  steps.forEach((step) => step.classList.remove("is-active"));
  $(".booking-steps", form).hidden = true;
  controls.hidden = true;
  done.hidden = false;
  done.focus();
}

function restart() {
  form.reset();
  syncOrderButtons();
  done.hidden = true;
  controls.hidden = false;
  $(".booking-steps", form).hidden = false;
  loadSlots();
  showStep(0);
}

async function submitBooking(event) {
  event.preventDefault();
  const invalid = firstInvalidStep();
  if (invalid >= 0) {
    showStep(invalid);
    reportStep(invalid);
    return;
  }

  setSubmitting(true);
  setMessage("");
  const supabase = await initSupabaseClient();
  if (!supabase) {
    setSubmitting(false);
    setMessage("No hay conexión con el sistema de reservas. Intenta de nuevo en unos minutos.", "error");
    return;
  }

  const payload = {
    service_id: fieldValue("service_id") || null,
    client_name: fieldValue("client_name"),
    client_phone: fieldValue("client_phone"),
    preferred_date: fieldValue("preferred_date"),
    preferred_time: fieldValue("preferred_time"),
    notes: fieldValue("notes") || null,
    status: "pending"
  };

  const { error } = await supabase.from("public_bookings").insert(payload);
  setSubmitting(false);
  if (error) {
    setMessage("No pudimos enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo; tus datos siguen aquí.", "error");
    return;
  }
  showDone(payload);
}

/* ---------- Mobile CTA ---------- */

function watchBookingVisibility() {
  const cta = $(".public-mobile-cta");
  const section = $("#reserva");
  if (!cta || !section || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(([entry]) => cta.classList.toggle("is-away", entry.isIntersecting), { rootMargin: "0px 0px -20% 0px" }).observe(section);
}

/* ---------- Wiring ---------- */

if (form) {
  form.elements.preferred_date.min = localDateValue();

  form.addEventListener("submit", submitBooking);
  nextButton?.addEventListener("click", () => goToStep(currentStep + 1));
  prevButton?.addEventListener("click", () => showStep(currentStep - 1));
  $("#booking-restart")?.addEventListener("click", restart);

  form.addEventListener("click", (event) => {
    const target = event.target.closest("[data-step-target]");
    if (target) goToStep(Number(target.dataset.stepTarget));
  });

  form.addEventListener("input", (event) => {
    event.target.removeAttribute("aria-invalid");
    if (event.target.name === "notes") syncOrderButtons();
    updateSummary();
  });

  form.addEventListener("change", (event) => {
    const { name } = event.target;
    if (name === "preferred_date" || name === "service_id") loadSlots();
    if (name === "service_id" && currentStep === 0) setMessage("");
    updateSummary();
  });

  // Enter in a text field advances instead of submitting an incomplete request.
  form.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.target.tagName === "TEXTAREA" || event.target.tagName === "BUTTON") return;
    if (currentStep < steps.length - 1) {
      event.preventDefault();
      goToStep(currentStep + 1);
    }
  });

  showStep(0, { focus: false });
  loadServices();
}

publicServiceList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-book-service]");
  if (button) bookService(button.dataset.bookService);
});

publicProductList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-order-product]");
  if (button) toggleProductOrder(button.dataset.orderProduct);
});

syncOrderButtons();
loadProducts();
watchBookingVisibility();
