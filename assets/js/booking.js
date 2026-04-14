const BOOKING_CONFIG = {
  stripePaymentLinks: {
    "ferrari-sf90": "https://buy.stripe.com/test_6oE5kCfakeFerrari",
    "lamborghini-revuelto": "https://buy.stripe.com/test_bIY2aofakeLambo",
    "rolls-cullinan": "https://buy.stripe.com/test_dR6fZ4fakeRolls",
    "mclaren-750s": "https://buy.stripe.com/test_28o3esfakeMclaren"
  }
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);

const parseDate = (value) => new Date(`${value}T00:00:00`);

const dayDiff = (start, end) => {
  const ms = parseDate(end) - parseDate(start);
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

const getCarById = (id) => window.RYD_CARS.find((car) => car.id === id);

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
            <button class="button button-secondary" type="button">View Details</button>
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

const renderCalendar = (car) => {
  const calendar = document.querySelector("[data-calendar]");
  if (!calendar || !car) {
    return;
  }

  const today = new Date("2026-04-01T00:00:00");
  const month = today.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  const header = document.querySelector("[data-calendar-month]");
  if (header) {
    header.textContent = month;
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date("2026-04-01T00:00:00");
    date.setDate(index + 1);
    const iso = date.toISOString().slice(0, 10);
    const isBooked = car.unavailableDates.includes(iso);

    return `<div class="calendar-day ${isBooked ? "booked" : "available"}">
      <strong>${index + 1}</strong><br>
      <span>${isBooked ? "Booked" : "Open"}</span>
    </div>`;
  }).join("");

  calendar.innerHTML = weekDays
    .map((day) => `<div class="calendar-head">${day}</div>`)
    .join("") + days;
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
            <p class="eyebrow">Luxury Booking</p>
            <h3>Reserve This Car</h3>
            <p>Secure your date, review pricing, then continue to Stripe for your payment authorization.</p>
            <a class="button button-primary" href="#booking-form">Book ${car.name}</a>
          </aside>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container split-layout">
        <div class="calendar-card reveal">
          <div class="section-header">
            <p class="eyebrow">Availability Calendar</p>
            <h2 data-calendar-month>April 2026</h2>
            <p>Green dates are currently available for instant reservation. Red dates are already secured.</p>
          </div>
          <div class="calendar" data-calendar></div>
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

  const carSelect = document.querySelector("#car-select");
  if (carSelect) {
    carSelect.value = car.id;
  }

  renderCalendar(car);

  if (window.RYD_initReveal) {
    window.RYD_initReveal();
  }
};

const updateSummary = () => {
  const form = document.querySelector("[data-booking-form]");
  if (!form) {
    return;
  }

  const car = getCarById(form.car.value);
  if (!car) {
    return;
  }

  const pickup = form.pickupDate.value;
  const returnDate = form.returnDate.value;
  const nights = pickup && returnDate ? dayDiff(pickup, returnDate) : 0;
  const insuranceEnabled = form.insurance.value === "add";
  const subtotal = nights > 0 ? nights * car.pricePerDay : 0;
  const insuranceTotal = nights > 0 && insuranceEnabled ? nights * car.insurancePerDay : 0;
  const total = subtotal + insuranceTotal + car.deposit;

  document.querySelector("[data-summary-car]").textContent = car.name;
  document.querySelector("[data-summary-rate]").textContent = formatCurrency(car.pricePerDay);
  document.querySelector("[data-summary-nights]").textContent = nights > 0 ? `${nights} day(s)` : "Select dates";
  document.querySelector("[data-summary-deposit]").textContent = formatCurrency(car.deposit);
  document.querySelector("[data-summary-insurance]").textContent =
    insuranceEnabled ? formatCurrency(insuranceTotal) : "Using own coverage";
  document.querySelector("[data-summary-total]").textContent =
    nights > 0 ? formatCurrency(total) : "Complete dates";
}

const initBookingForm = () => {
  const form = document.querySelector("[data-booking-form]");
  if (!form) {
    return;
  }

  const now = new Date("2026-04-12T00:00:00");
  const minDate = now.toISOString().slice(0, 10);
  form.pickupDate.min = minDate;
  form.returnDate.min = minDate;

  window.RYD_CARS.forEach((car) => {
    const option = document.createElement("option");
    option.value = car.id;
    option.textContent = `${car.name} - ${formatCurrency(car.pricePerDay)}/day`;
    form.car.append(option);
  });

  const params = new URLSearchParams(window.location.search);
  const initialId = params.get("car") || window.RYD_CARS[0].id;
  form.car.value = initialId;

  form.addEventListener("change", () => {
    if (form.pickupDate.value) {
      form.returnDate.min = form.pickupDate.value;
    }
    updateSummary();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const car = getCarById(form.car.value);
    const pickup = form.pickupDate.value;
    const returnDate = form.returnDate.value;
    const consent = form.querySelector('input[name="consent"]');
    const age = form.querySelector('input[name="ageConfirm"]');
    const nights = pickup && returnDate ? dayDiff(pickup, returnDate) : 0;

    if (!car || nights <= 0 || !consent.checked || !age.checked) {
      alert("Please complete your dates and accept the legal booking disclosures before continuing.");
      return;
    }

    const paymentLink = BOOKING_CONFIG.stripePaymentLinks[car.id];
    if (!paymentLink || paymentLink.includes("fake")) {
      alert(
        "Stripe live links are not configured yet. Replace the placeholder links in assets/js/booking.js with your Stripe Payment Links or Checkout endpoint before going live."
      );
      return;
    }

    window.location.href = paymentLink;
  });

  updateSummary();
};

document.addEventListener("DOMContentLoaded", () => {
  renderCarCards();
  populateDetailPage();
  initBookingForm();
});