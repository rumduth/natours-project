import "@babel/polyfill";
import { login, logout } from "./login";
import { displayMap } from "./mapbox";
import { updateSettings } from "./updateSettings";
import { bookTour } from "./stripe";
import { signup } from "./signup";
import { showAlert } from "./alerts";
// ODM elements
const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const logOutBtn = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");
const bookBtn = document.getElementById("book-tour");
const signupForm = document.querySelector(".form--signup");
const bookingConfirm = document.querySelector(".booking");
// Values

if (mapBox) {
  const locations = JSON.parse(
    document.getElementById("map").dataset.locations
  );
  displayMap(locations);
}

if (logOutBtn) {
  logOutBtn.addEventListener("click", logout);
}

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });
}

if (userDataForm) {
  userDataForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("photo", document.getElementById("photo").files[0]);
    await updateSettings(form, "data");
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelector(".btn--save-password").textContent = "Updating...";
    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      "password"
    );
    document.querySelector(".btn--save-password").textContent =
      "Saved password";
    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";
  });
}

if (bookBtn) {
  bookBtn.addEventListener("click", async (e) => {
    e.target.textContent = "Processing...";
    const tourID = e.target.dataset.tourId;
    await bookTour(tourID);
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email--signup").value;
    const password = document.getElementById("password--signup").value;
    const passwordConfirm = document.getElementById("confirm-password").value;
    await signup(name, email, password, passwordConfirm);
  });
}

if (bookingConfirm) {
  showAlert("success", "Booking succesfully");
}
