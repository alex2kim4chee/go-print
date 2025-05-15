// Массив для хранения истории сообщений
let messages = [];
let orderList = [];
let currentConfig = {};
let waitingForAnother = false;

// HTML-элементы
const chatContainer = document.getElementById('chat');
const inputField = document.getElementById('chat-input');
const sendButton = document.getElementById('chat-send');
const payButton = document.getElementById('pay-button');
const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');

// Добавление сообщения в интерфейс
function appendMessage(role, content) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = content;
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Спрашиваем, добавить ли ещё товар
function askToAddMore() {
  appendMessage("assistant", "Do you want to add another item to this order? (yes/no)");
  waitingForAnother = true;
}

// Обновляем UI заказа
function updateOrderUI(config) {
  const li = document.createElement('li');
  li.textContent = `${config.quantity} × ${config.product} (${config.size}, ${config.color}, ${config.method}, ${config.doubleSided ? '2 sides' : '1 side'})`;
  document.getElementById('order-list').appendChild(li);
}

// Извлекаем последнюю конфигурацию из чата
function extractLastConfig(messages) {
  const text = messages.map(m => m.content.toLowerCase()).join(' ');
  return {
    product: text.includes("hoodie") ? 'hoodie' :
             text.includes("hat") ? 'hat' :
             text.includes("tote") ? 'tote' : 'tshirt',
    color: text.includes("black") ? "black" :
           text.includes("white") ? "white" :
           text.includes("gray") ? "gray" : "blue",
    size: text.includes("xl") ? "XL" :
          text.includes("l") ? "L" :
          text.includes("m") ? "M" :
          text.includes("s") ? "S" : "M",
    method: text.includes("embroidery") ? "embroidery" : "print",
    doubleSided: text.includes("double-sided") || text.includes("both sides"),
    quantity: parseInt((text.match(/\d+/) || [1])[0])
  };
}

// Обработка отправки сообщения
async function sendMessage() {
  const userInput = inputField.value.trim();
  if (!userInput) return;

  appendMessage('user', userInput);
  inputField.value = '';
  messages.push({ role: 'user', content: userInput });

  if (waitingForAnother) {
    waitingForAnother = false;
    if (userInput.toLowerCase().includes("yes")) {
      currentConfig = {};
      appendMessage("assistant", "Great! Let’s configure your next item. What product?");
      messages.push({ role: 'assistant', content: "Great! Let’s configure your next item. What product?" });
      return;
    } else {
      await finalizeOrder();
      return;
    }
  }

  const res = await fetch('/functions/ai-handler', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  const data = await res.json();
  const aiReply = data.reply;

  appendMessage('assistant', aiReply);
  messages.push({ role: 'assistant', content: aiReply });

  if (aiReply.toLowerCase().includes("added to order")) {
    const config = extractLastConfig(messages);
    orderList.push(config);
    updateOrderUI(config);
    askToAddMore();
  }
}

// Расчет стоимости и финализация заказа
async function finalizeOrder() {
  appendMessage('assistant', "Calculating total...");
  const res = await fetch('/functions/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderList)
  });
  const result = await res.json();
  appendMessage('assistant', `Total: $${result.total}`);
  payButton.style.display = 'block';
}

// Обработчик кнопки оплаты
payButton.onclick = async () => {
  const canvas = document.getElementById('preview-canvas');
  const dataUrl = canvas.toDataURL('image/png');
  const res = await fetch('/functions/send-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: dataUrl, orderList })
  });
  const result = await res.json();
  if (result.stripeUrl) {
    window.location.href = result.stripeUrl;
  } else {
    alert("Something went wrong. Please try again.");
  }
};

// Обработчик формы загрузки логотипа
uploadForm.onsubmit = async (e) => {
  e.preventDefault();
  const file = fileInput.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  uploadStatus.innerText = "Uploading...";
  const res = await fetch('/functions/upload', {
    method: 'POST',
    body: formData
  });
  const result = await res.json();
  uploadStatus.innerText = `Uploaded: ${result.fileName}`;
  appendMessage('assistant', "Logo uploaded.");
  await renderPreview(extractLastConfig(messages).product, result.url);
};

// Функция рендеринга превью
async function renderPreview(product, logoUrl) {
  const canvas = document.getElementById('preview-canvas');
  const ctx = canvas.getContext('2d');
  const mockup = new Image();
  mockup.src = `/assets/mockups/${product}.png`;
  await mockup.decode();
  const logo = new Image();
  logo.src = logoUrl;
  await logo.decode();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(mockup, 0, 0, canvas.width, canvas.height);
  const logoWidth = 200;
  const logoHeight = (logo.height / logo.width) * logoWidth;
  const logoX = canvas.width / 2 - logoWidth / 2;
  const logoY = canvas.height / 2.5;
  ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
}

// Отправка сообщений при клике или Enter
sendButton.onclick = sendMessage;
inputField.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
