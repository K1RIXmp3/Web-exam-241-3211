import { api } from "./api.js";

const PER_PAGE = 5;

const els = {
  alerts: document.getElementById("alerts"),
  btnReloadOrders: document.getElementById("btnReloadOrders"),

  ordersTbody: document.getElementById("ordersTbody"),
  ordersPagination: document.getElementById("ordersPagination"),

  detailsBody: document.getElementById("detailsBody"),

  editForm: document.getElementById("editForm"),
  editId: document.getElementById("editId"),
  editIsCourse: document.getElementById("editIsCourse"),
  editDate: document.getElementById("editDate"),
  editTime: document.getElementById("editTime"),
  editPersons: document.getElementById("editPersons"),
  editDuration: document.getElementById("editDuration"),
  editPrice: document.getElementById("editPrice"),

  eSupplementary: document.getElementById("eSupplementary"),
  ePersonalized: document.getElementById("ePersonalized"),
  eExcursions: document.getElementById("eExcursions"),
  eAssessment: document.getElementById("eAssessment"),
  eInteractive: document.getElementById("eInteractive"),

  deleteYesBtn: document.getElementById("deleteYesBtn"),
};

let state = {
  coursesMap: new Map(),
  tutorsMap: new Map(),
  orders: [],
  page: 1,
  deleteId: null,
};

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showAlert(message, type = "success") {
  const id = `a-${Math.random().toString(16).slice(2)}`;
  const div = document.createElement("div");
  div.className = `alert alert-${type} alert-dismissible fade show`;
  div.id = id;
  div.innerHTML = `
    <div>${escapeHtml(message)}</div>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  els.alerts.appendChild(div);

  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) bootstrap.Alert.getOrCreateInstance(el).close();
  }, 5000);
}

function paginate(items, page, perPage) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safe = Math.min(Math.max(1, page), totalPages);
  const start = (safe - 1) * perPage;
  return { page: safe, totalPages, slice: items.slice(start, start + perPage) };
}

function renderPagination(container, totalPages, currentPage, onClick) {
  container.innerHTML = "";

  const mk = (label, p, disabled, active = false) => {
    const li = document.createElement("li");
    li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;
    const a = document.createElement("a");
    a.className = "page-link";
    a.href = "#";
    a.textContent = label;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (!disabled) onClick(p);
    });
    li.appendChild(a);
    return li;
  };

  container.appendChild(mk("«", currentPage - 1, currentPage === 1));
  for (let p = 1; p <= totalPages; p += 1) container.appendChild(mk(String(p), p, false, p === currentPage));
  container.appendChild(mk("»", currentPage + 1, currentPage === totalPages));
}

function titleForOrder(o) {
  if (o.course_id && o.course_id !== 0) {
    const c = state.coursesMap.get(o.course_id);
    return c ? `Курс: ${c.name}` : `Курс #${o.course_id}`;
  }
  if (o.tutor_id && o.tutor_id !== 0) {
    const t = state.tutorsMap.get(o.tutor_id);
    return t ? `Репетитор: ${t.name}` : `Репетитор #${o.tutor_id}`;
  }
  return "Заявка";
}

function renderOrders() {
  const { slice, totalPages, page } = paginate(state.orders, state.page, PER_PAGE);
  state.page = page;

  els.ordersTbody.innerHTML = "";
  slice.forEach((o, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${(state.page - 1) * PER_PAGE + idx + 1}</td>
      <td class="fw-semibold">${escapeHtml(titleForOrder(o))}</td>
      <td>${escapeHtml(o.date_start)}</td>
      <td>${escapeHtml(o.time_start)}</td>
      <td class="text-end">${o.price} ₽</td>
      <td class="text-end">
        <button class="btn btn-outline-secondary btn-sm me-2" data-action="details" data-id="${o.id}">Подробнее</button>
        <button class="btn btn-outline-primary btn-sm me-2" data-action="edit" data-id="${o.id}">Изменить</button>
        <button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="${o.id}">Удалить</button>
      </td>
    `;
    els.ordersTbody.appendChild(tr);
  });

  renderPagination(els.ordersPagination, totalPages, state.page, (p) => {
    state.page = p;
    renderOrders();
  });
}

function renderDetails(o) {
  const bits = [];
  if (o.early_registration) bits.push("ранняя регистрация (-10%)");
  if (o.group_enrollment) bits.push("группа 5+ (-15%)");
  if (o.intensive_course) bits.push("интенсив (+20%)");
  if (o.supplementary) bits.push("доп. материалы");
  if (o.personalized) bits.push("индивид. занятия");
  if (o.excursions) bits.push("экскурсии");
  if (o.assessment) bits.push("оценка уровня");
  if (o.interactive) bits.push("интерактивная платформа");

  const infoTitle = titleForOrder(o);
  els.detailsBody.innerHTML = `
    <div class="mb-2 fw-semibold">${escapeHtml(infoTitle)}</div>
    <div class="text-secondary mb-2">Дата/время: ${escapeHtml(o.date_start)} ${escapeHtml(o.time_start)}</div>
    <div class="text-secondary mb-2">Студентов: ${o.persons}</div>
    <div class="text-secondary mb-2">Длительность (hours): ${o.duration}</div>
    <div class="text-secondary mb-3">Стоимость: <span class="fw-semibold">${o.price} ₽</span></div>

    <div class="fw-semibold mb-1">Опции</div>
    <div class="text-secondary">${escapeHtml(bits.length ? bits.join(", ") : "нет")}</div>
  `;

  bootstrap.Modal.getOrCreateInstance(document.getElementById("detailsModal")).show();
}

function openEdit(o) {
  els.editId.value = o.id;
  els.editIsCourse.value = String(!!(o.course_id && o.course_id !== 0));

  els.editDate.value = o.date_start;
  els.editTime.value = o.time_start;
  els.editPersons.value = o.persons;
  els.editDuration.value = o.duration;

  els.eSupplementary.checked = !!o.supplementary;
  els.ePersonalized.checked = !!o.personalized;
  els.eExcursions.checked = !!o.excursions;
  els.eAssessment.checked = !!o.assessment;
  els.eInteractive.checked = !!o.interactive;

  els.editPrice.value = `${o.price} ₽`;

  bootstrap.Modal.getOrCreateInstance(document.getElementById("editModal")).show();
}

async function initData() {
  try {
    const [courses, tutors, orders] = await Promise.all([
      api.getCourses(),
      api.getTutors(),
      api.getOrders(),
    ]);

    state.coursesMap = new Map((courses || []).map((c) => [c.id, c]));
    state.tutorsMap = new Map((tutors || []).map((t) => [t.id, t]));
    state.orders = Array.isArray(orders) ? orders : [];
    state.page = 1;

    renderOrders();
    showAlert("Заявки загружены.", "success");
  } catch (err) {
    showAlert(`Ошибка: ${err.message}`, "danger");
  }
}

/* Евенты */
els.btnReloadOrders.addEventListener("click", initData);

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);
  if (!action || !id) return;

  const order = state.orders.find((o) => o.id === id);
  if (!order) return;

  if (action === "details") renderDetails(order);
  if (action === "edit") openEdit(order);
  if (action === "delete") {
    state.deleteId = id;
    bootstrap.Modal.getOrCreateInstance(document.getElementById("deleteModal")).show();
  }
});

els.deleteYesBtn.addEventListener("click", async () => {
  try {
    if (!state.deleteId) return;

    await api.deleteOrder(state.deleteId);
    state.orders = state.orders.filter((o) => o.id !== state.deleteId);
    renderOrders();
    showAlert("Заявка удалена.", "success");

    bootstrap.Modal.getOrCreateInstance(document.getElementById("deleteModal")).hide();
    state.deleteId = null;
  } catch (err) {
    showAlert(`Ошибка удаления: ${err.message}`, "danger");
  }
});

els.editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const id = Number(els.editId.value);
    const current = state.orders.find((o) => o.id === id);

    const payload = {
      date_start: els.editDate.value,
      time_start: els.editTime.value,
      persons: Number(els.editPersons.value),
      duration: Number(els.editDuration.value),

      supplementary: els.eSupplementary.checked,
      personalized: els.ePersonalized.checked,
      excursions: els.eExcursions.checked,
      assessment: els.eAssessment.checked,
      interactive: els.eInteractive.checked,

      early_registration: current?.early_registration ?? false,
      group_enrollment: current?.group_enrollment ?? false,
      intensive_course: current?.intensive_course ?? false,
    };

    const updated = await api.updateOrder(id, payload);
    state.orders = state.orders.map((o) => (o.id === id ? updated : o));
    renderOrders();

    showAlert("Заявка обновлена.", "success");
    bootstrap.Modal.getOrCreateInstance(document.getElementById("editModal")).hide();
  } catch (err) {
    showAlert(`Ошибка редактирования: ${err.message}`, "danger");
  }
});

/* Инит */
(function boot() {
  initData();
})();
