import { api } from "./api.js";

const PER_PAGE = 5;

const els = {
  alerts: document.getElementById("alerts"),

  // courses
  btnReloadCourses: document.getElementById("btnReloadCourses"),
  courseSearchForm: document.getElementById("courseSearchForm"),
  courseQuery: document.getElementById("courseQuery"),
  courseLevel: document.getElementById("courseLevel"),
  coursesTbody: document.getElementById("coursesTbody"),
  coursesPagination: document.getElementById("coursesPagination"),

  // tutors
  tutorsTbody: document.getElementById("tutorsTbody"),
  tutorLanguage: document.getElementById("tutorLanguage"),
  tutorLevel: document.getElementById("tutorLevel"),
  tutorExperience: document.getElementById("tutorExperience"),
  btnTutorOrder: document.getElementById("btnTutorOrder"),

  // course details
  courseDetailsBody: document.getElementById("courseDetailsBody"),
  courseApplyBtn: document.getElementById("courseApplyBtn"),

  // order modal
  orderModalTitle: document.getElementById("orderModalTitle"),
  modeBadge: document.getElementById("modeBadge"),
  earlyBadge: document.getElementById("earlyBadge"),
  groupBadge: document.getElementById("groupBadge"),
  intensiveBadge: document.getElementById("intensiveBadge"),

  orderForm: document.getElementById("orderForm"),
  orderCourseName: document.getElementById("orderCourseName"),
  orderTeacherName: document.getElementById("orderTeacherName"),
  orderDate: document.getElementById("orderDate"),
  orderTime: document.getElementById("orderTime"),
  dateHelp: document.getElementById("dateHelp"),
  timeHelp: document.getElementById("timeHelp"),

  orderTutorDuration: document.getElementById("orderTutorDuration"),
  orderPersons: document.getElementById("orderPersons"),

  optSupplementary: document.getElementById("optSupplementary"),
  optPersonalized: document.getElementById("optPersonalized"),
  optExcursions: document.getElementById("optExcursions"),
  optAssessment: document.getElementById("optAssessment"),
  optInteractive: document.getElementById("optInteractive"),

  orderDurationInfo: document.getElementById("orderDurationInfo"),
  orderPrice: document.getElementById("orderPrice"),

  autoEarly: document.getElementById("autoEarly"),
  autoGroup: document.getElementById("autoGroup"),
  autoIntensive: document.getElementById("autoIntensive"),
};

const state = {
  courses: [],
  coursesFiltered: [],
  coursesPage: 1,

  tutors: [],
  tutorsFiltered: [],

  selectedCourse: null,
  selectedTutor: null,

  orderMode: "course", // "course" | "tutor"
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

/* COURSES  */
function applyCourseFilters() {
  const q = (els.courseQuery.value || "").trim().toLowerCase();
  const lvl = (els.courseLevel.value || "").trim();

  state.coursesFiltered = state.courses.filter((c) => {
    const okName = !q || String(c.name || "").toLowerCase().includes(q);
    const okLvl = !lvl || c.level === lvl;
    return okName && okLvl;
  });

  state.coursesPage = 1;
  renderCourses();
}

function renderCourses() {
  const { slice, totalPages, page } = paginate(state.coursesFiltered, state.coursesPage, PER_PAGE);
  state.coursesPage = page;

  els.coursesTbody.innerHTML = "";

  slice.forEach((c) => {
    const tr = document.createElement("tr");
    const desc = c.description || "";
    const short = desc.length > 90 ? `${desc.slice(0, 90)}...` : desc;

    tr.innerHTML = `
      <td>
        <div class="fw-semibold">${escapeHtml(c.name)}</div>
        <div class="text-secondary small text-truncate" style="max-width: 520px;" title="${escapeHtml(desc)}">
          ${escapeHtml(short)}
        </div>
      </td>
      <td><span class="badge text-bg-light border">${escapeHtml(c.level)}</span></td>
      <td>${escapeHtml(c.teacher || "")}</td>
      <td class="text-end">${c.course_fee_per_hour} ₽</td>
      <td class="text-end">
        <button class="btn btn-outline-secondary btn-sm me-2" data-action="course-details" data-id="${c.id}">
          Подробнее
        </button>
        <button class="btn btn-primary btn-sm" data-action="course-apply" data-id="${c.id}">
          Подать заявку
        </button>
      </td>
    `;
    els.coursesTbody.appendChild(tr);
  });

  renderPagination(els.coursesPagination, totalPages, state.coursesPage, (p) => {
    state.coursesPage = p;
    renderCourses();
  });
}

function openCourseDetails(course) {
  state.selectedCourse = course;

  const starts = Array.isArray(course.start_dates) ? course.start_dates : [];
  els.courseDetailsBody.innerHTML = `
    <div class="fw-semibold mb-1">${escapeHtml(course.name)}</div>
    <div class="text-secondary mb-3">${escapeHtml(course.description || "")}</div>

    <div class="row g-2">
      <div class="col-md-6">
        <div class="p-3 bg-light rounded">
          <div class="small text-secondary">Преподаватель</div>
          <div class="fw-semibold">${escapeHtml(course.teacher || "")}</div>
          <div class="mt-2 small text-secondary">Уровень</div>
          <div class="fw-semibold">${escapeHtml(course.level)}</div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="p-3 bg-light rounded">
          <div class="small text-secondary">Длительность</div>
          <div class="fw-semibold">${course.total_length} недель</div>
          <div class="mt-2 small text-secondary">Часов в неделю</div>
          <div class="fw-semibold">${course.week_length}</div>
          <div class="mt-2 small text-secondary">Цена/час</div>
          <div class="fw-semibold">${course.course_fee_per_hour} ₽</div>
        </div>
      </div>
    </div>

    <hr>
    <div class="fw-semibold mb-2">Доступные старты (из API)</div>
    <ul class="mb-0">
      ${starts.slice(0, 12).map((d) => `<li class="text-secondary">${escapeHtml(d)}</li>`).join("")}
      ${starts.length > 12 ? `<li class="text-secondary">...и ещё ${starts.length - 12}</li>` : ""}
    </ul>
  `;

  bootstrap.Modal.getOrCreateInstance(document.getElementById("courseDetailsModal")).show();
}

/*  TUTORS */
function collectTutorLanguages(tutors) {
  const set = new Set();
  tutors.forEach((t) => {
    (t.languages_offered || []).forEach((l) => set.add(l));
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function renderTutorLanguageSelect() {
  const langs = collectTutorLanguages(state.tutors);
  els.tutorLanguage.innerHTML = `<option value="">Любой</option>` + langs.map((l) => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join("");
}

function applyTutorFilters() {
  const lang = (els.tutorLanguage.value || "").trim();
  const lvl = (els.tutorLevel.value || "").trim();
  const expMin = Number(els.tutorExperience.value || "0");

  state.tutorsFiltered = state.tutors.filter((t) => {
    const okLang = !lang || (t.languages_offered || []).includes(lang);
    const okLvl = !lvl || t.language_level === lvl;
    const okExp = !Number.isFinite(expMin) || t.work_experience >= expMin;
    return okLang && okLvl && okExp;
  });

  renderTutors();
}

function renderTutors() {
  els.tutorsTbody.innerHTML = "";

  state.tutorsFiltered.forEach((t) => {
    const tr = document.createElement("tr");
    if (state.selectedTutor && state.selectedTutor.id === t.id) tr.classList.add("table-primary");

    const langs = (t.languages_offered || []).join(", ");
    tr.innerHTML = `
      <td>
        <img src="assets/tutor.png" alt="Фото" width="44" height="44" class="rounded-circle border">
      </td>
      <td class="fw-semibold">${escapeHtml(t.name)}</td>
      <td>${escapeHtml(t.language_level)}</td>
      <td class="text-secondary">${escapeHtml(langs)}</td>
      <td class="text-end">${t.work_experience}</td>
      <td class="text-end">${t.price_per_hour} ₽/ч</td>
      <td class="text-end">
        <button class="btn btn-outline-primary btn-sm" data-action="tutor-select" data-id="${t.id}">
          Выбрать
        </button>
      </td>
    `;
    els.tutorsTbody.appendChild(tr);
  });
}

/*  ORDER MODAL  */
function ymd(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addMinutesHHMM(hhmm, minutes) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor((total % (24 * 60)) / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function parseStartDatesByDay(start_dates = []) {
  const map = new Map(); // date -> [timeStart]
  start_dates.forEach((dt) => {
    // ожидаем "YYYY-MM-DDTHH:MM:SS"
    const [datePart, timePart] = String(dt).split("T");
    if (!datePart || !timePart) return;
    const time = timePart.slice(0, 5);
    if (!map.has(datePart)) map.set(datePart, []);
    map.get(datePart).push(time);
  });
  // уникализируем и сортируем времена
  for (const [k, arr] of map.entries()) {
    map.set(k, Array.from(new Set(arr)).sort());
  }
  return map;
}

function fillOrderDatesForCourse(course) {
  const byDay = parseStartDatesByDay(course.start_dates || []);
  const dates = Array.from(byDay.keys()).sort();

  els.orderDate.innerHTML = dates.map((d) => `<option value="${d}">${d}</option>`).join("");
  els.orderTime.innerHTML = "";
  els.orderTime.disabled = true;

  els.dateHelp.textContent = "Даты берутся из API для выбранного курса.";
  els.timeHelp.textContent = "Сначала выберите дату.";
  els.orderDate.onchange = () => {
    const d = els.orderDate.value;
    const times = byDay.get(d) || [];
    const sessionMinutes = Number(course.week_length || 1) * 60;

    els.orderTime.innerHTML = times.map((t) => {
      const end = addMinutesHHMM(t, sessionMinutes);
      return `<option value="${t}">${t}–${end}</option>`;
    }).join("");

    els.orderTime.disabled = times.length === 0;
    els.timeHelp.textContent = times.length ? "Время берётся из API. В заявку отправляется только время начала." : "Нет доступных времён для даты.";
    recalcPrice();
  };

  // автоселект первой даты
  if (dates.length) {
    els.orderDate.value = dates[0];
    els.orderDate.onchange();
  } else {
    els.dateHelp.textContent = "У курса нет доступных дат старта (start_dates).";
  }
}

function fillOrderDatesForTutor() {
  // ближайшие 30 дней
  const today = new Date();
  const options = [];
  for (let i = 0; i < 30; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    options.push(ymd(d));
  }
  els.orderDate.innerHTML = options.map((d) => `<option value="${d}">${d}</option>`).join("");

  // времена 09:00..20:00
  const times = [];
  for (let h = 9; h <= 20; h += 1) times.push(`${String(h).padStart(2, "0")}:00`);
  els.orderTime.innerHTML = times.map((t) => `<option value="${t}">${t}</option>`).join("");
  els.orderTime.disabled = false;

  els.dateHelp.textContent = "Для репетитора можно выбрать любую дату (генерируется на клиенте).";
  els.timeHelp.textContent = "Выберите время начала занятия.";
}

function setModeBadges() {
  els.modeBadge.textContent = state.orderMode === "course" ? "Заявка: курс" : "Заявка: репетитор";
}

function setAutoBadges({ early, group, intensive }) {
  els.earlyBadge.classList.toggle("d-none", !early);
  els.groupBadge.classList.toggle("d-none", !group);
  els.intensiveBadge.classList.toggle("d-none", !intensive);

  els.autoEarly.value = early ? "1" : "0";
  els.autoGroup.value = group ? "1" : "0";
  els.autoIntensive.value = intensive ? "1" : "0";
}

function isWeekend(ymdStr) {
  const [y, m, d] = ymdStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay(); // 0 Sun, 6 Sat
  return day === 0 || day === 6;
}

function minutesFromHHMM(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function recalcPrice() {
  const persons = Number(els.orderPersons.value || "1");
  const dateStart = els.orderDate.value;
  const timeStart = els.orderTime.value || "09:00";

  const dayMult = isWeekend(dateStart) ? 1.5 : 1;
  const tMin = minutesFromHHMM(timeStart);

  const morning = (tMin >= 9 * 60 && tMin < 12 * 60) ? 400 : 0;
  const evening = (tMin >= 18 * 60 && tMin < 20 * 60) ? 1000 : 0;

  // опции пользователя
  const supplementary = !!els.optSupplementary.checked;
  const personalized = !!els.optPersonalized.checked;
  const excursions = !!els.optExcursions.checked;
  const assessment = !!els.optAssessment.checked;
  const interactive = !!els.optInteractive.checked;

  let feePerHour = 0;
  let durationHours = 1;
  let weeks = 0;

  let intensive = false;

  if (state.orderMode === "course" && state.selectedCourse) {
    const c = state.selectedCourse;
    feePerHour = Number(c.course_fee_per_hour || 0);
    weeks = Number(c.total_length || 0);
    const weekHours = Number(c.week_length || 0);
    durationHours = weeks * weekHours;

    intensive = weekHours >= 5; // авто
    // инфо о длительности + дата окончания (последнее занятие раз в неделю)
    const [yy, mm, dd] = dateStart.split("-").map(Number);
    const start = new Date(yy, mm - 1, dd);
    const end = new Date(start);
    end.setDate(start.getDate() + Math.max(0, weeks - 1) * 7);

    els.orderDurationInfo.value = `${weeks} нед. (${weekHours} ч/нед), всего ${durationHours} ч. Окончание: ${ymd(end)}`;
  } else if (state.orderMode === "tutor" && state.selectedTutor) {
    const t = state.selectedTutor;
    feePerHour = Number(t.price_per_hour || 0);
    durationHours = Number(els.orderTutorDuration.value || "1");
    weeks = 0;
    intensive = false;

    els.orderDurationInfo.value = `${durationHours} ч. (репетитор)`;
  }

  // авто-скидки/надбавки
  const group = persons >= 5;

  // ранняя регистрация: >= 30 дней до старта
  const today = new Date();
  const [yy, mm, dd] = dateStart.split("-").map(Number);
  const startDate = new Date(yy, mm - 1, dd);
  const diffDays = Math.floor((startDate - today) / (1000 * 60 * 60 * 24));
  const early = diffDays >= 30;

  setAutoBadges({ early, group, intensive });

  // базовая формула
  let total = ((feePerHour * durationHours * dayMult) + morning + evening) * persons;

  // доп. опции (плоские добавки)
  if (supplementary) total += 2000 * persons;
  if (personalized && weeks > 0) total += 1500 * weeks;
  if (assessment) total += 300;

  // мультипликаторы
  if (excursions) total *= 1.25;
  if (interactive) total *= 1.5;
  if (intensive) total *= 1.2;

  // скидки
  if (early) total *= 0.9;
  if (group) total *= 0.85;

  total = Math.round(total);
  els.orderPrice.value = `${total} ₽`;
  return total;
}

function openOrderModal(mode) {
  state.orderMode = mode;
  setModeBadges();

  // сброс чекбоксов
  els.optSupplementary.checked = false;
  els.optPersonalized.checked = false;
  els.optExcursions.checked = false;
  els.optAssessment.checked = false;
  els.optInteractive.checked = false;

  els.orderPersons.value = "1";
  els.orderTutorDuration.value = "1";

  if (mode === "course") {
    const c = state.selectedCourse;
    els.orderCourseName.value = c ? c.name : "";
    els.orderTeacherName.value = c ? c.teacher : "";
    fillOrderDatesForCourse(c);
    els.orderTutorDuration.closest(".col-12")?.classList?.add?.("d-none"); // можно скрыть, но оставим как есть
  } else {
    const t = state.selectedTutor;
    els.orderCourseName.value = "";
    els.orderTeacherName.value = t ? t.name : "";
    fillOrderDatesForTutor();
  }

  recalcPrice();
  bootstrap.Modal.getOrCreateInstance(document.getElementById("orderModal")).show();
}

function getOrderPayload() {
  const persons = Number(els.orderPersons.value || "1");
  const date_start = els.orderDate.value;
  const time_start = els.orderTime.value;

  const supplementary = !!els.optSupplementary.checked;
  const personalized = !!els.optPersonalized.checked;
  const excursions = !!els.optExcursions.checked;
  const assessment = !!els.optAssessment.checked;
  const interactive = !!els.optInteractive.checked;

  const early_registration = els.autoEarly.value === "1";
  const group_enrollment = els.autoGroup.value === "1";
  const intensive_course = els.autoIntensive.value === "1";

  const price = recalcPrice();

  if (state.orderMode === "course") {
    const c = state.selectedCourse;
    const duration = Number(c.total_length || 0) * Number(c.week_length || 0);

    return {
      tutor_id: 0,
      course_id: c.id,
      date_start,
      time_start,
      duration,
      persons,
      price,
      early_registration,
      group_enrollment,
      intensive_course,
      supplementary,
      personalized,
      excursions,
      assessment,
      interactive,
    };
  }

  const t = state.selectedTutor;
  const duration = Number(els.orderTutorDuration.value || "1");

  return {
    tutor_id: t.id,
    course_id: 0,
    date_start,
    time_start,
    duration,
    persons,
    price,
    early_registration,
    group_enrollment,
    intensive_course,
    supplementary,
    personalized,
    excursions,
    assessment,
    interactive,
  };
}

/* LOAD DATA */
async function loadCourses() {
  try {
    const courses = await api.getCourses();
    state.courses = Array.isArray(courses) ? courses : [];
    state.coursesFiltered = [...state.courses];
    applyCourseFilters();
    showAlert("Курсы загружены.", "success");
  } catch (err) {
    showAlert(`Ошибка загрузки курсов: ${err.message}`, "danger");
  }
}

async function loadTutors() {
  try {
    const tutors = await api.getTutors();
    state.tutors = Array.isArray(tutors) ? tutors : [];
    state.tutorsFiltered = [...state.tutors];
    renderTutorLanguageSelect();
    applyTutorFilters();
    showAlert("Репетиторы загружены.", "success");
  } catch (err) {
    showAlert(`Ошибка загрузки репетиторов: ${err.message}`, "danger");
  }
}

/* Евенты */
els.btnReloadCourses.addEventListener("click", loadCourses);

els.courseSearchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  applyCourseFilters();
});

els.tutorLanguage.addEventListener("change", applyTutorFilters);
els.tutorLevel.addEventListener("change", applyTutorFilters);
els.tutorExperience.addEventListener("input", applyTutorFilters);

els.btnTutorOrder.addEventListener("click", () => {
  if (!state.selectedTutor) {
    showAlert("Сначала выберите репетитора в таблице.", "warning");
    return;
  }
  openOrderModal("tutor");
});

els.courseApplyBtn.addEventListener("click", () => {
  if (!state.selectedCourse) return;
  bootstrap.Modal.getOrCreateInstance(document.getElementById("courseDetailsModal")).hide();
  openOrderModal("course");
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);

  if (action === "course-details") {
    const c = state.courses.find((x) => x.id === id);
    if (c) openCourseDetails(c);
  }

  if (action === "course-apply") {
    const c = state.courses.find((x) => x.id === id);
    if (!c) return;
    state.selectedCourse = c;
    openOrderModal("course");
  }

  if (action === "tutor-select") {
    const t = state.tutors.find((x) => x.id === id);
    if (!t) return;
    state.selectedTutor = t;
    renderTutors();
    showAlert(`Выбран репетитор: ${t.name}`, "info");
  }
});

// пересчёт цены на изменения
[
  els.orderDate,
  els.orderTime,
  els.orderTutorDuration,
  els.orderPersons,
  els.optSupplementary,
  els.optPersonalized,
  els.optExcursions,
  els.optAssessment,
  els.optInteractive,
].forEach((el) => {
  if (!el) return;
  el.addEventListener("change", recalcPrice);
  el.addEventListener("input", recalcPrice);
});

els.orderForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    if (state.orderMode === "course" && !state.selectedCourse) {
      showAlert("Не выбран курс.", "warning");
      return;
    }
    if (state.orderMode === "tutor" && !state.selectedTutor) {
      showAlert("Не выбран репетитор.", "warning");
      return;
    }

    const payload = getOrderPayload();
    await api.createOrder(payload);

    showAlert("Заявка успешно создана.", "success");
    bootstrap.Modal.getOrCreateInstance(document.getElementById("orderModal")).hide();
  } catch (err) {
    showAlert(`Ошибка создания заявки: ${err.message}`, "danger");
  }
});

/* Инит */
(function boot() {
  loadCourses();
  loadTutors();
})();
