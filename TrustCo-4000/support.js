const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "http://localhost:4000/styles.css";
document.head.appendChild(link);

const chat = document.querySelector("#support-chat");
const msgContainer = document.createElement("div");
msgContainer.id = "message-container";
chat.append(msgContainer);

const chatBtn = document.createElement("button");
chatBtn.textContent = "Chat with Support";
chatBtn.addEventListener("click", onClick);
chat.append(chatBtn);


async function onClick() {
    try {
        const messages = await fetch("http://localhost:4000/messages").then(res => res.json());
        const newMessages = messages.slice(msgContainer.childElementCount);
        //const messages = ["test", "hi everyone"];
        if (newMessages.length === 0) return console.log("No new messages.");
        newMessages.forEach(msg => {
            const msgEl = document.createElement("div");
            msgEl.className = "msg";
            msgEl.textContent = msg;

            msgContainer.append(msgEl);
        });

    } catch (err) {
        console.error("[Server] Error while fetching:", err);
    }
}