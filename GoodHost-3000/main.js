async function login() {
    const username = document.querySelector("#username-input").value;
    const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "text/plain" }, // should be changed if we send object
        body: username
    }); // could make this as query param + GET, but it's wrong as method definition: GET != POST
    if (res.ok) location.reload();
}
document.querySelector("#login").addEventListener("click", login);


let token = "TEST_DATA";
async function checkAuth() {
    const res = await fetch("/api/me");
    const data = await res.json();

    if (data.username) {
        document.querySelector("#login-info").textContent = "Logged in as";
        document.querySelector("#username").textContent = data.username;
        token = data._csrf_token;
    }
    else document.querySelector("#login-info").textContent = data.error;
}
checkAuth();


function logoutZombie() {
    if (!document.cookie) return console.log("Cookie is empty or I can't see it.");
    document.cookie = "SessionID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path =/;"; // possible only without HttpOnly
    location.reload();
}

function logout() {
    fetch("/api/logout").then(location.reload());
}
document.querySelector("#logout").addEventListener("click", logout);


async function createEmails() {
    const emailList = await fetch("/api/emails").then(res => res.json());
    if (!emailList.error) {

        const mainArea = document.querySelector("main");
        mainArea.textContent = "Click on email to read it.";
        emailList.forEach(email => {
            const emailEl = document.createElement("li");
            emailEl.textContent = "From: " + email.sender;
            emailEl.addEventListener("click", () => {
                mainArea.innerHTML = `<p>Subject: <b>${email.subject}</b></p> <p>${email.body}</p>`;
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";

            deleteBtn.addEventListener("click", () => {
                fetch(`/api/emails/delete/${email.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ _csrf_token: token }) // for supporting form-hack
                }).then(location.reload());
            });

            document.querySelector("#email-list").append(emailEl, deleteBtn);
        });
    }
}
createEmails();