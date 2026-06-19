const form = document.querySelector("#membership-form");
const progress = document.querySelector("#form-progress");
const progressText = document.querySelector("#progress-text");
const statusText = document.querySelector("#form-status");
const printButton = document.querySelector("#print-page");
const photoStamp = document.querySelector("#photo-stamp");
const photoPreview = document.querySelector("#student-photo-preview");
const photoPlaceholder = document.querySelector("#photo-placeholder");
const successCelebration = document.querySelector("#success-celebration");
const successMessage = document.querySelector("#success-message");
const successCloseButton = document.querySelector("#success-close");
const successPrintButton = document.querySelector("#success-print");
const confettiLayer = document.querySelector("#confetti-layer");
const approvedPanel = document.querySelector("#approved-member-panel");
const approvedMessage = document.querySelector("#approved-member-message");
const approvedCardPrintButton = document.querySelector("#print-member-card");
let currentPhotoUrl = "";
let currentPhotoDataUrl = "";
let currentPhotoReadPromise = Promise.resolve();

const summary = {
  name: document.querySelector("#summary-name"),
  id: document.querySelector("#summary-id"),
  program: document.querySelector("#summary-program"),
  type: document.querySelector("#summary-type"),
  branch: document.querySelector("#summary-branch")
};

const requiredFields = Array.from(form.querySelectorAll("[required]"));

const MEMBERSHIP_APPLICATIONS_KEY = "libraryMemberApplications";
const customSelectMap = new Map();
const customDateMap = new Map();
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const displayDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "numeric"
});
const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const getSessionFromPortal = () => {
  const params = new URLSearchParams(window.location.search);
  const role = params.get("sRole") || localStorage.getItem("currentRole") || "";
  const name = params.get("sUser") || localStorage.getItem("currentUser") || "";
  const email = (params.get("sEmail") || localStorage.getItem("currentUserEmail") || "").toLowerCase();

  if (role && name && email) {
    localStorage.setItem("currentRole", role);
    localStorage.setItem("currentUser", name);
    localStorage.setItem("currentUserEmail", email);
  }

  return { role, name, email };
};

const getMemberSessionQueryString = () => {
  const role = localStorage.getItem("currentRole") || "";
  const name = localStorage.getItem("currentUser") || "";
  const email = localStorage.getItem("currentUserEmail") || "";

  if (!role || !name || !email) return "";
  return `?sRole=${encodeURIComponent(role)}&sUser=${encodeURIComponent(name)}&sEmail=${encodeURIComponent(email)}`;
};

const getPortalTargetPage = (sectionId) => {
  const targetPages = {
    home: "index.html",
    catalog: "catalog.html",
    saved: "saved.html",
    dashboard: "dashboard.html",
    admin: "admin.html",
    profile: "profile.html",
    member: "member.html"
  };

  return targetPages[sectionId] || "index.html";
};

const navigateMemberPortal = (sectionId) => {
  const drawer = document.querySelector("#mobileDrawer");
  const hamburger = document.querySelector("#hamburger");
  if (drawer && !drawer.classList.contains("hidden")) {
    drawer.classList.add("hidden");
    hamburger?.setAttribute("aria-expanded", "false");
  }

  window.location.href = getPortalTargetPage(sectionId) + getMemberSessionQueryString();
};

const setElementVisible = (element, isVisible) => {
  if (!element) return;
  element.classList.toggle("hidden", !isVisible);
};

const setNavbarAvatar = (name, email) => {
  const avatar = document.querySelector("#userAvatar");
  if (!avatar) return;

  try {
    const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
    const user = users.find((item) => (item.email || "").toLowerCase() === email.toLowerCase());
    if (user && user.profileImage) {
      avatar.innerHTML = `<img src="${user.profileImage}" alt="" />`;
      return;
    }
  } catch {
    // Fall back to the initial below.
  }

  avatar.textContent = (name || "U").charAt(0).toUpperCase();
};

const closePortalDropdown = () => {
  const menu = document.querySelector("#userDropdownMenu");
  const button = document.querySelector("#userDropdownBtn");
  menu?.classList.add("hidden");
  menu?.classList.remove("is-open");
  button?.setAttribute("aria-expanded", "false");
};

const updateMemberNavbar = () => {
  const { role, name, email } = getSessionFromPortal();
  const isSignedIn = Boolean(role && name && email);
  const isAdmin = role === "admin";

  const loginButton = document.querySelector("#loginBtn");
  const navUser = document.querySelector("#navUser");
  const savedLinks = [
    document.querySelector("#savedNavLink"),
    document.querySelector("#mobileSavedNavLink"),
    document.querySelector("#dropdownSavedLink")
  ];
  const dashboardLink = document.querySelector("#dashboardLink");
  const mobileDashboardLink = document.querySelector("#mobileDashboardLink");
  const dropdownDashboardLink = document.querySelector("#dropdownDashboardLink");
  const adminLinks = [
    document.querySelector("#adminLink"),
    document.querySelector("#mobileAdminLink"),
    document.querySelector("#dropdownAdminLink")
  ];

  setElementVisible(loginButton, !isSignedIn);
  setElementVisible(navUser, isSignedIn);
  savedLinks.forEach((link) => setElementVisible(link, isSignedIn));
  setElementVisible(dashboardLink, isSignedIn && !isAdmin);
  setElementVisible(mobileDashboardLink, isSignedIn);
  setElementVisible(dropdownDashboardLink, isSignedIn);
  adminLinks.forEach((link) => setElementVisible(link, isSignedIn && isAdmin));

  if (!isSignedIn) {
    closePortalDropdown();
    return;
  }

  document.querySelector("#navUserName").textContent = name;
  document.querySelector("#navUserRole").textContent = role.toUpperCase();
  document.querySelector("#dropdownUserName").textContent = name;
  document.querySelector("#dropdownUserRole").textContent = role.toUpperCase();
  setNavbarAvatar(name, email);
};

const bindMemberNavbar = () => {
  document.querySelectorAll("[data-portal-nav]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigateMemberPortal(link.dataset.portalNav);
    });
  });

  document.querySelector("#loginBtn")?.addEventListener("click", () => {
    window.location.href = "login.html?role=user&redirect=member.html";
  });

  document.querySelector("#userDropdownBtn")?.addEventListener("click", (event) => {
    event.stopPropagation();
    const menu = document.querySelector("#userDropdownMenu");
    const isOpening = menu?.classList.contains("hidden");
    menu?.classList.toggle("hidden", !isOpening);
    menu?.classList.toggle("is-open", Boolean(isOpening));
    event.currentTarget.setAttribute("aria-expanded", isOpening ? "true" : "false");
  });

  document.querySelector("#portalLogoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("currentRole");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentUserEmail");
    try {
      window.name = "";
    } catch {
      // Ignore window.name failures.
    }
    window.location.href = "index.html";
  });

  document.querySelector("#hamburger")?.addEventListener("click", (event) => {
    const drawer = document.querySelector("#mobileDrawer");
    const isOpening = drawer?.classList.contains("hidden");
    drawer?.classList.toggle("hidden", !isOpening);
    event.currentTarget.setAttribute("aria-expanded", isOpening ? "true" : "false");
  });

  updateMemberNavbar();
};

const getMemberApplications = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(MEMBERSHIP_APPLICATIONS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveMemberApplications = (applications) => {
  localStorage.setItem(MEMBERSHIP_APPLICATIONS_KEY, JSON.stringify(applications));
};

const getRegisteredUser = (email) => {
  try {
    const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
    return users.find((user) => (user.email || "").toLowerCase() === email.toLowerCase()) || null;
  } catch {
    return null;
  }
};

const getLatestMemberApplication = (email) => {
  return getMemberApplications()
    .filter((app) => (app.email || "").toLowerCase() === email.toLowerCase())
    .sort((a, b) =>
      new Date(b.updatedAt || b.reviewedAt || b.approvedAt || b.submittedAt || 0) -
      new Date(a.updatedAt || a.reviewedAt || a.approvedAt || a.submittedAt || 0)
    )[0] || null;
};

const formatMemberCardDate = (dateValue) => {
  const date = dateValue ? new Date(dateValue) : null;
  if (!date || Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

const setApprovedText = (id, value) => {
  const element = document.querySelector(`#${id}`);
  if (element) element.textContent = value || "-";
};

const renderApprovedMemberCard = (source, session) => {
  if (!approvedPanel) return;

  const name = source.name || [source.firstName, source.lastName].filter(Boolean).join(" ") || session.name || "Library Member";
  const email = source.email || session.email || "";
  const approvedDate = source.reviewedAt || source.approvedAt || source.updatedAt || source.submittedAt || "";
  const avatar = document.querySelector("#approved-card-avatar");
  const photo = source.profileImage || source.memberPhoto || "";

  approvedPanel.hidden = false;
  form.hidden = true;
  if (photoStamp) photoStamp.hidden = true;

  if (approvedMessage) {
    approvedMessage.textContent = `${name}, your GBLMS library membership has been approved by the admin office. Your card is ready to use.`;
  }

  setApprovedText("approved-card-name", name);
  setApprovedText("approved-card-id", source.studentId || "");
  setApprovedText("approved-card-program", source.program || source.department || "");
  setApprovedText("approved-card-type", source.membershipType || "Library Member");
  setApprovedText("approved-card-branch", source.branch || "Central Library");
  setApprovedText("approved-card-date", formatMemberCardDate(approvedDate));
  setApprovedText("approved-card-email", email);

  if (avatar) {
    if (photo) {
      avatar.innerHTML = `<img src="${photo}" alt="" />`;
    } else {
      avatar.innerHTML = "";
      avatar.textContent = name.charAt(0).toUpperCase();
    }
  }
};

const showMemberApplicationForm = () => {
  if (approvedPanel) approvedPanel.hidden = true;
  form.hidden = false;
  if (photoStamp) photoStamp.hidden = false;
};

const setFormValue = (name, value) => {
  const field = form.elements[name];
  if (!field || value === undefined || value === null || value === "") return;
  if (field instanceof RadioNodeList) {
    const option = Array.from(field).find((item) => item.value === value);
    if (option) option.checked = true;
    return;
  }
  field.value = value;
};

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseIsoDate = (value) => {
  if (!value) return null;
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [year, month, day] = parts;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getDisplayDate = (value) => {
  const parsed = parseIsoDate(value);
  return parsed ? displayDateFormatter.format(parsed) : "mm/dd/yyyy";
};

const getSelectText = (select) => {
  const selected = select.selectedOptions && select.selectedOptions[0];
  return selected ? selected.textContent.trim() : "Select";
};

const closeCustomSelect = (customSelect) => {
  if (!customSelect) return;
  customSelect.dataset.open = "false";
  customSelect.querySelector(".member-select-trigger")?.setAttribute("aria-expanded", "false");
};

const closeOtherCustomSelects = (currentSelect) => {
  document.querySelectorAll(".member-select[data-open='true']").forEach((customSelect) => {
    if (customSelect !== currentSelect) {
      closeCustomSelect(customSelect);
    }
  });
};

const openCustomSelect = (customSelect) => {
  closeOtherCustomSelects(customSelect);
  customSelect.dataset.open = "true";
  customSelect.querySelector(".member-select-trigger")?.setAttribute("aria-expanded", "true");
};

const syncCustomSelect = (select) => {
  const customSelect = customSelectMap.get(select);
  if (!customSelect) return;

  const valueNode = customSelect.querySelector(".member-select-value");
  const trigger = customSelect.querySelector(".member-select-trigger");
  const options = Array.from(customSelect.querySelectorAll(".member-select-option"));

  if (valueNode) {
    valueNode.textContent = getSelectText(select);
  }

  if (trigger) {
    trigger.classList.toggle("is-placeholder", !select.value);
    trigger.setAttribute("aria-invalid", select.matches(":invalid") ? "true" : "false");
  }

  options.forEach((option) => {
    option.setAttribute("aria-selected", option.dataset.value === select.value ? "true" : "false");
  });
};

const syncMemberCustomSelects = () => {
  form.querySelectorAll("select.member-native-select").forEach(syncCustomSelect);
};

const closeCustomDatePicker = (picker) => {
  if (!picker) return;
  picker.dataset.open = "false";
  picker.querySelector(".member-date-trigger")?.setAttribute("aria-expanded", "false");
};

const closeOtherCustomDatePickers = (currentPicker) => {
  document.querySelectorAll(".member-date-picker[data-open='true']").forEach((picker) => {
    if (picker !== currentPicker) {
      closeCustomDatePicker(picker);
    }
  });
};

const openCustomDatePicker = (picker) => {
  closeOtherCustomSelects(null);
  closeOtherCustomDatePickers(picker);
  picker.dataset.open = "true";
  picker.querySelector(".member-date-trigger")?.setAttribute("aria-expanded", "true");
};

const getDatePickerState = (input) => {
  const picker = customDateMap.get(input);
  if (!picker) return null;
  return picker._state;
};

const setDateInputValue = (input, value) => {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
};

const renderCustomDatePicker = (input) => {
  const picker = customDateMap.get(input);
  if (!picker) return;

  const state = picker._state;
  const selectedDate = parseIsoDate(input.value);
  const title = picker.querySelector(".member-date-title");
  const valueNode = picker.querySelector(".member-date-value");
  const calendar = picker.querySelector(".member-date-grid");
  const trigger = picker.querySelector(".member-date-trigger");
  const viewDate = new Date(state.year, state.month, 1);
  const firstDayIndex = viewDate.getDay();
  const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(state.year, state.month, 0).getDate();
  const todayIso = toIsoDate(new Date());

  title.textContent = monthFormatter.format(viewDate);
  valueNode.textContent = getDisplayDate(input.value);
  trigger.classList.toggle("is-placeholder", !input.value);
  trigger.setAttribute("aria-invalid", input.matches(":invalid") ? "true" : "false");

  calendar.replaceChildren();

  dayLabels.forEach((dayLabel) => {
    const label = document.createElement("span");
    label.className = "member-date-weekday";
    label.textContent = dayLabel;
    calendar.append(label);
  });

  for (let cellIndex = 0; cellIndex < 42; cellIndex += 1) {
    const dayButton = document.createElement("button");
    let cellDate;

    if (cellIndex < firstDayIndex) {
      const day = daysInPreviousMonth - firstDayIndex + cellIndex + 1;
      cellDate = new Date(state.year, state.month - 1, day);
      dayButton.classList.add("is-muted");
    } else if (cellIndex >= firstDayIndex + daysInMonth) {
      const day = cellIndex - firstDayIndex - daysInMonth + 1;
      cellDate = new Date(state.year, state.month + 1, day);
      dayButton.classList.add("is-muted");
    } else {
      const day = cellIndex - firstDayIndex + 1;
      cellDate = new Date(state.year, state.month, day);
    }

    const cellIso = toIsoDate(cellDate);
    dayButton.type = "button";
    dayButton.className = `member-date-day ${dayButton.className}`.trim();
    dayButton.textContent = String(cellDate.getDate());
    dayButton.dataset.date = cellIso;
    dayButton.setAttribute("aria-label", displayDateFormatter.format(cellDate));

    if (selectedDate && cellIso === input.value) {
      dayButton.classList.add("is-selected");
      dayButton.setAttribute("aria-current", "date");
    }

    if (cellIso === todayIso) {
      dayButton.classList.add("is-today");
    }

    dayButton.addEventListener("click", () => {
      setDateInputValue(input, cellIso);
      closeCustomDatePicker(picker);
      picker.querySelector(".member-date-trigger")?.focus();
    });

    calendar.append(dayButton);
  }
};

const syncCustomDatePicker = (input) => {
  const state = getDatePickerState(input);
  const selectedDate = parseIsoDate(input.value);
  if (state && selectedDate) {
    state.year = selectedDate.getFullYear();
    state.month = selectedDate.getMonth();
  }
  renderCustomDatePicker(input);
};

const syncMemberCustomDates = () => {
  form.querySelectorAll("input.member-native-date").forEach(syncCustomDatePicker);
};

const moveCustomDateMonth = (input, direction) => {
  const state = getDatePickerState(input);
  if (!state) return;
  const nextDate = new Date(state.year, state.month + direction, 1);
  state.year = nextDate.getFullYear();
  state.month = nextDate.getMonth();
  renderCustomDatePicker(input);
};

const enhanceCustomDatePickers = () => {
  form.querySelectorAll('input[type="date"]').forEach((input, index) => {
    if (input.dataset.customDateReady === "true") return;

    const selectedDate = parseIsoDate(input.value);
    const initialDate = selectedDate || new Date();
    const safeName = input.name || `date-${index}`;
    const calendarId = `${safeName.replace(/[^a-z0-9_-]/gi, "-")}-custom-calendar`;
    const picker = document.createElement("div");
    const trigger = document.createElement("button");
    const valueNode = document.createElement("span");
    const iconNode = document.createElement("span");
    const panel = document.createElement("div");
    const header = document.createElement("div");
    const title = document.createElement("strong");
    const prevButton = document.createElement("button");
    const nextButton = document.createElement("button");
    const grid = document.createElement("div");
    const footer = document.createElement("div");
    const clearButton = document.createElement("button");
    const todayButton = document.createElement("button");

    input.dataset.customDateReady = "true";
    input.classList.add("member-native-date");

    picker.className = "member-date-picker";
    picker.dataset.name = safeName;
    picker.dataset.open = "false";
    picker._state = {
      year: initialDate.getFullYear(),
      month: initialDate.getMonth()
    };

    trigger.type = "button";
    trigger.className = "member-date-trigger";
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", calendarId);

    valueNode.className = "member-date-value";
    iconNode.className = "member-date-icon";
    iconNode.setAttribute("aria-hidden", "true");

    panel.className = "member-date-panel";
    panel.id = calendarId;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Choose date");

    header.className = "member-date-header";
    title.className = "member-date-title";

    prevButton.type = "button";
    prevButton.className = "member-date-nav";
    prevButton.setAttribute("aria-label", "Previous month");
    prevButton.textContent = "<";

    nextButton.type = "button";
    nextButton.className = "member-date-nav";
    nextButton.setAttribute("aria-label", "Next month");
    nextButton.textContent = ">";

    grid.className = "member-date-grid";

    footer.className = "member-date-footer";
    clearButton.type = "button";
    clearButton.className = "member-date-action";
    clearButton.textContent = "Clear";
    todayButton.type = "button";
    todayButton.className = "member-date-action";
    todayButton.textContent = "Today";

    trigger.append(valueNode, iconNode);
    header.append(prevButton, title, nextButton);
    footer.append(clearButton, todayButton);
    panel.append(header, grid, footer);
    picker.append(trigger, panel);
    input.insertAdjacentElement("afterend", picker);
    customDateMap.set(input, picker);

    trigger.addEventListener("click", () => {
      if (picker.dataset.open === "true") {
        closeCustomDatePicker(picker);
      } else {
        openCustomDatePicker(picker);
      }
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        openCustomDatePicker(picker);
      }

      if (event.key === "Escape") {
        closeCustomDatePicker(picker);
      }
    });

    prevButton.addEventListener("click", () => moveCustomDateMonth(input, -1));
    nextButton.addEventListener("click", () => moveCustomDateMonth(input, 1));
    clearButton.addEventListener("click", () => {
      setDateInputValue(input, "");
      closeCustomDatePicker(picker);
      trigger.focus();
    });
    todayButton.addEventListener("click", () => {
      setDateInputValue(input, toIsoDate(new Date()));
      closeCustomDatePicker(picker);
      trigger.focus();
    });

    input.addEventListener("change", () => syncCustomDatePicker(input));
    renderCustomDatePicker(input);
  });
};

const selectOptionFromCustomControl = (select, optionValue) => {
  select.value = optionValue;
  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));
  syncCustomSelect(select);
};

const focusCustomOption = (customSelect, direction = 1) => {
  const options = Array.from(customSelect.querySelectorAll(".member-select-option:not([disabled])"));
  if (!options.length) return;

  const activeIndex = options.findIndex((option) => option === document.activeElement);
  const selectedIndex = options.findIndex((option) => option.getAttribute("aria-selected") === "true");
  const startIndex = activeIndex >= 0 ? activeIndex : selectedIndex;
  const nextIndex = startIndex >= 0
    ? (startIndex + direction + options.length) % options.length
    : 0;

  options[nextIndex].focus();
};

const enhanceCustomSelects = () => {
  form.querySelectorAll("select").forEach((select, index) => {
    if (select.dataset.customSelectReady === "true") return;

    const safeName = select.name || `field-${index}`;
    const listboxId = `${safeName.replace(/[^a-z0-9_-]/gi, "-")}-custom-list`;
    const customSelect = document.createElement("div");
    const trigger = document.createElement("button");
    const valueNode = document.createElement("span");
    const iconNode = document.createElement("span");
    const menu = document.createElement("div");

    select.dataset.customSelectReady = "true";
    select.classList.add("member-native-select");

    customSelect.className = "member-select";
    customSelect.dataset.name = safeName;
    customSelect.dataset.open = "false";

    trigger.type = "button";
    trigger.className = "member-select-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", listboxId);
    trigger.setAttribute("aria-required", select.required ? "true" : "false");

    valueNode.className = "member-select-value";
    valueNode.textContent = getSelectText(select);

    iconNode.className = "member-select-icon";
    iconNode.setAttribute("aria-hidden", "true");

    menu.className = "member-select-menu";
    menu.id = listboxId;
    menu.setAttribute("role", "listbox");

    Array.from(select.options).forEach((option, optionIndex) => {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "member-select-option";
      optionButton.dataset.value = option.value;
      optionButton.setAttribute("role", "option");
      optionButton.setAttribute("aria-selected", option.selected ? "true" : "false");
      optionButton.textContent = option.textContent.trim();

      if (option.disabled) {
        optionButton.disabled = true;
      }

      optionButton.addEventListener("click", () => {
        selectOptionFromCustomControl(select, option.value);
        closeCustomSelect(customSelect);
        trigger.focus();
      });

      optionButton.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          focusCustomOption(customSelect, 1);
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          focusCustomOption(customSelect, -1);
        }

        if (event.key === "Escape") {
          event.preventDefault();
          closeCustomSelect(customSelect);
          trigger.focus();
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          optionButton.click();
        }
      });

      if (optionIndex === select.selectedIndex) {
        optionButton.setAttribute("tabindex", "0");
      }

      menu.append(optionButton);
    });

    trigger.append(valueNode, iconNode);
    customSelect.append(trigger, menu);
    select.insertAdjacentElement("afterend", customSelect);
    customSelectMap.set(select, customSelect);

    trigger.addEventListener("click", () => {
      if (customSelect.dataset.open === "true") {
        closeCustomSelect(customSelect);
      } else {
        openCustomSelect(customSelect);
      }
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openCustomSelect(customSelect);
        focusCustomOption(customSelect, 1);
      }

      if (event.key === "Escape") {
        closeCustomSelect(customSelect);
      }
    });

    select.addEventListener("change", () => syncCustomSelect(select));
    syncCustomSelect(select);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
};

const focusInvalidField = (field) => {
  if (!field) return;
  const customSelect = customSelectMap.get(field);
  if (customSelect) {
    customSelect.querySelector(".member-select-trigger")?.focus({ preventScroll: false });
    return;
  }
  const customDate = customDateMap.get(field);
  if (customDate) {
    customDate.querySelector(".member-date-trigger")?.focus({ preventScroll: false });
    return;
  }
  field.focus({ preventScroll: false });
};

const getCheckedValues = (name) => {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((field) => field.value);
};

const collectApplicationRecord = () => {
  const session = getSessionFromPortal();
  const registeredUser = getRegisteredUser(getFieldValue("email") || session.email) || {};
  const interests = getCheckedValues("interest");
  const existingApplication = getLatestMemberApplication(getFieldValue("email") || session.email) || {};
  const savedPhoto = currentPhotoDataUrl || existingApplication.profileImage || existingApplication.memberPhoto || registeredUser.profileImage || "";

  return {
    id: `APP-${Date.now()}`,
    source: "member-card-form",
    name: [getFieldValue("firstName"), getFieldValue("lastName")].filter(Boolean).join(" "),
    email: getFieldValue("email").toLowerCase(),
    password: registeredUser.password || "",
    studentId: getFieldValue("studentId").toUpperCase(),
    phone: getFieldValue("phone"),
    degreeLevel: getFieldValue("degreeLevel"),
    faculty: getFieldValue("faculty"),
    department: getFieldValue("department"),
    program: getFieldValue("program"),
    semester: getFieldValue("semester"),
    session: getFieldValue("session"),
    campus: getFieldValue("campus"),
    advisor: getFieldValue("advisor"),
    dateOfBirth: getFieldValue("dateOfBirth"),
    gender: getFieldValue("gender"),
    bloodGroup: getFieldValue("bloodGroup"),
    nationality: getFieldValue("nationality"),
    identityNumber: getFieldValue("identityNumber"),
    alternatePhone: getFieldValue("alternatePhone"),
    presentAddress: getFieldValue("presentAddress"),
    permanentAddress: getFieldValue("permanentAddress"),
    city: getFieldValue("city"),
    postcode: getFieldValue("postcode"),
    country: getFieldValue("country"),
    emergencyName: getFieldValue("emergencyName"),
    emergencyRelationship: getFieldValue("emergencyRelationship"),
    emergencyPhone: getFieldValue("emergencyPhone"),
    emergencyAddress: getFieldValue("emergencyAddress"),
    membershipType: getFieldValue("membershipType"),
    branch: getFieldValue("branch"),
    borrowingCategory: getFieldValue("borrowingCategory"),
    interests,
    cardStatus: getFieldValue("cardStatus"),
    contactMethod: getFieldValue("contactMethod"),
    profileImage: savedPhoto,
    memberPhoto: savedPhoto,
    studentPhotoFile: form.elements.studentPhoto?.files?.[0]?.name || "",
    studentProofFile: form.elements.studentProof?.files?.[0]?.name || "",
    status: "pending",
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

const saveApplicationForAdminReview = () => {
  const record = collectApplicationRecord();
  const applications = getMemberApplications();
  const pendingIndex = applications.findIndex((app) =>
    (app.email || "").toLowerCase() === record.email && app.status === "pending"
  );

  if (pendingIndex === -1) {
    applications.push(record);
  } else {
    applications[pendingIndex] = {
      ...applications[pendingIndex],
      ...record,
      id: applications[pendingIndex].id,
      submittedAt: applications[pendingIndex].submittedAt || record.submittedAt
    };
  }

  saveMemberApplications(applications);
  return record;
};

const prefillPortalMember = () => {
  const session = getSessionFromPortal();
  if (!session.email || !session.name) {
    window.location.href = "login.html?role=user&redirect=member.html";
    return;
  }

  const latestApplication = getLatestMemberApplication(session.email) || {};
  const registeredUser = getRegisteredUser(session.email) || {};
  const savedPhoto = latestApplication.profileImage || latestApplication.memberPhoto || registeredUser.profileImage || registeredUser.memberPhoto || "";
  const source = {
    ...registeredUser,
    ...latestApplication,
    profileImage: savedPhoto,
    memberPhoto: savedPhoto
  };
  const nameParts = (source.name || session.name || "").trim().split(/\s+/);
  const isApproved = latestApplication.status === "approved" || registeredUser.membershipStatus === "approved";

  if (isApproved) {
    renderApprovedMemberCard(source, session);
    return;
  }

  showMemberApplicationForm();

  setFormValue("firstName", source.firstName || nameParts[0] || "");
  setFormValue("lastName", source.lastName || nameParts.slice(1).join(" ") || "");
  setFormValue("email", source.email || session.email);
  setFormValue("studentId", source.studentId || "");
  setFormValue("phone", source.phone || "");
  setFormValue("degreeLevel", source.degreeLevel || "");
  setFormValue("faculty", source.faculty || "");
  setFormValue("department", source.department || "");
  setFormValue("program", source.program || "");
  setFormValue("semester", source.semester || "");
  setFormValue("session", source.session || "");
  setFormValue("campus", source.campus || "");
  setFormValue("advisor", source.advisor || "");
  setFormValue("dateOfBirth", source.dateOfBirth || "");
  setFormValue("membershipType", source.membershipType || "");
  setFormValue("branch", source.branch || "");
  setFormValue("borrowingCategory", source.borrowingCategory || "");
  setFormValue("cardStatus", source.cardStatus || "New");
  setFormValue("contactMethod", source.contactMethod || "");

  if (savedPhoto) {
    currentPhotoDataUrl = savedPhoto;
    photoPreview.src = savedPhoto;
    photoPreview.hidden = false;
    photoPlaceholder.hidden = true;
    photoStamp.classList.add("has-photo");
  }

  syncMemberCustomSelects();
  syncMemberCustomDates();
  updateProgress();
  updateSummary();
};

const getFieldValue = (name) => {
  const field = form.elements[name];
  if (!field) return "";
  if (field instanceof RadioNodeList) {
    return field.value || "";
  }
  return field.value ? field.value.trim() : "";
};

const hasRequiredValue = (field) => {
  if (field.type === "checkbox" || field.type === "radio") {
    const group = form.elements[field.name];
    return group instanceof RadioNodeList ? Boolean(group.value) : field.checked;
  }
  return Boolean(field.value.trim());
};

const updateProgress = () => {
  const uniqueRequired = new Map();
  requiredFields.forEach((field) => uniqueRequired.set(field.name || field.id, field));

  const complete = Array.from(uniqueRequired.values()).filter(hasRequiredValue).length;
  const total = uniqueRequired.size;
  const percent = total ? Math.round((complete / total) * 100) : 0;

  if (progress) {
    progress.value = percent;
    progress.textContent = `${percent}%`;
  }

  if (progressText) {
    progressText.textContent = `${percent}% complete`;
  }
};

const updateSummary = () => {
  const fullName = [getFieldValue("firstName"), getFieldValue("lastName")].filter(Boolean).join(" ");
  summary.name.textContent = fullName || "Applicant not named yet";
  summary.id.textContent = getFieldValue("studentId") || "-";
  summary.program.textContent = getFieldValue("program") || "-";
  summary.type.textContent = getFieldValue("membershipType") || "-";
  summary.branch.textContent = getFieldValue("branch") || "-";
};

const updateFileName = (input) => {
  const output = document.querySelector(`[data-file-name="${input.name}"]`);
  if (!output) return;
  output.textContent = input.files && input.files.length ? input.files[0].name : "No file selected";
};

const clearPhotoPreview = () => {
  if (currentPhotoUrl) {
    URL.revokeObjectURL(currentPhotoUrl);
    currentPhotoUrl = "";
  }
  currentPhotoDataUrl = "";
  currentPhotoReadPromise = Promise.resolve();

  photoPreview.removeAttribute("src");
  photoPreview.hidden = true;
  photoPlaceholder.hidden = false;
  photoStamp.classList.remove("has-photo");
};

const updatePhotoPreview = (input) => {
  if (input.name !== "studentPhoto") return;

  const file = input.files && input.files[0];
  if (!file || !file.type.startsWith("image/")) {
    clearPhotoPreview();
    return;
  }

  if (currentPhotoUrl) {
    URL.revokeObjectURL(currentPhotoUrl);
  }

  currentPhotoUrl = URL.createObjectURL(file);
  photoPreview.src = currentPhotoUrl;
  photoPreview.hidden = false;
  photoPlaceholder.hidden = true;
  photoStamp.classList.add("has-photo");

  const reader = new FileReader();
  currentPhotoReadPromise = new Promise((resolve) => {
    reader.addEventListener("load", () => {
      currentPhotoDataUrl = typeof reader.result === "string" ? reader.result : "";
      resolve();
    });
    reader.addEventListener("error", () => {
      currentPhotoDataUrl = "";
      resolve();
    });
  });
  reader.readAsDataURL(file);
};

const setStatus = (message, type = "") => {
  statusText.textContent = message;
  statusText.className = `form-status ${type}`.trim();
};

const launchConfetti = () => {
  const colors = ["#21358d", "#111f62", "#eea11a", "#ed1c24", "#38bdf8", "#ffffff", "#facc15"];
  confettiLayer.replaceChildren();

  for (let index = 0; index < 96; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.setProperty("--x", `${Math.random() * 100}%`);
    piece.style.setProperty("--w", `${8 + Math.random() * 12}px`);
    piece.style.setProperty("--h", `${12 + Math.random() * 22}px`);
    piece.style.setProperty("--c", colors[index % colors.length]);
    piece.style.setProperty("--r", `${Math.random() * 180}deg`);
    piece.style.setProperty("--turn", `${Math.random() * 760}deg`);
    piece.style.setProperty("--drift", `${-160 + Math.random() * 320}px`);
    piece.style.setProperty("--d", `${3.2 + Math.random() * 2.4}s`);
    piece.style.setProperty("--delay", `${Math.random() * 0.9}s`);
    confettiLayer.append(piece);
  }
};

const showSuccessCelebration = () => {
  const fullName = [getFieldValue("firstName"), getFieldValue("lastName")].filter(Boolean).join(" ");
  successMessage.textContent = fullName
    ? `${fullName}, your Gono Bishwabidyalay library membership application is ready for office review.`
    : "Your Gono Bishwabidyalay library membership application is ready for office review.";

  successCelebration.hidden = false;
  document.body.classList.add("celebration-open");
  launchConfetti();
  successCloseButton.focus();

  if (window.lucide) {
    window.lucide.createIcons();
  }
};

const hideSuccessCelebration = () => {
  successCelebration.hidden = true;
  document.body.classList.remove("celebration-open");
  confettiLayer.replaceChildren();
};

form.addEventListener("input", (event) => {
  if (event.target.name === "studentId") {
    event.target.value = event.target.value.toUpperCase();
  }
  updateProgress();
  updateSummary();
});

form.addEventListener("change", (event) => {
  if (event.target.type === "file") {
    updateFileName(event.target);
    updatePhotoPreview(event.target);
  }
  updateProgress();
  updateSummary();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  form.classList.add("show-errors");

  if (!form.checkValidity()) {
    const firstInvalid = form.querySelector(":invalid");
    setStatus("Please complete all required fields before submitting.", "error");
    syncMemberCustomSelects();
    focusInvalidField(firstInvalid);
    return;
  }

  await currentPhotoReadPromise;
  saveApplicationForAdminReview();
  setStatus("Application submitted for admin approval.", "success");
  showSuccessCelebration();
});

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    form.classList.remove("show-errors");
    document.querySelectorAll("[data-file-name]").forEach((node) => {
      node.textContent = "No file selected";
    });
    clearPhotoPreview();
    hideSuccessCelebration();
    setStatus("");
    syncMemberCustomSelects();
    syncMemberCustomDates();
    updateProgress();
    updateSummary();
  }, 0);
});

printButton?.addEventListener("click", () => window.print());
successPrintButton.addEventListener("click", () => window.print());
approvedCardPrintButton?.addEventListener("click", () => window.print());
successCloseButton.addEventListener("click", hideSuccessCelebration);
successCelebration.addEventListener("click", (event) => {
  if (event.target === successCelebration) {
    hideSuccessCelebration();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !successCelebration.hidden) {
    hideSuccessCelebration();
  }

  if (event.key === "Escape") {
    closeOtherCustomSelects(null);
    closeOtherCustomDatePickers(null);
    closePortalDropdown();
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".member-select")) {
    closeOtherCustomSelects(null);
  }

  if (!event.target.closest(".member-date-picker")) {
    closeOtherCustomDatePickers(null);
  }

  if (!event.target.closest(".portal-user")) {
    closePortalDropdown();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  bindMemberNavbar();
  enhanceCustomSelects();
  enhanceCustomDatePickers();
  if (window.lucide) {
    window.lucide.createIcons();
  }
  prefillPortalMember();
  updateProgress();
  updateSummary();
});
