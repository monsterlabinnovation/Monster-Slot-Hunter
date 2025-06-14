// ==UserScript==
// @name         Monster Slot Hunter Payment Ai-Style+PayNow Retry Auto Stop+Fetch Slot A-Style Work FIxed Final V5.8
// @namespace    http://tampermonkey.net/
// @version      5.7
// @description  Final PayNow + OTP + Fetch Slot + reCAPTCHA + Retry + MultiClick integrated version (Chrome + TM Ready)
// @author       Monster Lab
// @match        https://payment.ivacbd.com/*
// @grant        none
// ==/UserScript==

(function initMonsterUI() {
  if (document.getElementById('kr-panel')) return;

    /* global grecaptcha */

// === ✅ Global Retry Setting (change here to control all retry limits)
  let stopAllFlag = false; // ✅ Add this near your other globals (e.g., retryOnFailMode)

  let maxRetries = Infinity;
  let multiClickMode = false;
  let retryOnFailMode = false;
  let aiStyleMode = false;
  let globalSuccessFlag = false;
  let totalOtpClicks = 0;
  let totalResendClicks = 0;

  let sendOtpBtn, resendOtpBtn, verifyOtpBtn, stopAllBtn, payNowBtn;
  let multiClickBtn, retryOnFailBtn, aiStyleBtn; // ✅ Add aiStyleBtn here
  let otpInput, dateInput, fetchBtn;
  let activeFetchControllers = [];

  let captchaCountdownInterval;
  let captchaCountdownSeconds = 60;

  let selectedDate = '';

 //Function CSRF Token

  function csrf() {
    const inputToken = document.querySelector('input[name="_token"]')?.value;
    if (inputToken) return inputToken;
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (metaToken) return metaToken;
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const match = script.textContent.match(/csrf_token['"]?\s*[:=]\s*['"]([a-zA-Z0-9-_]+)['"]/);
      if (match) return match[1];
    }
    const cookieToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='));
    if (cookieToken) return decodeURIComponent(cookieToken.split('=')[1]);
    return '';
  }

  function getCsrfToken() {
    if (!window.csrf_token || window.csrf_token === '') {
      window.csrf_token = csrf();
    }
    return window.csrf_token || '';
  }

  function updateStatus(msg, color = '#007bff') {
    console.log('%c[STATUS] ' + msg, `color: ${color}; font-weight: bold;`);
  }

  function updateMessage(msg) {
    console.log('[MESSAGE]', msg);
  }

  function showTemporaryMessage(msg) {
    alert(msg);
  }
  // Create a button with consistent style
  function createButton(text, bg, onClick, width = '100%') {
    const btn = document.createElement('button');
    btn.textContent = text;

    Object.assign(btn.style, {
      padding: '6px 10px',
      backgroundColor: bg,
      color: '#fff',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      width: width,
      marginBottom: '6px'
    });

    btn.onclick = onClick || function () {};
    return btn;
  }

  // Create a row (horizontal layout of elements)
  function row(children = []) {
    const div = document.createElement('div');
    Object.assign(div.style, {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '6px',
      marginBottom: '8px'
    });
    children.forEach(el => div.appendChild(el));
    return div;
  }

  // Label with styling
  function label(text) {
    const lbl = document.createElement('div');
    lbl.textContent = text;
    Object.assign(lbl.style, {
      fontWeight: 'bold',
      fontSize: '12px',
      marginBottom: '4px',
      color: 'white'
    });
    return lbl;
  }

  // Enable dragging for the panel using the header
  function makeDraggable(panel, handle) {
    let isDragging = false, offsetX = 0, offsetY = 0;

    handle.addEventListener('mousedown', function (e) {
      isDragging = true;
      offsetX = e.clientX - panel.offsetLeft;
      offsetY = e.clientY - panel.offsetTop;
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mouseup', function () {
      isDragging = false;
      document.body.style.userSelect = 'auto';
    });

    document.addEventListener('mousemove', function (e) {
      if (isDragging) {
        panel.style.left = `${e.clientX - offsetX}px`;
        panel.style.top = `${e.clientY - offsetY}px`;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
      }
    });
  }
  function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'kr-panel';
    Object.assign(panel.style, {
      width: '320px',
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#130f40',
      borderRadius: '8px',
      boxShadow: '0 0 12px rgba(0,0,0,0.3)',
      padding: '0',
      color: 'white',
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '12px',
      zIndex: '99999',
      overflow: 'hidden',
      userSelect: 'none'
    });

    const header = document.createElement('div');
    Object.assign(header.style, {
      padding: '8px 10px',
      backgroundColor: '#2c2c54',
      fontWeight: 'bold',
      fontSize: '13px',
      cursor: 'move',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      userSelect: 'none'
    });

    const title = document.createElement('span');
    title.textContent = '🔥Monster Slot Hunter Payment🔥';
    Object.assign(title.style, {
      pointerEvents: 'none',
      flex: '1',
      textAlign: 'left'
    });

    const toggleBtn = document.createElement('span');
    toggleBtn.textContent = '+';
    Object.assign(toggleBtn.style, {
      marginLeft: '10px',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '16px',
      userSelect: 'none'
    });

    const content = document.createElement('div');
    content.id = 'kr-content';
    Object.assign(content.style, {
      padding: '10px',
      display: 'block'
    });

    let isCollapsed = false;
    toggleBtn.onclick = function () {
      isCollapsed = !isCollapsed;
      content.style.display = isCollapsed ? 'none' : 'block';
      panel.style.height = isCollapsed ? '42px' : 'auto';
      toggleBtn.textContent = isCollapsed ? '+' : '–';
    };

    header.appendChild(title);
    header.appendChild(toggleBtn);
    panel.appendChild(header);
    panel.appendChild(content);
    document.body.appendChild(panel);

    makeDraggable(panel, header);

    const style = document.createElement('style');
    style.textContent = `
      #kr-panel button:hover {
        filter: brightness(1.1);
      }
      #kr-panel input:focus {
        outline: 2px solid #00cec9;
        background-color: #f2f2f2;
      }
      #kr-panel input {
        padding: 5px;
        border-radius: 4px;
        border: 1px solid #ccc;
        width: 100%;
        font-size: 12px;
        margin-bottom: 6px;
      }
    `;
    document.head.appendChild(style);

    return content;
  }
  function populate(content) {
    // --- Toggle Buttons ---
    multiClickBtn = createButton('Multi-Click [OFF]', '#6c5ce7', null, '32%');
retryOnFailBtn = createButton('Retry [OFF]', '#f39c12', null, '32%');
aiStyleBtn = createButton('AI-Style [OFF]', '#535c68', null, '32%');

const toggleRow = row([multiClickBtn, retryOnFailBtn, aiStyleBtn]);
content.appendChild(toggleRow);

multiClickBtn.onclick = () => toggleMode('multiClick');
retryOnFailBtn.onclick = () => toggleMode('retryFail');
aiStyleBtn.onclick = () => toggleMode('aiStyle');

updateButtonStyles();


    // --- OTP Control Panel ---
    content.appendChild(label('OTP Control Panel'));
    resendOtpBtn = createButton('Resend OTP', '#8854d0', null, '48%');
    sendOtpBtn = createButton('Send OTP', '#4b6584', null, '48%');
    content.appendChild(row([resendOtpBtn, sendOtpBtn]));
      // ✅ Inline OTP Success Message
const otpSuccessMsg = document.createElement('div');
otpSuccessMsg.id = 'otp-success-msg';
Object.assign(otpSuccessMsg.style, {
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#00ff99',
  marginTop: '6px',
  marginBottom: '6px',
  textAlign: 'center',
  display: 'none'
});
content.appendChild(otpSuccessMsg); // 👈 Add below OTP buttons


    otpInput = document.createElement('input');
    otpInput.type = 'number';
    otpInput.placeholder = 'Enter OTP';
    verifyOtpBtn = createButton('Verify OTP', '#1e3799', null, '48%');
    const otpRow = row([otpInput, verifyOtpBtn]);
    Object.assign(otpInput.style, { flex: '2' });
    Object.assign(verifyOtpBtn.style, { flex: '1' });
    content.appendChild(otpRow);

      // ✅ Inline OTP Verify Success Message
const otpVerifyMsg = document.createElement('div');
otpVerifyMsg.id = 'otp-verify-msg';
Object.assign(otpVerifyMsg.style, {
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#00ff99',
  marginTop: '6px',
  marginBottom: '6px',
  textAlign: 'center',
  display: 'none'
});
content.appendChild(otpVerifyMsg);


    // --- Appointment Date + Fetch ---
    content.appendChild(label('Appointment Date'));
    dateInput = document.createElement('input');
    dateInput.type = 'date';
    Object.assign(dateInput.style, { flex: '2' });
    fetchBtn = createButton('Fetch Slots', '#c44569', null, '48%');
    content.appendChild(row([dateInput, fetchBtn]));
      // ✅ "Select Date First" warning box (initially hidden)
const dateWarnBox = document.createElement('div');
dateWarnBox.id = 'date-warn-msg';
Object.assign(dateWarnBox.style, {
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#f1c40f',
  marginTop: '6px',
  marginBottom: '8px',
  display: 'none',
  textAlign: 'center'
});
content.appendChild(dateWarnBox); // Placed just after date + button row

	// New: Slot Success Message Box (below Fetch Button)
const fetchSuccessMsg = document.createElement('div');
fetchSuccessMsg.id = 'fetch-success-msg';
Object.assign(fetchSuccessMsg.style, {
  marginTop: '6px',
  color: '#00ff99',
  fontWeight: 'bold',
  fontSize: '13px',
  textAlign: 'center',
  display: 'none'
});
content.appendChild(fetchSuccessMsg);


    dateInput.addEventListener('change', () => {
      selectedDate = dateInput.value;
    });

    // --- Warning Message Below Date ---
    const dateWarningMsg = document.createElement('div');
    dateWarningMsg.id = 'date-warning-msg';
    Object.assign(dateWarningMsg.style, {
      marginTop: '8px',
      color: '#ffc107',
      fontWeight: 'bold',
      fontSize: '13px',
      textAlign: 'center',
      display: 'none'
    });
    content.appendChild(dateWarningMsg);
    // --- Fetch Button Logic ---
    fetchBtn.onclick = function () {
      if (!dateInput.value) {
        dateWarningMsg.textContent = '⚠️ Select Appointment Date First';
        dateWarningMsg.style.display = 'block';
        setTimeout(() => {
          dateWarningMsg.style.display = 'none';
        }, 5000);
        return;
      }

      if (fetchBtn.dataset.availableClick === 'true') {
        fetchBtn.dataset.availableClick = 'false';
        fetchBtn.textContent = 'Fetch Slots';
        fetchBtn.disabled = false;
        fetchBtn._originalClick();
        return;
      }

      if (fetchBtn.dataset.tryAgainClick === 'true') {
        fetchBtn.dataset.tryAgainClick = 'false';
        fetchBtn.textContent = 'Fetch Slots';
        fetchBtn.disabled = false;
        fetchBtn._originalClick();
        return;
      }

     if (retryOnFailMode && multiClickMode) {
  // Both ON → fire 5 parallel retryable requests
  function fireFetch(index) {
  setTimeout(() => {
    fetchBtn._originalClick();
  }, index * 100);
}

for (let i = 0; i < 5; i++) {
  fireFetch(i);
}


  return;
}

if (retryOnFailMode) {
  // Only retry mode ON → 1 retryable request
  fetchBtn._originalClick();
  return;
}

if (multiClickMode) {
  // Only multi-click ON → 5 independent requests (no retry logic inside)
  function fireFetch(index) {
  setTimeout(() => {
    fetchBtn._originalClick();
  }, index * 100);
}

for (let i = 0; i < 5; i++) {
  fireFetch(i);
}


  return;
}


      fetchBtn._originalClick();
    };
//Fetch Slot Button Function Start
fetchBtn._originalClick = async function () {
  globalSuccessFlag = false;
  stopAllFlag = false;

  const token = getCsrfToken();
  if (!token) {
    updateStatus('❌ No token', '#dc3545');
    return;
  }

  let retries = 0;
  const max = typeof maxRetries !== 'undefined' ? maxRetries : 3;
  let success = false;

  fetchBtn.dataset.clicks = '0';
  fetchBtn.dataset.availableClick = '';
  fetchBtn.dataset.tryAgainClick = '';

  const fetchOnce = async () => {
    if (stopAllFlag || globalSuccessFlag) return false;

    fetchBtn.dataset.clicks = Number(fetchBtn.dataset.clicks) + 1;
    fetchBtn.textContent = `Fetching (${fetchBtn.dataset.clicks})...`;
    updateStatus(`⏳ Sending request #${fetchBtn.dataset.clicks}`, '#17a2b8');

    const controller = new AbortController();
    activeFetchControllers.push(controller);

    try {
      const res = await fetch('https://payment.ivacbd.com/pay-slot-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': '*/*',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: `_token=${token}&appointment_date=${dateInput.value}`,
        signal: controller.signal
      });

      const result = await res.json();

      // ✅ Handle JSON success: true and valid response
      if (result.success && result.data?.status === "OK") {
        const slotTimes = result.data.slot_times || [];
        const availableSlot = slotTimes[0]?.availableSlot || 0;

        if (slotTimes.length > 0 && availableSlot > 0) {
          fetchBtn.textContent = `Available: ${availableSlot} ✅`;
          fetchBtn.style.backgroundColor = '#28a745';
          fetchBtn.dataset.availableClick = 'true';
          fetchBtn.disabled = false;

          fetchSuccessMsg.textContent = `✅ Slot Found! ${availableSlot} Available`;
          fetchSuccessMsg.style.display = 'block';

        } else {
          fetchBtn.textContent = `Try Again`;
          fetchBtn.dataset.tryAgainClick = 'true';
          fetchBtn.disabled = false;

          fetchSuccessMsg.textContent = `⚠️ No Slot Available, Try Again Later`;
          fetchSuccessMsg.style.display = 'block';
        }

        // ✅ AI-style stop everything after valid success
        if (aiStyleMode && !globalSuccessFlag) {
          globalSuccessFlag = true;
          stopAllFlag = true;
          activeFetchControllers.forEach(c => c.abort());
          activeFetchControllers = [];
        }

        updateStatus(`✅ Server Response Received`, '#28a745');
        return true;

      } else {
        updateStatus(`❌ No slots (click #${fetchBtn.dataset.clicks})`, '#ffc107');
        return false;
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        updateStatus(`🛑 Aborted (click #${fetchBtn.dataset.clicks})`, '#ffc107');
      } else {
        updateStatus(`❌ Error on request #${fetchBtn.dataset.clicks}`, '#dc3545');
        updateMessage(err.message);
      }
      return false;
    } finally {
      activeFetchControllers = activeFetchControllers.filter(c => c !== controller);
      fetchBtn.dataset.clicks--;
      if (fetchBtn.dataset.clicks <= 0 && !fetchBtn.dataset.availableClick && !fetchBtn.dataset.tryAgainClick) {
        fetchBtn.textContent = 'Fetch Slots';
      }
    }
  };

  // ✅ Retry loop — now respects globalSuccessFlag
  if (!retryOnFailMode) {
    await fetchOnce();
  } else {
    while (!success && retries <= max && retryOnFailMode && !stopAllFlag && !globalSuccessFlag) {
      success = await fetchOnce();
      if (!success && !globalSuccessFlag) {
        retries++;
        if (retries <= max && retryOnFailMode && !stopAllFlag && !globalSuccessFlag) {
          updateStatus(`🔁 Retrying (${retries}/${max})`, '#f1c40f');
        }
      }
    }
  }
};


//Fetch Slot Button Function Close

    // --- reCAPTCHA Section ---
    const captchaWrapper = document.createElement('div');
      // ✅ CAPTCHA Warning Box (initially hidden)
const captchaWarnBox = document.createElement('div');
captchaWarnBox.id = 'captcha-warn-msg';
Object.assign(captchaWarnBox.style, {
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#ff7675',
  marginTop: '6px',
  display: 'none',
  textAlign: 'center'
});
captchaWrapper.appendChild(captchaWarnBox); // add before captchaDiv

    Object.assign(captchaWrapper.style, {
      marginTop: '10px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    });

    const captchaTimerMsg = document.createElement('div');
    captchaTimerMsg.id = 'recaptcha-timer-msg';
    Object.assign(captchaTimerMsg.style, {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#ffc107',
      marginBottom: '6px'
    });

    const captchaDiv = document.createElement('div');
    captchaDiv.className = 'g-recaptcha';
    captchaDiv.setAttribute('data-sitekey', '6LdOCpAqAAAAAOLNB3Vwt_H7Nw4GGCAbdYm5Brsb');
    captchaDiv.setAttribute('data-callback', 'onCaptchaSuccess');
    captchaDiv.setAttribute('data-expired-callback', 'onCaptchaExpired');

    captchaWrapper.appendChild(captchaTimerMsg);
    captchaWrapper.appendChild(captchaDiv);
    content.appendChild(captchaWrapper);

    if (!window._recaptchaScriptInjected) {
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      window._recaptchaScriptInjected = true;
    }

    // --- Stop + Pay Now Row ---
stopAllBtn = createButton('⛔ Stop All', '#dc3545', () => {
  // ✅ Abort all running fetches
  activeFetchControllers.forEach(c => c.abort());
  activeFetchControllers = [];

  // ✅ Revert PayNow button if it was in "Hunting" mode
  if (payNowBtn.dataset.hunting === 'true') {
    payNowBtn.dataset.hunting = 'false';
    payNowBtn.textContent = 'Pay Now';
    payNowBtn.style.backgroundColor = '#28a745';
  }

  // ✅ Show "All Fetch Requests are Stopped" in footer
  paynowFooterBox.innerHTML = '';
  paynowFooterBox.style.display = 'block';
  paynowFooterBox.innerHTML = '<div>⛔ All Fetch Requests are Stopped</div>';

  // 🕐 Auto-hide after 5 seconds
  setTimeout(() => {
    paynowFooterBox.style.display = 'none';
    paynowFooterBox.innerHTML = '';
  }, 5000);
}, '48%');

stopAllBtn.style.border = '2px solid yellow';

// --- Pay Now Button Setup ---
payNowBtn = createButton('💳 Pay Now', '#28a745', null, '48%');
content.appendChild(row([stopAllBtn, payNowBtn]));

// --- Pay Now Button Click Logic ---
payNowBtn.onclick = function () {
  // ✅ If in "Hunting Mode", toggle back to default
  if (payNowBtn.dataset.hunting === 'true') {
    payNowBtn.dataset.hunting = 'false';
    payNowBtn.textContent = 'Pay Now';
    payNowBtn.style.backgroundColor = '#28a745';
    paynowFooterBox.style.display = 'none';
    return;
  }

  // ✅ Retry Mode Only (Single Request with Retry)
  if (retryOnFailMode && !multiClickMode) {
    payNowBtn.dataset.clicks = 0;
    payNowBtn._originalClick();
    return;
  }

  // ✅ MultiClick Mode (Send 5 Parallel Requests)
  if (multiClickMode) {
    for (let i = 0; i < 5; i++) payNowBtn._originalClick();
    return;
  }

  // ✅ Default Single Click
  payNowBtn.dataset.clicks = 0;
  payNowBtn._originalClick();
};


//Paynow Button Function Start✅

payNowBtn._originalClick = async function () {
  globalSuccessFlag = false; // ✅ Reset at start
  const token = getCsrfToken();
  if (!token) {
    updateStatus('❌ No token', '#dc3545');
    return;
  }

  const captchaResponse = document.querySelector(".g-recaptcha-response")?.value;
  if (!captchaResponse) {
    captchaWarnBox.textContent = '⚠️ CAPTCHA Verify First';
    captchaWarnBox.style.display = 'block';
    setTimeout(() => {
      captchaWarnBox.style.display = 'none';
      captchaWarnBox.textContent = '';
    }, 5000);
    return;
  }

  if (!selectedDate) {
    const dateWarnBox = document.getElementById('date-warn-msg');
    dateWarnBox.textContent = '⚠️ Select Date First';
    dateWarnBox.style.display = 'block';
    setTimeout(() => {
      dateWarnBox.style.display = 'none';
      dateWarnBox.textContent = '';
    }, 5000);
    return; // ⛔ Block fetch request
  }

  let retries = 0;

  const tryPay = async () => {
    const clickNum = payNowBtn.dataset.clicks ? ++payNowBtn.dataset.clicks : (payNowBtn.dataset.clicks = 1);
    updateStatus(`⏳ Sending payment request #${clickNum}`, '#17a2b8');
    payNowBtn.textContent = `Paying #${clickNum}`;

    const controller = new AbortController();
    activeFetchControllers.push(controller);

    try {
      const payload = new URLSearchParams({
        '_token': token,
        'appointment_date': selectedDate,
        'appointment_time': '10',
        'hash_param': captchaResponse,
        'selected_payment[name]': 'VISA',
        'selected_payment[slug]': 'visacard',
        'selected_payment[link]': 'https://securepay.sslcommerz.com/gwprocess/v4/image/gw1/visa.png'
      });

      const response = await fetch("https://payment.ivacbd.com/paynow", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: payload,
        signal: controller.signal
      });

      const result = await response.json();

      if (result.success && result.url) {
        // ✅ Show JSON footer with success message + URL
        paynowFooterBox.style.display = 'block';
        paynowFooterBox.innerHTML = `
          <div><strong>✅ Payment Success</strong></div>
          <div>Message: ${result.message || 'Success'}</div>
          <div>URL: <span style="color:#74b9ff">${result.url}</span></div>
        `;
        paynowFooterBox.appendChild(copyBtn); // Re-append copy button

        // ✅ Toggle PayNow into Hunting Mode
        payNowBtn.dataset.hunting = 'true';
        payNowBtn.textContent = '✅ Hunting Time';
        payNowBtn.style.backgroundColor = '#1dd1a1';

        updateStatus(`✅ Redirecting from click #${clickNum}`, '#28a745');
        window.open(result.url, '_blank');

        // ✅ AI-style mode: abort all others
        if (aiStyleMode && !globalSuccessFlag) {
          globalSuccessFlag = true;
          activeFetchControllers.forEach(c => c.abort());
          activeFetchControllers = [];
        }

      } else {
        updateStatus(`❌ Failed (#${clickNum})`, '#dc3545');
        updateMessage(result.message || "Payment failed");
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        updateStatus(`🛑 Aborted (#${clickNum})`, '#ffc107');
        updateMessage('Payment request aborted.');
      } else {
        updateStatus(`❌ Error (#${clickNum})`, '#dc3545');
        updateMessage(error.message);

        const shouldRetry = retryOnFailMode; // ✅ Retry based only on retry toggle
        if (shouldRetry && retries < maxRetries) {
  const captchaValue = document.querySelector(".g-recaptcha-response")?.value;
  if (!captchaValue) {
    updateStatus(`⛔ CAPTCHA expired during retry. Stopping further retries.`, '#ff7675');
    return; // 🚫 Stop retry loop if CAPTCHA has expired
  }

  retries++;
  updateStatus(`🔁 Retry ${retries} due to ${error.message}`, '#f1c40f');
  await tryPay();
}

      }
    } finally {
      activeFetchControllers = activeFetchControllers.filter(c => c !== controller);
      if (payNowBtn.dataset.hunting !== 'true') {
        payNowBtn.textContent = 'Pay Now';
        payNowBtn.style.backgroundColor = '#28a745';
      }
    }
  };

  await tryPay();
};

//Paynow Button Function Close ⛔



      // === ✅ PayNow JSON Footer Box ===
const paynowFooterBox = document.createElement('div');
paynowFooterBox.id = 'paynow-json-box';
Object.assign(paynowFooterBox.style, {
  marginTop: '10px',
  padding: '10px',
  backgroundColor: '#1e272e',
  border: '1px solid #10ac84',
  borderRadius: '6px',
  color: '#dff9fb',
  fontSize: '11px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  display: 'none',
  position: 'relative'
});

// Copy button
const copyBtn = document.createElement('button');
copyBtn.textContent = '📋 Copy URL';
Object.assign(copyBtn.style, {
  position: 'absolute',
  top: '6px',
  right: '6px',
  backgroundColor: '#10ac84',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  fontSize: '10px',
  padding: '2px 6px',
  cursor: 'pointer'
});
copyBtn.onclick = function () {
  const urlMatch = paynowFooterBox.textContent.match(/https:\/\/\S+/);
  if (urlMatch) {
    navigator.clipboard.writeText(urlMatch[0]);
    copyBtn.textContent = '✅ Copied';
    setTimeout(() => (copyBtn.textContent = '📋 Copy URL'), 2000);
  }
};
paynowFooterBox.appendChild(copyBtn);
content.appendChild(paynowFooterBox);

  } // END populate()

   function toggleMode(mode) {
  if (mode === 'multiClick') multiClickMode = !multiClickMode;
  if (mode === 'retryFail') retryOnFailMode = !retryOnFailMode;
  if (mode === 'aiStyle') aiStyleMode = !aiStyleMode; // ✅ Add this
  updateButtonStyles();
}


  function updateButtonStyles() {
  if (multiClickBtn) {
    multiClickBtn.textContent = `Multi-Click [${multiClickMode ? 'ON' : 'OFF'}]`;
    multiClickBtn.style.backgroundColor = multiClickMode ? '#00cec9' : '#6c5ce7';
  }
  if (retryOnFailBtn) {
    retryOnFailBtn.textContent = `Retry [${retryOnFailMode ? 'ON' : 'OFF'}]`;
    retryOnFailBtn.style.backgroundColor = retryOnFailMode ? '#e67e22' : '#f39c12';
  }
  if (aiStyleBtn) {
    aiStyleBtn.textContent = `AI-Style [${aiStyleMode ? 'ON' : 'OFF'}]`;
    aiStyleBtn.style.backgroundColor = aiStyleMode ? '#1dd1a1' : '#535c68';
  }
}


  // ✅ CAPTCHA: Success
  window.onCaptchaSuccess = function () {
      //Display Hide click captcha Start
           const otpMsg = document.getElementById('otp-success-msg');
if (otpMsg) otpMsg.style.display = 'none';

       const verifyMsg = document.getElementById('otp-verify-msg');
if (verifyMsg) verifyMsg.style.display = 'none';

    const fetchMsg = document.getElementById('fetch-success-msg');
  if (fetchMsg) fetchMsg.style.display = 'none';

            //Display Hide click captcha close

    const timerMsg = document.getElementById('recaptcha-timer-msg');
    if (timerMsg) {
      clearInterval(captchaCountdownInterval);
      captchaCountdownSeconds = 60;
      timerMsg.textContent = `⚠️ CAPTCHA Will Expire (${captchaCountdownSeconds})`;
      captchaCountdownInterval = setInterval(() => {
        captchaCountdownSeconds--;
        if (captchaCountdownSeconds > 0) {
          timerMsg.textContent = `⚠️ CAPTCHA Will Expire (${captchaCountdownSeconds})`;
        } else {
          clearInterval(captchaCountdownInterval);
          timerMsg.textContent = `⚠️ CAPTCHA expired. Please verify again.`;
          grecaptcha.reset();
        }
      }, 1000);
    }
  };

  // ✅ CAPTCHA: Expired
  window.onCaptchaExpired = function () {
    const timerMsg = document.getElementById('recaptcha-timer-msg');
    if (timerMsg) {
      timerMsg.textContent = `⚠️ CAPTCHA expired. Please verify again.`;
      clearInterval(captchaCountdownInterval);
    }
  };

  // ✅ OTP Button Handler Setup
  function setupOtpLogic(btn, isResend = false) {
    let retries = 0; // use global maxRetries
    let clickCounter = 0;
    let stopFlag = false;

    btn.onclick = async function () {
      if (btn.dataset.doneClick === 'true') {
        btn.dataset.doneClick = 'false';
        btn.textContent = isResend ? 'Resend OTP' : 'Send OTP';
        btn.style.backgroundColor = isResend ? '#8854d0' : '#4b6584';
        clickCounter = 0;
        return;
      }

      let retryCount = 0;
      async function sendRequest(controller, localClick) {
          globalSuccessFlag = false; // ✅ Reset flag at the start of action
        const token = getCsrfToken();
        if (!token) return;

        const label = isResend ? 'Resending' : 'Sending';
        btn.textContent = `${label} #${localClick}`;

        try {
          const res = await fetch('https://payment.ivacbd.com/pay-otp-sent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: '_token=' + encodeURIComponent(token) + '&resend=' + (isResend ? '1' : '0'),
            signal: controller.signal
          });

          if (res.status === 200) {
            const result = await res.json();
            if (result.success && result.message === 'Sms send successfully') {
              const otpBox = document.getElementById('otp-success-msg');
if (otpBox) {
  otpBox.textContent = '✅ SMS Sent Successfully!';
  otpBox.style.display = 'block';
}

              btn.textContent = isResend ? 'Done REOTP ✅' : 'Done OTP ✅';
              btn.style.backgroundColor = '#28a745';
btn.dataset.doneClick = 'true';

if (aiStyleMode && !globalSuccessFlag) {
  globalSuccessFlag = true;
  activeFetchControllers.forEach(c => c.abort());
  activeFetchControllers = [];
}

              return 'success';
            } else {
              throw new Error(result.message || 'Unexpected response');
            }
          } else {
            throw new Error('HTTP ' + res.status);
          }
        } catch (err) {
          if (stopFlag) return;
          const msg = err.message || '';
          const shouldRetry = retryOnFailMode && ['500', '502', '504', '419'].some(code => msg.includes(code));
          return shouldRetry ? 'retry' : msg;
        }
      }

      async function attemptSend(count) {
        const promises = [];
        for (let i = 0; i < count; i++) {
          const controller = new AbortController();
          activeFetchControllers.push(controller);
          const clickNumber = ++clickCounter;
          promises.push(sendRequest(controller, clickNumber));
        }
        const results = await Promise.all(promises);
        if (stopFlag) return;
        const retryable = results.filter(r => r === 'retry').length;
        retryCount++;
        if (retryable > 0 && retryCount < maxRetries) {
          await attemptSend(retryable);
        } else if (retryCount >= maxRetries) {
  updateStatus('⚠️ Max Retry Reached for Send or Resend OTP', '#ffc107');
  return;
}

      }

      if (retryOnFailMode && multiClickMode) {
        await attemptSend(5);
      } else if (retryOnFailMode) {
        await attemptSend(1);
      } else if (multiClickMode) {
        await attemptSend(5);
      } else {
        await attemptSend(1);
      }
    };
  }

  function setupVerifyOtpLogic() {
  globalSuccessFlag = false;

  verifyOtpBtn.onclick = async function () {
    if (verifyOtpBtn.dataset.doneClick === 'true') {
      verifyOtpBtn.dataset.doneClick = 'false';
      verifyOtpBtn.textContent = 'Verify OTP';
      verifyOtpBtn.style.backgroundColor = '#1e3799';
      verifyOtpBtn._originalClick();
      return;
    }

    let retryCount = 0;

    async function attemptVerify(count) {
      const promises = [];
      for (let i = 0; i < count; i++) {
        promises.push(verifyOtpBtn._originalClick(i + 1));
      }

      const results = await Promise.all(promises);
      console.log('🔁 Verify Results:', results);

      // ✅ Stop retry if success or AI-style flag triggered
      if (results.includes('success') || globalSuccessFlag) {
        console.log('✅ OTP Verified — stopping retry.');
        return;
      }

      const retryable = results.filter(r => r === 'retry').length;
      retryCount++;

      if (retryable > 0 && retryCount < maxRetries) {
        console.log(`🔁 Retrying ${retryable} Verify attempts (retryCount=${retryCount})`);
        await attemptVerify(retryable);
      } else if (retryCount >= maxRetries) {
        updateStatus('⚠️ Max Retry Reached for Verify OTP', '#ffc107');
      }
    }

    if (retryOnFailMode && multiClickMode) {
      await attemptVerify(5);
    } else if (retryOnFailMode) {
      await attemptVerify(1);
    } else if (multiClickMode) {
      for (let i = 0; i < 5; i++) verifyOtpBtn._originalClick(i + 1);
    } else {
      verifyOtpBtn._originalClick(1);
    }
  };

  verifyOtpBtn._originalClick = async function (clickNum = 1) {
    const otp = otpInput.value.trim();
    if (!otp) {
      updateStatus('⚠️ Enter OTP', '#ffc107');
      return 'fail';
    }

    const token = getCsrfToken();
    if (!token) {
      updateStatus('❌ No token', '#dc3545');
      return 'fail';
    }

    const controller = new AbortController();
    activeFetchControllers.push(controller);

    try {
      updateStatus(`⏳ Verifying OTP #${clickNum}`, '#17a2b8');
      verifyOtpBtn.textContent = `Verifying #${clickNum}`;

      const response = await fetch('https://payment.ivacbd.com/pay-otp-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': '*/*',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams({
          '_token': token,
          'otp': otp
        }),
        signal: controller.signal
      });

      const result = await response.json();
      updateMessage(result);

      if (result.success) {
        const verifyMsg = document.getElementById('otp-verify-msg');
        if (verifyMsg) {
          verifyMsg.textContent = '✅ OTP Verify Successfully!';
          verifyMsg.style.display = 'block';
        }

        verifyOtpBtn.textContent = 'Verify Done ✅';
        verifyOtpBtn.style.backgroundColor = '#28a745';
        verifyOtpBtn.dataset.doneClick = 'true';
        updateStatus('✅ OTP Verified (Click Done to continue)', '#28a745');

        if (aiStyleMode && !globalSuccessFlag) {
          globalSuccessFlag = true;
          activeFetchControllers.forEach(c => c.abort());
          activeFetchControllers = [];
        }

        if (result.data?.slot_dates?.length > 0) {
          selectedDate = result.data.slot_dates[0];
          dateInput.value = selectedDate;
        }

        return 'success';
      } else {
        updateStatus('❌ Failed to Verify OTP', '#dc3545');
        return retryOnFailMode ? 'retry' : 'fail';
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        updateStatus(`🛑 Aborted`, '#ffc107');
        updateMessage('Request was aborted.');
        return 'fail';
      } else {
        updateMessage(error.message);
        console.log('❌ OTP Verify Error:', error.message);
        return retryOnFailMode ? 'retry' : 'fail';
      }
    } finally {
      if (!verifyOtpBtn.dataset.doneClick) {
        verifyOtpBtn.textContent = 'Verify OTP';
        verifyOtpBtn.style.backgroundColor = '#1e3799';
      }
      activeFetchControllers = activeFetchControllers.filter(c => c !== controller);
    }
  };
}





  // ✅ Panel Init
  const init = () => {
    if (!document.getElementById('kr-panel')) {
      const content = createPanel();
      populate(content);
      setupOtpLogic(sendOtpBtn, false);
      setupOtpLogic(resendOtpBtn, true);
      setupVerifyOtpLogic();
    }
  };

 // ✅ Hybrid CSRF Token Detector: Supports input/meta/cookie/window.csrf_token
  const retryInit = setInterval(() => {
    const csrfAvailable =
      document.querySelector('input[name="_token"]') ||
      document.querySelector('meta[name="csrf-token"]') ||
      document.cookie.includes('XSRF-TOKEN=') ||
      (typeof window.csrf_token === 'string' && window.csrf_token.length > 0);

    if (csrfAvailable) {
      clearInterval(retryInit);
      init(); // Load panel after token is found
    }
  }, 1000);


})(); // ✅ End of Monster UI
