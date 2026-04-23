const BOOKING_MONTH_START = "2026-04-01";
const BOOKING_MONTH_DAYS = 30;
const BOOKING_OPEN_FROM = "2026-04-12";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);

const parseDate = (value) => new Date(`${value}T00:00:00`);

const formatIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (value, amount) => {
  const date = value instanceof Date ? new Date(value.getTime()) : parseDate(value);
  date.setDate(date.getDate() + amount);
  return date;
};

const dayDiff = (start, end) => {
  const ms = parseDate(end) - parseDate(start);
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

const formatDateLabel = (value) =>
  parseDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

const getCarById = (id) => window.RYD_CARS.find((car) => car.id === id);

const getCalendarMonthLabel = () =>
  parseDate(BOOKING_MONTH_START).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

const getCalendarLegendMarkup = () => `
  <div class="calendar-legend" aria-hidden="true">
    <span><span class="calendar-swatch available"></span>Available</span>
    <span><span class="calendar-swatch selected"></span>Selected</span>
    <span><span class="calendar-swatch booked"></span>Reserved</span>
    <span><span class="calendar-swatch closed"></span>Unavailable</span>
  </div>`;


const isSelectableDate = (car, iso) => {
  if (!car) {
    return false;
  }

  return iso >= BOOKING_OPEN_FROM && !car.unavailableDates.includes(iso);
};

const getRangeDates = (start, end) => {
  const dates = [];
  let current = parseDate(start);
  const endDate = parseDate(end);

  while (current <= endDate) {
    dates.push(formatIsoDate(current));
    current = addDays(current, 1);
  }

  return dates;
};

const isRangeAvailable = (car, start, end) => {
  if (!car || !start || !end || dayDiff(start, end) <= 0) {
    return false;
  }

  return getRangeDates(start, end).every((iso) => isSelectableDate(car, iso));
};

const getCalendarFeedback = (car, start, end) => {
  if (!car) {
    return "Select a vehicle to load the booking calendar.";
  }

  if (!start) {
    return `Choose a pickup date for ${car.name}, then select a return date. Reserved dates are blocked automatically.`;
  }

  if (!end) {
    return `Pickup date selected for ${formatDateLabel(start)}. Choose a return date after your pickup date.`;
  }

  return `${car.name} selected from ${formatDateLabel(start)} to ${formatDateLabel(end)} for ${dayDiff(start, end)} day(s).`;
};

const updateSummary = (form) => {
  if (!form) {
    return;
  }

  const car = getCarById(form.car.value);
  if (!car) {
    return;
  }

  const pickup = form.pickupDate.value;
  const returnDate = form.returnDate.value;
  const rangeValid = isRangeAvailable(car, pickup, returnDate);
  const rentalDays = rangeValid ? dayDiff(pickup, returnDate) : 0;
  const insuranceEnabled = form.insurance.value === "add";
  const subtotal = rentalDays > 0 ? rentalDays * car.pricePerDay : 0;
  const insuranceTotal = rentalDays > 0 && insuranceEnabled ? rentalDays * car.insurancePerDay : 0;
  const total = subtotal + insuranceTotal + car.deposit;

  document.querySelector("[data-summary-car]").textContent = car.name;
  document.querySelector("[data-summary-rate]").textContent = formatCurrency(car.pricePerDay);
  document.querySelector("[data-summary-nights]").textContent =
    rentalDays > 0 ? `${rentalDays} day(s)` : "Select dates";
  document.querySelector("[data-summary-deposit]").textContent = formatCurrency(car.deposit);
  document.querySelector("[data-summary-insurance]").textContent = rentalDays > 0
    ? insuranceEnabled
      ? formatCurrency(insuranceTotal)
      : "Using own coverage"
    : "Pending dates";
  document.querySelector("[data-summary-total]").textContent =
    rentalDays > 0 ? formatCurrency(total) : "Complete dates";
};

const setSelectedDates = (form, start, end) => {
  form.pickupDate.value = start || "";
  form.returnDate.value = end || "";
  form.returnDate.min = start || BOOKING_OPEN_FROM;
};

const renderBookingCalendar = (car, form) => {
  const calendar = document.querySelector("[data-booking-calendar]");
  const header = document.querySelector("[data-booking-calendar-month]");
  const feedback = document.querySelector("[data-calendar-feedback]");

  if (!calendar || !form) {
    return;
  }

  if (header) {
    header.textContent = getCalendarMonthLabel();
  }

  const selectedStart = form.pickupDate.value;
  const selectedEnd = form.returnDate.value;
  const monthStart = parseDate(BOOKING_MONTH_START);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const spacerCount = monthStart.getDay();

  const headers = weekDays.map((day) => `<div class="calendar-head">${day}</div>`).join("");
  const spacers = Array.from({ length: spacerCount }, () => '<div class="calendar-day calendar-spacer"></div>').join("");
  const days = Array.from({ length: BOOKING_MONTH_DAYS }, (_, index) => {
    const date = addDays(monthStart, index);
    const iso = formatIsoDate(date);
    const isReserved = car.unavailableDates.includes(iso);
    const isClosed = iso < BOOKING_OPEN_FROM;
    const isAvailable = !isReserved && !isClosed;
    const isSelectedStart = selectedStart === iso;
    const isSelectedEnd = selectedEnd === iso;
    const isInRange = Boolean(selectedStart && selectedEnd && iso > selectedStart && iso < selectedEnd);
    const classes = ["calendar-day"];

    if (isReserved) {
      classes.push("booked");
    } else if (isClosed) {
      classes.push("closed");
    } else {
      classes.push("available", "is-selectable");
    }

    if (isInRange) {
      classes.push("in-range");
    }

    if (isSelectedStart) {
      classes.push("selected", "range-start");
    }

    if (isSelectedEnd) {
      classes.push("selected", "range-end");
    }

    let label = isReserved ? "Reserved" : isClosed ? "Unavailable" : "Open";
    if (isSelectedStart && !selectedEnd) {
      label = "Pickup";
    } else if (isSelectedStart) {
      label = "Pickup";
    } else if (isSelectedEnd) {
      label = "Return";
    } else if (isInRange) {
      label = "Selected";
    }

    return `
      <button
        class="${classes.join(" ")}"
        type="button"
        data-calendar-date="${iso}"
        aria-pressed="${isSelectedStart || isSelectedEnd ? "true" : "false"}"
        ${isAvailable ? "" : "disabled"}
      >
        <strong>${date.getDate()}</strong><br>
        <span>${label}</span>
      </button>`;
  }).join("");

  calendar.innerHTML = headers + spacers + days;

  if (feedback) {
    feedback.textContent = getCalendarFeedback(car, selectedStart, selectedEnd);
  }

  calendar.querySelectorAll("[data-calendar-date]").forEach((button) => {
    button.addEventListener("click", () => {
      const chosenDate = button.dataset.calendarDate;
      const currentStart = form.pickupDate.value;
      const currentEnd = form.returnDate.value;

      window.RYD_clearFormStatus?.(form);

      if (!currentStart || currentEnd) {
        setSelectedDates(form, chosenDate, "");
        renderBookingCalendar(car, form);
        updateSummary(form);
        return;
      }

      if (chosenDate <= currentStart) {
        setSelectedDates(form, chosenDate, "");
        renderBookingCalendar(car, form);
        updateSummary(form);
        return;
      }

      if (!isRangeAvailable(car, currentStart, chosenDate)) {
        setSelectedDates(form, chosenDate, "");
        renderBookingCalendar(car, form);
        updateSummary(form);
        window.RYD_setFormStatus?.(form, "That date range crosses unavailable days. Select a new pickup date and try again.", "error");
        return;
      }

      setSelectedDates(form, currentStart, chosenDate);
      renderBookingCalendar(car, form);
      updateSummary(form);
    });
  });
};

const renderCarCards = () => {
  const grid = document.querySelector("[data-car-grid]");
  if (!grid) {
    return;
  }

  grid.innerHTML = window.RYD_CARS.map(
    (car) => `
      <article class="car-card reveal" data-car-id="${car.id}">
        <div class="car-card-image" style="background-image: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.18)), url('${car.image}')"></div>
        <div class="car-card-body">
          <p class="eyebrow">${car.tag}</p>
          <h3>${car.name}</h3>
          <p>${car.description}</p>
          <div class="car-meta">
            <span class="meta-chip">${car.horsepower} HP</span>
            <span class="meta-chip">${car.seats} Seats</span>
            <span class="meta-chip">${car.topSpeed}</span>
          </div>
          <div class="price-line">
            <div>
              <strong>${formatCurrency(car.pricePerDay)}</strong>
              <p>per day</p>
            </div>
            <button class="button button-secondary" type="button">View Availability</button>
          </div>
        </div>
      </article>`
  ).join("");

  document.querySelectorAll("[data-car-id]").forEach((card) => {
    card.addEventListener("click", () => {
      const carId = card.dataset.carId;
      window.location.href = `car.html?car=${carId}`;
    });
  });

  if (window.RYD_initReveal) {
    window.RYD_initReveal();
  }
};

const populateDetailPage = () => {
  const detailRoot = document.querySelector("[data-car-detail]");
  if (!detailRoot) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const selectedId = params.get("car") || window.RYD_CARS[0].id;
  const car = getCarById(selectedId) || window.RYD_CARS[0];

  document.title = `${car.name} | Rent Your Dream LLC`;

  detailRoot.innerHTML = `
    <section class="hero" style="--hero-image: linear-gradient(110deg, rgba(5, 5, 5, 0.64), rgba(5, 5, 5, 0.72)), url('${car.image}')">
      <div class="container hero-content">
        <div class="hero-grid">
          <div class="reveal">
            <p class="eyebrow">${car.tag}</p>
            <h1>${car.name}</h1>
            <p class="lead">${car.description}</p>
            <div class="hero-stats">
              <div class="hero-panel hero-stat">
                <strong>${car.horsepower}</strong>
                <span>Horsepower</span>
              </div>
              <div class="hero-panel hero-stat">
                <strong>${formatCurrency(car.pricePerDay)}</strong>
                <span>Daily rate</span>
              </div>
              <div class="hero-panel hero-stat">
                <strong>${car.topSpeed}</strong>
                <span>Top speed</span>
              </div>
            </div>
          </div>
          <aside class="detail-sidebar reveal">
            <p class="eyebrow">Reservation Overview</p>
            <h3>Reserve ${car.name}</h3>
            <p>Choose your dates directly from the calendar, review pricing, and send the request through for concierge confirmation.</p>
            <a class="button button-primary" href="#booking-form">Review Reservation Details</a>
          </aside>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container split-layout">
        <div class="calendar-card reveal">
          <div class="section-header">
            <p class="eyebrow">Availability & Booking Calendar</p>
            <h2 data-booking-calendar-month>${getCalendarMonthLabel()}</h2>
            <p>Select your pickup date, then your return date. Reserved dates are blocked from the booking flow automatically.</p>
          </div>
          ${getCalendarLegendMarkup()}
          <div class="calendar" data-booking-calendar></div>
          <p class="calendar-feedback" data-calendar-feedback role="status" aria-live="polite"></p>
        </div>
        <aside class="detail-sidebar reveal">
          <p class="eyebrow">Vehicle Details</p>
          <ul class="detail-list">
            <li>Transmission: ${car.transmission}</li>
            <li>Seats: ${car.seats}</li>
            <li>Deposit hold: ${formatCurrency(car.deposit)}</li>
            <li>Optional insurance: ${formatCurrency(car.insurancePerDay)} / day</li>
            <li>Experience focus: ${car.accent}</li>
          </ul>
          <p class="eyebrow" style="margin-top:1.4rem;">Included</p>
          <ul class="detail-list">
            ${car.features.map((feature) => `<li>${feature}</li>`).join("")}
          </ul>
        </aside>
      </div>
    </section>
  `;

  if (window.RYD_initReveal) {
    window.RYD_initReveal();
  }
};

const initBookingForm = () => {
  const form = document.querySelector("[data-booking-form]");
  if (!form) {
    return;
  }

  form.pickupDate.min = BOOKING_OPEN_FROM;
  form.returnDate.min = BOOKING_OPEN_FROM;
  form.pickupDate.readOnly = true;
  form.returnDate.readOnly = true;

  if (!form.car.options.length) {
    window.RYD_CARS.forEach((car) => {
      const option = document.createElement("option");
      option.value = car.id;
      option.textContent = `${car.name} - ${formatCurrency(car.pricePerDay)}/day`;
      form.car.append(option);
    });
  }

  const params = new URLSearchParams(window.location.search);
  const initialId = params.get("car") || window.RYD_CARS[0].id;
  form.car.value = getCarById(initialId) ? initialId : window.RYD_CARS[0].id;

  setSelectedDates(form, "", "");
  renderBookingCalendar(getCarById(form.car.value), form);

  form.addEventListener("change", (event) => {
    window.RYD_clearFormStatus?.(form);

    if (event.target === form.car) {
      const detailRoot = document.querySelector("[data-car-detail]");

      if (detailRoot) {
        window.location.href = `car.html?car=${form.car.value}#booking-form`;
        return;
      }

      setSelectedDates(form, "", "");
      renderBookingCalendar(getCarById(form.car.value), form);
    }

    updateSummary(form);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const car = getCarById(form.car.value);
    const pickup = form.pickupDate.value;
    const returnDate = form.returnDate.value;
    const consent = form.querySelector('input[name="consent"]');
    const age = form.querySelector('input[name="ageConfirm"]');

    if (!car || !isRangeAvailable(car, pickup, returnDate)) {
      window.RYD_setFormStatus?.(form, "Select an available pickup and return date directly from the calendar before continuing.", "error");
      return;
    }

    if (!consent.checked || !age.checked) {
      window.RYD_setFormStatus?.(form, "Please confirm the required driver eligibility and booking disclosures before submitting your request.", "error");
      return;
    }

    window.RYD_setFormStatus?.(
      form,
      `${car.name} has been prepared for ${formatDateLabel(pickup)} to ${formatDateLabel(returnDate)}. A concierge specialist will follow up to confirm coverage, delivery, and deposit authorization.`,
      "success"
    );
  });

  updateSummary(form);
};

document.addEventListener("DOMContentLoaded", () => {
  renderCarCards();
  populateDetailPage();
  initBookingForm();
});

console.log("RYD_CARS:", window.RYD_CARS);