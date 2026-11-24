const API_BASE_URL = "http://localhost:4000/api";

let currentAuthMode = "login";
let currentUser = JSON.parse(localStorage.getItem("civicEventsUser") || "null");
let authToken = localStorage.getItem("civicEventsToken") || "";

const $authModal = $("#auth-modal");
const $authForm = $("#auth-form");
const $authMessage = $("#auth-message");
const $authSubmitButton = $("#auth-submit-button");

$("#current-year").text(new Date().getFullYear());

function showToast(message) {
    $("#toast").text(message).removeClass("hidden");

    setTimeout(() => {
        $("#toast").addClass("hidden");
    }, 3500);
}

function showAuthMessage(message, type = "error") {
    $authMessage
        .text(message)
        .removeClass("hidden bg-rose-50 text-rose-700 bg-emerald-50 text-emerald-700")
        .addClass(type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700");
}

function clearAuthMessage() {
    $authMessage.text("").addClass("hidden");
}

function showEventMessage(message, type = "error") {
    $("#create-event-message")
        .text(message)
        .removeClass("hidden bg-rose-50 text-rose-700 bg-emerald-50 text-emerald-700")
        .addClass(type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700");
}

function clearEventMessage() {
    $("#create-event-message").text("").addClass("hidden");
}

function openAuthModal(mode = "login") {
    setAuthMode(mode);
    $authModal.removeClass("hidden").addClass("flex");
    $("body").addClass("overflow-hidden");

    setTimeout(() => {
        $("#auth-email").trigger("focus");
    }, 50);
}

function closeAuthModal() {
    $authModal.addClass("hidden").removeClass("flex");
    $("body").removeClass("overflow-hidden");
    $authForm[0].reset();
    clearAuthMessage();
}

function setAuthMode(mode) {
    currentAuthMode = mode;

    const isSignup = mode === "signup";

    $("#auth-title").text(isSignup ? "Create your account" : "Welcome back");
    $("#auth-description").text(
        isSignup
            ? "Join your community and discover upcoming events."
            : "Log in to continue to your account."
    );

    $("#full-name-field").toggleClass("hidden", !isSignup);
    $("#full-name").prop("required", isSignup);
    $("#password-hint").toggleClass("hidden", !isSignup);
    $("#auth-password").attr("autocomplete", isSignup ? "new-password" : "current-password");
    $("#auth-submit-button").text(isSignup ? "Create Account" : "Log in");

    $("#login-tab")
        .toggleClass("bg-white text-indigo-700 shadow-sm", !isSignup)
        .toggleClass("text-slate-600", isSignup)
        .attr("aria-pressed", String(!isSignup));

    $("#signup-tab")
        .toggleClass("bg-white text-indigo-700 shadow-sm", isSignup)
        .toggleClass("text-slate-600", !isSignup)
        .attr("aria-pressed", String(isSignup));

    clearAuthMessage();
}

function updateNavigation() {
    const isLoggedIn = Boolean(authToken && currentUser);
    const isAdmin = isLoggedIn && String(currentUser.role || "").toLowerCase() === "admin";

    $("#login-button, #signup-button, #mobile-login-button, #mobile-signup-button, #hero-signup-button, #announcement-signup-button, #footer-signup-button")
        .toggleClass("hidden", isLoggedIn);

    $("#account-button, #logout-button")
        .toggleClass("hidden", !isLoggedIn);

    $("#admin-event-panel").toggleClass("hidden", !isAdmin);

    if (isLoggedIn) {
        $("#account-button").text(
            isAdmin
                ? `${currentUser.full_name || "Account"} · Admin`
                : currentUser.full_name || "My Account"
        );
    }
}

function saveSession(token, user) {
    authToken = token;
    currentUser = user;

    localStorage.setItem("civicEventsToken", token);
    localStorage.setItem("civicEventsUser", JSON.stringify(user));

    updateNavigation();
}

function clearSession() {
    authToken = "";
    currentUser = null;

    localStorage.removeItem("civicEventsToken");
    localStorage.removeItem("civicEventsUser");

    updateNavigation();
}

async function apiRequest(path, options = {}) {
    const headers = {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {})
    };

    if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message = typeof data === "object" && data !== null
            ? data.message || data.error || "The request could not be completed."
            : data || "The request could not be completed.";

        throw new Error(message);
    }

    return data;
}

async function submitAuthentication(event) {
    event.preventDefault();
    clearAuthMessage();

    const email = $("#auth-email").val().trim();
    const password = $("#auth-password").val();
    const fullName = $("#full-name").val().trim();

    if (currentAuthMode === "signup") {
        const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

        if (!fullName) {
            showAuthMessage("Please enter your full name.");
            return;
        }

        if (!strongPassword.test(password)) {
            showAuthMessage("Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character.");
            return;
        }
    }

    $authSubmitButton.prop("disabled", true).text("Please wait...");

    try {
        const endpoint = currentAuthMode === "signup"
            ? "/auth/signup"
            : "/auth/login";

        const payload = currentAuthMode === "signup"
            ? { full_name: fullName, email, password }
            : { email, password };

        const result = await apiRequest(endpoint, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        if (currentAuthMode === "signup") {
            showAuthMessage("Account created successfully. You can now log in.", "success");
            $authForm[0].reset();

            setTimeout(() => {
                setAuthMode("login");
            }, 1000);
        } else {
            if (!result.data || !result.data.token || !result.data.user) {
                throw new Error("The server response did not include a valid login session.");
            }

            saveSession(result.data.token, result.data.user);
            closeAuthModal();
            showToast(`Welcome back, ${result.data.user.full_name}!`);

            await loadEvents();
            await loadAnnouncements();
            await loadPromos();
        }
    } catch (error) {
        showAuthMessage(error.message || "Something went wrong. Please try again.");
    } finally {
        $authSubmitButton.prop("disabled", false).text(
            currentAuthMode === "signup" ? "Create Account" : "Log in"
        );
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatDate(value) {
    if (!value) {
        return "Date to be announced";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date to be announced";
    }

    return new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(date);
}

function formatDateTime(value) {
    if (!value) {
        return "Time to be announced";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Time to be announced";
    }

    return new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    }).format(date);
}

async function loadEvents() {
    const $container = $("#events-container");
    const $status = $("#events-status");

    $status.addClass("hidden").text("");
    $container.html(
        '<div class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading events...</div>'
    );

    try {
        const result = await apiRequest("/events");
        const events = Array.isArray(result)
            ? result
            : result.data?.events || result.data || result.events || [];

        if (!Array.isArray(events) || events.length === 0) {
            $container.empty();
            $status.removeClass("hidden").text("No events are available yet. Please check again later.");
            return;
        }

        $container.html(events.map(event => {
            const title = escapeHTML(event.title || "Community Event");
            const description = escapeHTML(event.description || "Discover more about this event.");
            const category = escapeHTML(event.category || "Community");
            const date = escapeHTML(formatDate(event.starts_at || event.event_date || event.date || event.start_date));
            const time = escapeHTML(formatDateTime(event.starts_at));
            const location = escapeHTML(event.location || "Location to be announced");
            const image = event.image_url || event.image || event.metadata?.image_url || "";
            const eventId = escapeHTML(event.id);

            const imageMarkup = image
                ? `<img src="${escapeHTML(image)}" alt="${title}" class="h-44 w-full rounded-xl object-cover" loading="lazy">`
                : '<div class="flex h-44 items-center justify-center rounded-xl bg-indigo-50 text-5xl text-indigo-300" aria-hidden="true">✦</div>';

            return `
                <article class="event-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" data-category="${category.toLowerCase()}">
                    ${imageMarkup}
                    <div class="mt-5">
                        <span class="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">${category}</span>
                        <h3 class="mt-3 text-xl font-bold text-slate-950">${title}</h3>
                        <p class="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">${description}</p>
                        <div class="mt-5 space-y-2 text-sm text-slate-500">
                            <p>📅 ${date}</p>
                            <p>🕒 ${time}</p>
                            <p>📍 ${location}</p>
                        </div>
                        <button class="register-event-button mt-5 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700" data-event-id="${eventId}">Register for Event</button>
                    </div>
                </article>
            `;
        }).join(""));

        filterEvents();
    } catch (error) {
        $container.empty();
        $status.removeClass("hidden").text(
            "We couldn't load events. Check that you are logged in and the backend is running, then refresh the page."
        );
        console.error("Events request failed:", error.message);
    }
}

function filterEvents() {
    const searchTerm = $("#event-search").val().trim().toLowerCase();
    const selectedCategory = $("#event-category").val().toLowerCase();
    let visibleCount = 0;

    $(".event-card").each(function () {
        const $card = $(this);
        const cardText = $card.text().toLowerCase();
        const cardCategory = String($card.data("category") || "").toLowerCase();

        const matchesSearch = cardText.includes(searchTerm);
        const matchesCategory = !selectedCategory || cardCategory === selectedCategory;

        $card.toggle(matchesSearch && matchesCategory);

        if (matchesSearch && matchesCategory) {
            visibleCount++;
        }
    });

    if ($(".event-card").length && visibleCount === 0) {
        $("#events-status").removeClass("hidden").text("No events match your search. Try another keyword or category.");
    } else {
        $("#events-status").addClass("hidden").text("");
    }
}

async function createEvent(event) {
    event.preventDefault();
    clearEventMessage();

    if (!authToken || !currentUser || String(currentUser.role || "").toLowerCase() !== "admin") {
        showEventMessage("Only administrators can create events.");
        return;
    }

    const title = $("#event-title").val().trim();
    const description = $("#event-description").val().trim();
    const location = $("#event-location").val().trim();
    const startsAtValue = $("#event-starts-at").val();
    const endsAtValue = $("#event-ends-at").val();

    if (!title || !location || !startsAtValue || !endsAtValue) {
        showEventMessage("Please complete the event title, location, start date, and end date.");
        return;
    }

    const startsAt = new Date(startsAtValue);
    const endsAt = new Date(endsAtValue);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
        showEventMessage("Please enter valid start and end dates.");
        return;
    }

    if (endsAt <= startsAt) {
        showEventMessage("The event end date and time must be after its start.");
        return;
    }

    const $button = $("#create-event-button");
    $button.prop("disabled", true).text("Publishing...");

    try {
        const result = await apiRequest("/events", {
            method: "POST",
            body: JSON.stringify({
                title,
                description,
                location,
                starts_at: startsAt.toISOString(),
                ends_at: endsAt.toISOString()
            })
        });

        $("#create-event-form")[0].reset();
        showEventMessage(result.message || "Your event has been published successfully.", "success");
        showToast("Event published successfully!");

        await loadEvents();
    } catch (error) {
        showEventMessage(error.message || "The event could not be published. Please try again.");
    } finally {
        $button.prop("disabled", false).text("Publish Event");
    }
}

async function loadAnnouncements() {
    const $container = $("#announcements-container");

    try {
        const result = await apiRequest("/announcements");
        const announcements = Array.isArray(result)
            ? result
            : result.data?.announcements || result.data || result.announcements || [];

        if (!Array.isArray(announcements) || announcements.length === 0) {
            $container.html('<p class="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">There are no announcements yet.</p>');
            return;
        }

        $container.html(announcements.map(item => `
            <article class="rounded-xl border border-slate-200 p-5">
                <h3 class="font-bold text-slate-900">${escapeHTML(item.title || "Community Update")}</h3>
                <p class="mt-2 text-sm leading-6 text-slate-600">${escapeHTML(item.message || item.content || item.description || "")}</p>
                <p class="mt-3 text-xs text-slate-400">${escapeHTML(formatDate(item.created_at || item.createdAt))}</p>
            </article>
        `).join(""));
    } catch (error) {
        $container.html('<p class="rounded-xl bg-rose-50 p-5 text-sm text-rose-700">Announcements could not be loaded.</p>');
        console.error("Announcements request failed:", error.message);
    }
}

async function loadPromos() {
    const $container = $("#promos-container");

    try {
        const result = await apiRequest("/promos");
        const promos = Array.isArray(result)
            ? result
            : result.data?.promos || result.data || result.promos || [];

        if (!Array.isArray(promos) || promos.length === 0) {
            $container.html('<p class="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">No featured videos are available yet.</p>');
            return;
        }

        $container.html(promos.map(promo => {
            const title = escapeHTML(promo.title || "Community Highlight");
            const description = escapeHTML(promo.description || promo.caption || "");
            const videoUrl = promo.video_url || promo.videoUrl || promo.url || "";

            let videoMarkup = "";

            try {
                const parsedUrl = new URL(videoUrl, window.location.origin);
                const host = parsedUrl.hostname.toLowerCase();

                if (host === "www.youtube.com" || host === "youtube.com" || host === "youtu.be") {
                    let videoId = "";

                    if (host === "youtu.be") {
                        videoId = parsedUrl.pathname.slice(1);
                    } else if (parsedUrl.pathname === "/watch") {
                        videoId = parsedUrl.searchParams.get("v") || "";
                    } else if (parsedUrl.pathname.startsWith("/embed/")) {
                        videoId = parsedUrl.pathname.split("/")[2] || "";
                    }

                    if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
                        videoMarkup = `<iframe class="aspect-video w-full rounded-xl" src="https://www.youtube-nocookie.com/embed/${videoId}" title="${title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
                    }
                }
            } catch (error) {
                videoMarkup = "";
            }

            return `
                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    ${videoMarkup || '<div class="flex aspect-video items-center justify-center rounded-xl bg-indigo-50 text-sm text-indigo-600">Video unavailable</div>'}
                    <h3 class="mt-4 text-lg font-bold text-slate-950">${title}</h3>
                    <p class="mt-2 text-sm leading-6 text-slate-600">${description}</p>
                </article>
            `;
        }).join(""));
    } catch (error) {
        $container.html('<p class="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Featured videos could not be loaded.</p>');
        console.error("Promos request failed:", error.message);
    }
}

$("#login-button, #mobile-login-button").on("click", () => openAuthModal("login"));
$("#signup-button, #mobile-signup-button, #hero-signup-button, #announcement-signup-button, #footer-signup-button").on("click", () => openAuthModal("signup"));

$("#login-tab").on("click", () => setAuthMode("login"));
$("#signup-tab").on("click", () => setAuthMode("signup"));
$("#close-auth-modal").on("click", closeAuthModal);

$authModal.on("click", function (event) {
    if (event.target === this) {
        closeAuthModal();
    }
});

$(document).on("keydown", function (event) {
    if (event.key === "Escape" && !$authModal.hasClass("hidden")) {
        closeAuthModal();
    }
});

$authForm.on("submit", submitAuthentication);
$("#create-event-form").on("submit", createEvent);

$("#mobile-menu-button").on("click", function () {
    const isExpanded = $(this).attr("aria-expanded") === "true";

    $(this).attr("aria-expanded", String(!isExpanded));
    $("#mobile-menu").toggleClass("hidden", isExpanded);
});

$("#mobile-menu .nav-link").on("click", function () {
    $("#mobile-menu").addClass("hidden");
    $("#mobile-menu-button").attr("aria-expanded", "false");
});

$("#event-search, #event-category").on("input change", filterEvents);

$("#account-button").on("click", function () {
    if (currentUser) {
        showToast(`Signed in as ${currentUser.full_name} (${currentUser.role}).`);
    }
});

$("#logout-button").on("click", function () {
    clearSession();
    showToast("You have been logged out.");
    loadEvents();
});

$(document).on("click", ".register-event-button", async function () {
    if (!authToken || !currentUser) {
        openAuthModal("login");
        showAuthMessage("Please log in before registering for an event.");
        return;
    }

    const button = $(this);
    const eventId = button.attr("data-event-id");

    if (!eventId) {
        showToast("Unable to identify this event.");
        return;
    }

    button.prop("disabled", true).text("Registering...");

    try {
        const result = await apiRequest("/event-registrations/register", {
            method: "POST",
            body: JSON.stringify({
                event_id: eventId
            })
        });

        button.text("Registered")
            .removeClass("bg-indigo-600 hover:bg-indigo-700")
            .addClass("bg-emerald-600");

        showToast(result.message || "You have successfully registered for this event.");
    } catch (error) {
        if (error.message.toLowerCase().includes("already registered")) {
            button.text("Already Registered")
                .removeClass("bg-indigo-600 hover:bg-indigo-700")
                .addClass("bg-slate-500");

            showToast("You are already registered for this event.");
        } else {
            button.prop("disabled", false).text("Register for Event");
            showToast(error.message || "Registration failed. Please try again.");
        }
    }
});

updateNavigation();
loadEvents();
loadAnnouncements();
loadPromos();