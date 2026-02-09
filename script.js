//
// Multi-Step Passport Form (STATIC)
// ✅ Step validation (can't go next unless valid)
// ✅ Input restrictions while typing
// ✅ Step 4 confirmation YES/NO
// ✅ Better UX + inline errors
// No libraries, offline
//


const form = document.getElementById("passportForm");
const statusText = document.getElementById("statusText");

const stepButtons = document.querySelectorAll(".stepper .step");
const stepPages = [
  document.getElementById("step1"),
  document.getElementById("step2"),
  document.getElementById("step3"),
  document.getElementById("step4"),
];

const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const editChooser = document.getElementById("editChooser");
const confirmNote = document.getElementById("confirmNote");

let currentStep = 1;
let isSubmitted = false;

// ---------- Helpers ----------
function setError(name, msg) {
  const el = document.querySelector(`[data-error-for="${name}"]`);
  if (el) el.textContent = msg || "";
}

function clearError(name) {
  const el = document.querySelector(`[data-error-for="${name}"]`);
  if (el) el.textContent = "";
}

function clearAllErrors() {
  document.querySelectorAll(".error").forEach(e => e.textContent = "");
}

function getRadioValue(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : "";
}

function onlyDigits(str) {
  return (str || "").replace(/\D/g, "");
}

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
}

function safeValue(v) {
  const t = (v || "").toString().trim();
  return t ? t : "—";
}

function fileName(inputId) {
  const el = document.getElementById(inputId);
  if (!el || !el.files || el.files.length === 0) return "—";
  return el.files[0].name;
}

// ---------- Input Restrictions (Live) ----------

// allow only letters + spaces
function keepLettersSpaces(inputEl, fieldName) {
  const original = inputEl.value;
  const cleaned = original.replace(/[^a-zA-Z\s]/g, "");
  if (cleaned !== original) {
    inputEl.value = cleaned;
    setError(fieldName, "Only letters and spaces are allowed.");
  } else {
    clearError(fieldName);
  }
}

// allow only digits with max length
function keepDigits(inputEl, fieldName, maxLen) {
  const original = inputEl.value;
  let cleaned = original.replace(/\D/g, "");
  if (typeof maxLen === "number") cleaned = cleaned.slice(0, maxLen);

  if (cleaned !== original) {
    inputEl.value = cleaned;
    setError(fieldName, "Only digits are allowed.");
  } else {
    clearError(fieldName);
  }
}

// prevent manual typing for date/month fields (picker only)
// note: some browsers still allow typing; we block key presses.
function preventManualTyping(el) {
  el.addEventListener("keydown", (e) => {
    // allow Tab, Shift+Tab, Arrow keys, Escape
    const allowed = ["Tab", "Shift", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Escape"];
    if (!allowed.includes(e.key)) e.preventDefault();
  });
}

// Apply restrictions
const letterFields = [
  ["firstName", "firstName"],
  ["lastName", "lastName"],
  ["nationality", "nationality"],
  ["city", "city"],
  ["state", "state"],
  ["cardName", "cardName"],
];

letterFields.forEach(([id, fieldName]) => {
  const el = document.getElementById(id);
  el.addEventListener("input", () => keepLettersSpaces(el, fieldName));
});

const digitFields = [
  ["mobile", "mobile", 10],
  ["pincode", "pincode", 6],
  ["cardNumber", "cardNumber", 16],
  ["cvv", "cvv", 3],
];

digitFields.forEach(([id, fieldName, maxLen]) => {
  const el = document.getElementById(id);
  el.addEventListener("input", () => keepDigits(el, fieldName, maxLen));
});

// National ID: digits only, allow up to 16 (and later validate 8–16 or exactly 12)
const nidEl = document.getElementById("nid");
nidEl.addEventListener("input", () => keepDigits(nidEl, "nid", 16));

// Date restrictions
preventManualTyping(document.getElementById("dob"));
preventManualTyping(document.getElementById("expiry"));

// ---------- Step Navigation ----------
function goToStep(stepNumber) {
  if (isSubmitted) return;

  currentStep = stepNumber;

  stepPages.forEach((page, idx) => {
    page.classList.toggle("hidden", idx + 1 !== stepNumber);
  });

  stepButtons.forEach(btn => {
    const s = Number(btn.dataset.step);
    btn.classList.toggle("is-active", s === stepNumber);
    btn.classList.toggle("is-done", s < stepNumber);
    btn.setAttribute("aria-current", s === stepNumber ? "step" : "false");
  });

  statusText.textContent = `Step ${stepNumber}`;

  if (stepNumber === 4) {
    buildReview();
    editChooser.classList.add("hidden");
    confirmNote.textContent = "";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

stepButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // allow clicking any step, but if moving forward validate current step first
    const target = Number(btn.dataset.step);
    if (target > currentStep) {
      const ok = validateStep(currentStep);
      if (!ok) {
        alert("Please fix the errors in this step before continuing.");
        return;
      }
    }
    goToStep(target);
  });
});

// Next/Prev buttons
document.querySelectorAll(".prevBtn").forEach(b => {
  b.addEventListener("click", () => goToStep(Number(b.dataset.prev)));
});

document.querySelectorAll(".nextBtn").forEach(b => {
  b.addEventListener("click", () => {
    const stepNow = currentStep;
    const ok = validateStep(stepNow);
    if (!ok) {
      alert("Please fix the errors in this step before continuing.");
      return;
    }
    goToStep(Number(b.dataset.next));
  });
});

// ---------- Validation per Step ----------
function validateStep(step) {
  clearAllErrors();
  let ok = true;

  if (step === 1) {
    const required = ["firstName","lastName","dob","nationality","nid","passportType","address","city","state","pincode","mobile","email"];
    required.forEach(name => {
      const el = form[name];
      if (!el || !el.value.trim()) { setError(name, "This field is required."); ok = false; }
    });

    if (!getRadioValue("gender")) { setError("gender", "Please select a gender."); ok = false; }

    const lettersCheck = ["firstName","lastName","nationality","city","state"];
    lettersCheck.forEach(f => {
      const val = form[f].value.trim();
      if (val && /[^a-zA-Z\s]/.test(val)) { setError(f, "Only letters and spaces are allowed."); ok = false; }
    });

    if (form.email.value && !isEmailValid(form.email.value)) {
      setError("email", "Enter a valid email address.");
      ok = false;
    }

    const pin = onlyDigits(form.pincode.value);
    if (pin.length !== 6) { setError("pincode", "Pincode must be exactly 6 digits."); ok = false; }

    const mob = onlyDigits(form.mobile.value);
    if (mob.length !== 10) { setError("mobile", "Mobile number must be exactly 10 digits."); ok = false; }

    const nid = onlyDigits(form.nid.value);
    if (!(nid.length === 12 || (nid.length >= 8 && nid.length <= 16))) {
      setError("nid", "National ID must be 8–16 digits (Aadhaar: exactly 12).");
      ok = false;
    }
  }

  if (step === 2) {
    ["photo","idProof","addressProof","birthCert"].forEach(name => {
      const input = form[name];
      if (!input.files || input.files.length === 0) {
        setError(name, "Please upload this document.");
        ok = false;
      }
    });
  }

  if (step === 3) {
    const method = getRadioValue("payMethod");
    if (!method) {
      setError("payMethod", "Please select payment method.");
      ok = false;
      return ok;
    }

    // ✅ IMPORTANT: only validate fields for selected method
    if (method === "UPI") {
      const upi = (document.getElementById("upiId")?.value || "").trim();
      if (!upi) {
        setError("upiId", "UPI ID is required.");
        ok = false;
      } else if (!isUpiValid(upi)) {
        setError("upiId", "Enter a valid UPI ID (example: ankit@okicici).");
        ok = false;
      }
    } else {
      // Card (Debit/Credit)
      ["cardName","cardNumber","expiry","cvv"].forEach(name => {
        const el = form[name];
        if (!el || !el.value.trim()) { setError(name, "This field is required."); ok = false; }
      });

      if (form.cardName.value && /[^a-zA-Z\s]/.test(form.cardName.value.trim())) {
        setError("cardName", "Only letters and spaces are allowed.");
        ok = false;
      }

      const card = onlyDigits(form.cardNumber.value);
      if (card.length !== 16) { setError("cardNumber", "Card number must be exactly 16 digits."); ok = false; }

      const cvv = onlyDigits(form.cvv.value);
      if (cvv.length !== 3) { setError("cvv", "CVV must be exactly 3 digits."); ok = false; }
    }

    // ✅ Govt-like rule: user cannot continue unless payment is PAID
    // (your payment system sets paid=true OR paymentState === 'PAID')
    if (typeof paymentState !== "undefined") {
      if (paymentState !== "PAID") {
        ok = false;
        // show friendly message near buttons
        const payResult = document.getElementById("payResult");
        if (payResult) {
          payResult.textContent = "Please complete payment verification to continue.";
          payResult.classList.add("pending");
        }
      }
    } else if (typeof paid !== "undefined") {
      if (!paid) ok = false;
    }

    // confirm checkbox only after payment
    if (!form.confirm.checked) {
      setError("confirm", "Please confirm the information.");
      ok = false;
    }
  }

  return ok;
}


// Full validation (used on YES)
function validateAll() {
  return validateStep(1) && validateStep(2) && validateStep(3);
}

// ---------- Review Summary ----------
function addReviewItem(container, key, val) {
  const div = document.createElement("div");
  div.className = "review-item";
  div.innerHTML = `<div class="k">${key}</div><div class="v">${val}</div>`;
  container.appendChild(div);
}

function buildReview() {
  const box = document.getElementById("reviewBox");
  box.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "review-grid";
  box.appendChild(grid);

  addReviewItem(grid, "First Name", safeValue(form.firstName.value));
  addReviewItem(grid, "Last Name", safeValue(form.lastName.value));
  addReviewItem(grid, "Date of Birth", safeValue(form.dob.value));
  addReviewItem(grid, "Gender", safeValue(getRadioValue("gender")));
  addReviewItem(grid, "Nationality", safeValue(form.nationality.value));
  addReviewItem(grid, "National ID", safeValue(form.nid.value));
  addReviewItem(grid, "Passport Type", safeValue(form.passportType.value));
  addReviewItem(grid, "City", safeValue(form.city.value));
  addReviewItem(grid, "State", safeValue(form.state.value));
  addReviewItem(grid, "Pincode", safeValue(form.pincode.value));
  addReviewItem(grid, "Mobile", safeValue(form.mobile.value));
  addReviewItem(grid, "Email", safeValue(form.email.value));
  addReviewItem(grid, "Address", safeValue(form.address.value));

  addReviewItem(grid, "Photograph File", fileName("photo"));
  addReviewItem(grid, "Identity Proof File", fileName("idProof"));
  addReviewItem(grid, "Address Proof File", fileName("addressProof"));
  addReviewItem(grid, "Birth Certificate File", fileName("birthCert"));

  addReviewItem(grid, "Application Fee", safeValue(form.fee.value));
  addReviewItem(grid, "Payment Method", safeValue(getRadioValue("payMethod")));
  addReviewItem(grid, "Card Holder Name", safeValue(form.cardName.value));
  addReviewItem(
    grid,
    "Card Number",
    form.cardNumber.value
      ? "•••• •••• •••• " + onlyDigits(form.cardNumber.value).slice(-4)
      : "—"
  );
  addReviewItem(grid, "Expiry", safeValue(form.expiry.value));
}

// ---------- Step 4 YES / NO ----------
yesBtn.addEventListener("click", () => {
  if (isSubmitted) return;

  const ok = validateAll();
  if (!ok) {
    alert("Some required details are missing or invalid. Please edit and try again.");
    goToStep(1);
    return;
  }

  isSubmitted = true;

  // mark all steps complete
  stepButtons.forEach(btn => {
    btn.classList.remove("is-active","is-done");
    btn.classList.add("is-complete");
    btn.disabled = true;
  });

  statusText.textContent = "Submitted";

  // disable everything
  lockForm();

  alert("Confirmed! Your application has been submitted successfully.");
  confirmNote.textContent = "✅ Confirmed and submitted. Editing is disabled.";
});

noBtn.addEventListener("click", () => {
  if (isSubmitted) return;
  confirmNote.textContent = "No problem — please edit your information.";
  editChooser.classList.remove("hidden");
});

// edit chooser buttons
document.querySelectorAll(".goEdit").forEach(btn => {
  btn.addEventListener("click", () => {
    const step = Number(btn.dataset.goto);
    goToStep(step);
  });
});

// lock after submit
function lockForm() {
  const controls = form.querySelectorAll("input, select, textarea, button");
  controls.forEach(el => (el.disabled = true));

  // show only step 4
  stepPages.forEach((page, idx) => page.classList.toggle("hidden", idx !== 3));
  document.querySelector(".stepper-wrap").classList.add("is-locked");
}

// Prevent default submit
form.addEventListener("submit", (e) => e.preventDefault());

// Start at step 1
goToStep(1);

/* =========================
   PAYMENT SIMULATION (Gov-like)
   ========================= */

const payStatus = document.getElementById("payStatus");
const txnIdEl = document.getElementById("txnId");
const payNowBtn = document.getElementById("payNowBtn");
const payResult = document.getElementById("payResult");
const toStep4Btn = document.getElementById("toStep4Btn");

const upiBox = document.getElementById("upiBox");
const cardBox = document.getElementById("cardBox");
const upiIdEl = document.getElementById("upiId");

let paid = false;

// Show correct method panel when payment method changes
document.querySelectorAll('input[name="payMethod"]').forEach(r => {
  r.addEventListener("change", () => {
    const method = getRadioValue("payMethod");
    


    upiBox.classList.toggle("hidden", method !== "UPI");
    cardBox.classList.toggle("hidden", method === "UPI" || method === "");
    clearAllErrors();

    

    // clear method-specific errors when switching
    setError("upiId", "");
    setError("cardName", "");
    setError("cardNumber", "");
    setError("expiry", "");
    setError("cvv", "");

    payResult.textContent = "";
  });
});

// very basic UPI format validation
function isUpiValid(v){
  // simple: "name@bank"
  return /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test((v||"").trim());
}

function genTxnId(){
  // Example: GOVTXN-20260208-8H3K2P
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  for(let i=0;i<6;i++) tail += letters[Math.floor(Math.random()*letters.length)];
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `GOVTXN-${y}${m}${day}-${tail}`;
}

function validatePaymentInputs(){
  let ok = true;
  const method = getRadioValue("payMethod");
  if(!method){
    setError("payMethod","Please select payment method.");
    return false;
  }

  if(method === "UPI"){
    const v = (upiIdEl.value || "").trim();
    if(!v){
      setError("upiId","UPI ID is required.");
      ok = false;
    } else if(!isUpiValid(v)){
      setError("upiId","Enter a valid UPI ID (example: ankit@okicici).");
      ok = false;
    } else {
      setError("upiId","");
    }
  } else {
    // card flow - reuse your existing restrictions
    if(!form.cardName.value.trim()){ setError("cardName","This field is required."); ok=false; }
    if(!form.cardNumber.value.trim()){ setError("cardNumber","This field is required."); ok=false; }
    if(!form.expiry.value.trim()){ setError("expiry","This field is required."); ok=false; }
    if(!form.cvv.value.trim()){ setError("cvv","This field is required."); ok=false; }

    // digits checks
    const card = onlyDigits(form.cardNumber.value);
    if(card.length !== 16){ setError("cardNumber","Card number must be exactly 16 digits."); ok=false; }

    const cvv = onlyDigits(form.cvv.value);
    if(cvv.length !== 3){ setError("cvv","CVV must be exactly 3 digits."); ok=false; }

    // letters-only name
    if(form.cardName.value && /[^a-zA-Z\s]/.test(form.cardName.value.trim())){
      setError("cardName","Only letters and spaces are allowed.");
      ok=false;
    }
  }

  return ok;
}

const verifyPayBtn = document.getElementById("verifyPayBtn");

let paymentState = "UNPAID"; // UNPAID | PENDING | PAID
let pendingTxn = null;

function setPayUI(state, message, cssClass) {
  paymentState = state;

  // Update status text
  if (state === "UNPAID") payStatus.textContent = "UNPAID";
  if (state === "PENDING") payStatus.textContent = "PENDING";
  if (state === "PAID") payStatus.textContent = "PAID";

  // Update result line
  payResult.textContent = message || "";
  payResult.classList.remove("pending", "paid", "processing");
  if (cssClass) payResult.classList.add(cssClass);

  // Txn id
  txnIdEl.textContent = pendingTxn || "—";

  // Button control
  if (state === "UNPAID") {
    payNowBtn.disabled = false;
    verifyPayBtn.disabled = true;
    form.confirm.disabled = true;
    toStep4Btn.disabled = true;
    payNowBtn.textContent = "Generate Payment Request";
  }

  if (state === "PENDING") {
    payNowBtn.disabled = true;
    verifyPayBtn.disabled = false;
    form.confirm.disabled = true;
    toStep4Btn.disabled = true;
  }

  if (state === "PAID") {
    payNowBtn.disabled = true;
    verifyPayBtn.disabled = true;
    form.confirm.disabled = false;     // now allow confirmation checkbox
    toStep4Btn.disabled = false;       // now allow Next
  }
}

function validatePaymentInputsGovStyle() {
  let ok = true;
  const method = getRadioValue("payMethod");

  if (!method) {
    setError("payMethod", "Please select payment method.");
    return false;
  }

  if (method === "UPI") {
    const v = (upiIdEl.value || "").trim();
    if (!v) {
      setError("upiId", "UPI ID is required.");
      ok = false;
    } else if (!isUpiValid(v)) {
      setError("upiId", "Enter a valid UPI ID (example: ankit@okicici).");
      ok = false;
    } else {
      setError("upiId", "");
    }
  } else {
    // card
    if (!form.cardName.value.trim()) { setError("cardName", "This field is required."); ok = false; }
    if (!form.cardNumber.value.trim()) { setError("cardNumber", "This field is required."); ok = false; }
    if (!form.expiry.value.trim()) { setError("expiry", "This field is required."); ok = false; }
    if (!form.cvv.value.trim()) { setError("cvv", "This field is required."); ok = false; }

    const card = onlyDigits(form.cardNumber.value);
    if (card.length !== 16) { setError("cardNumber", "Card number must be exactly 16 digits."); ok = false; }

    const cvv = onlyDigits(form.cvv.value);
    if (cvv.length !== 3) { setError("cvv", "CVV must be exactly 3 digits."); ok = false; }

    if (form.cardName.value && /[^a-zA-Z\s]/.test(form.cardName.value.trim())) {
      setError("cardName", "Only letters and spaces are allowed.");
      ok = false;
    }
  }

  return ok;
}

// Step 1 & 2 must be valid before payment (like govt portals)
function validateBeforePayment() {
  const okPrev = validateStep(1) && validateStep(2);
  if (!okPrev) {
    alert("Please complete Step 1 and Step 2 correctly before making payment.");
    goToStep(1);
    return false;
  }
  return true;
}

// ✅ Generate Payment Request (does NOT mark paid)
payNowBtn?.addEventListener("click", () => {
  if (paymentState !== "UNPAID") return;

  if (!validateBeforePayment()) return;

  const okPay = validatePaymentInputsGovStyle();
  if (!okPay) {
    alert("Please correct payment details and try again.");
    return;
  }

  // Generate a pending transaction
  pendingTxn = genTxnId();

  const method = getRadioValue("payMethod");
  const msg =
    method === "UPI"
      ? `Payment request generated. Please approve the request in your UPI app. Txn ID: ${pendingTxn}`
      : `Redirecting to bank gateway (Demo). Please verify to complete payment. Txn ID: ${pendingTxn}`;

  setPayUI("PENDING", msg, "pending");
});

// ✅ Verify Payment (only now it becomes PAID)
verifyPayBtn?.addEventListener("click", () => {
  if (paymentState !== "PENDING") return;

  // Simulate verification step (gov portals do this)
  setPayUI("PENDING", "Verifying payment... please wait (Demo).", "processing");

  setTimeout(() => {
    // success result (demo)
    document.querySelector(".fee-box")?.classList.add("paid");
    setPayUI("PAID", `Payment successful (Demo). Transaction ID: ${pendingTxn}`, "paid");
  }, 900);
});

// Default on load
setPayUI("UNPAID", "", "");


















