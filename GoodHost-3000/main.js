async function login() {
    const username = document.querySelector("#username-input").value;
    const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "text/plain" }, // should be changed if we send object
        body: username
    }); // could make this as query param + GET, but it's wrong as method definition: GET != POST
    if (res.ok) location.reload();
}
document.querySelector("#login").addEventListener("click", login);


async function checkLogin() {
    const res = await fetch("/api/me");
    const data = await res.json();

    if (data.username) {
        document.querySelector("#login-info").textContent = "Logged in as";
        document.querySelector("#username").textContent = data.username;
    }
    else document.querySelector("#login-info").textContent = data.error;
}
checkLogin();


const emailList = await fetch("/api/emails").then(res => res.json());

const mainArea = document.querySelector("main");
emailList.forEach(email => {
    const emailEl = document.createElement("li");
    emailEl.textContent = "From: " + email.sender;
    emailEl.addEventListener("click", () => {
        mainArea.innerHTML = `<p>Subject: <b>${email.subject}</b></p> <p>${email.body}</p>`;
    });

    document.querySelector("#email-list").append(emailEl);
});
