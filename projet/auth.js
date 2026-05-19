document.getElementById("to-register").addEventListener("click", () => {
  document.getElementById("login-section").classList.add("hidden");
  document.getElementById("register-section").classList.remove("hidden");
  clearAlerts();
});

document.getElementById("to-login").addEventListener("click", () => {
  document.getElementById("register-section").classList.add("hidden");
  document.getElementById("login-section").classList.remove("hidden");
  clearAlerts();
});

const errorBox = document.getElementById("error-box");
const successBox = document.getElementById("success-box");

function clearAlerts() {
  errorBox.style.display = "none";
  successBox.style.display = "none";
}

// Handle Login Form Submit
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlerts();

  const formData = new FormData(e.target);
  try {
    const response = await fetch("login.php", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    if (data.success) {
      window.location.href = "index.html"; // Redirect to your catalog
    } else {
      errorBox.textContent = data.message;
      errorBox.style.display = "block";
    }
  } catch (err) {
    errorBox.textContent = "An error occurred during login.";
    errorBox.style.display = "block";
  }
});

// Handle Registration Form Submit
document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAlerts();

    const formData = new FormData(e.target);
    try {
      const response = await fetch("register.php", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        successBox.textContent = data.message;
        successBox.style.display = "block";
        e.target.reset();
        // Switch view back to login
        setTimeout(() => {
          document.getElementById("to-login").click();
        }, 2000);
      } else {
        errorBox.textContent = data.message;
        errorBox.style.display = "block";
      }
    } catch (err) {
      errorBox.textContent = "An error occurred during registration.";
      errorBox.style.display = "block";
    }
  });
