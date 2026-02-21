document.cookie = "SessionID=123456";
const emailList = await fetch("/emails").then(res => res.json());

const mainArea = document.querySelector("main");
emailList.forEach(email => {
    const emailEl = document.createElement("li");
    emailEl.textContent = "From: " + email.sender;
    emailEl.addEventListener("click", () => {
        mainArea.innerHTML = `<p>Subject: <b>${email.subject}</b></p> <p>${email.body}</p>`;
    });

    document.querySelector("#email-list").append(emailEl);
});
