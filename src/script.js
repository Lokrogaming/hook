const webhookInput = document.getElementById('webhookInput');
const webhookInputName = document.getElementById('webhookInputName');
const webhookAvatar = document.getElementById('webhookAvatar');
const addWebhookBtn = document.getElementById('addWebhook');
const webhookList = document.getElementById('webhookList');
const confirmSetup = document.getElementById('confirmSetup');
const setupDiv = document.getElementById('setup');
const mainDiv = document.getElementById('main');
const webhookSelect = document.getElementById('webhookSelect');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesDiv = document.getElementById('messages');
const toggleEmbed = document.getElementById('toggleEmbed');
const embedSection = document.getElementById('embedSection');
const embedTitle = document.getElementById('embedTitle');
const embedDesc = document.getElementById('embedDesc');
const embedColor = document.getElementById('embedColor');
const embedImage = document.getElementById('embedImage');
const saveMessageCheckbox = document.getElementById('saveMessageCheckbox');
const savedMessagesDiv = document.getElementById('savedMessages');
const exportMessagesBtn = document.getElementById('exportMessages');
const backToSetupBtn = document.getElementById('backToSetup');
const warningContainer = document.getElementById('warningContainer');
const proceedBtn = document.getElementById('proceedWarning');
const discardBtn = document.getElementById('discard');



let webhooks = JSON.parse(localStorage.getItem('webhooks')) || [];
let savedMessages = JSON.parse(localStorage.getItem('savedMessages')) || [];

// ---------- Webhook Rendering ----------
function renderWebhooks() {
  webhookList.innerHTML='';
  webhooks.forEach((w,i)=>{
    const div=document.createElement('div');
    div.className='webhook-item';
    div.innerHTML=`<span>${w.name} (${w.url})</span>
      <button class='small-btn' onclick='removeWebhook(${i})'>Entfernen</button>`;
    webhookList.appendChild(div);
  });
  confirmSetup.disabled = webhooks.length===0;
}

function removeWebhook(i){
  webhooks.splice(i,1);
  localStorage.setItem('webhooks',JSON.stringify(webhooks));
  renderWebhooks();
}

// ---------- Input Validation & Discord-Style Errors ----------
function showInputError(input, msgText) {
  input.classList.add('error');
  if(!input.nextElementSibling || !input.nextElementSibling.classList.contains('input-error-msg')){
    const msg = document.createElement('div');
    msg.className='input-error-msg';
    msg.textContent = msgText;
    input.parentNode.insertBefore(msg, input.nextSibling);
  }
}

function clearInputError(input) {
  input.classList.remove('error');
  if(input.nextElementSibling && input.nextElementSibling.classList.contains('input-error-msg')){
    input.nextElementSibling.remove();
  }
}

function validateWebhookInput() {
  const url = webhookInput.value.trim();
  if(!url.startsWith('https://discord.com/api/webhooks/')) {
    showInputError(webhookInput,'Ungültiger Webhook-Link!');
    return false;
  } else {
    clearInputError(webhookInput);
    return true;
  }
}

// ---------- Add Webhook ----------
addWebhookBtn.onclick = () => {
  if(!validateWebhookInput()) return;
  const url=webhookInput.value.trim();
  const name=webhookInputName.value.trim() || 'Webhook';
  const avatar=webhookAvatar.value.trim() || "https://lokrogaming.github.io/src/assets/icon.png";
  webhooks.push({name,url,avatar});
  localStorage.setItem('webhooks',JSON.stringify(webhooks));
  webhookInput.value=''; webhookInputName.value='Webhook'; webhookAvatar.value='';
  renderWebhooks();
};

// ---------- Setup Confirm ----------
confirmSetup.onclick = ()=>{
  setupDiv.style.display='none';
  mainDiv.style.display='block';
  updateWebhookSelect();
  renderSavedMessages();
};

// ---------- Update Webhook Select ----------
function updateWebhookSelect(){
  webhookSelect.innerHTML='';
  webhooks.forEach((w,i)=>{
    const opt=document.createElement('option');
    opt.value=i; opt.textContent=w.name;
    webhookSelect.appendChild(opt);
  });
}

// ---------- Embed Toggle ----------
toggleEmbed.onclick = ()=>{embedSection.style.display = embedSection.style.display==='none'?'block':'none';}

// ---------- Saved Messages ----------
function renderSavedMessages(){
  savedMessagesDiv.innerHTML='';
  savedMessages.forEach((msg,i)=>{
    const div=document.createElement('div');
    div.className='message-item';
    div.innerHTML=`<span>${msg.content||'(Embed)'}</span>
      <button class='small-btn' onclick='sendSavedMessage(${i})'>Senden</button>
      <button class='small-btn' style="background:#888;margin-left:4px" onclick='deleteSavedMessage(${i})'>Löschen</button>`;
    savedMessagesDiv.appendChild(div);
  });
}

function deleteSavedMessage(i){
  savedMessages.splice(i,1);
  localStorage.setItem('savedMessages',JSON.stringify(savedMessages));
  renderSavedMessages();
}

async function sendSavedMessage(i){
  const msg = savedMessages[i];
  messageInput.value = msg.content || '';
  if(msg.embed){
    embedSection.style.display='block';
    embedTitle.value=msg.embed.title;
    embedDesc.value=msg.embed.desc;
    embedColor.value=msg.embed.color;
    embedImage.value=msg.embed.image;
  } else embedSection.style.display='none';
  sendBtn.click();
}

// ---------- Send Message ----------
sendBtn.onclick = async ()=>{
  const w = webhooks[webhookSelect.value];
  const message = messageInput.value.trim();
  if(!message && embedSection.style.display==='none') return alert('Nachricht darf nicht leer sein!');

  const payload={username:w.name,avatar_url:w.avatar};
  let embedData=null;

  if(embedSection.style.display==='block' && embedTitle.value && embedDesc.value){
    payload.embeds=[{
      title: embedTitle.value,
      description: embedDesc.value,
      color: parseInt(embedColor.value.replace('#',''),16)||16777215,
      image: embedImage.value?{url:embedImage.value}:undefined
    }];
    embedData={title:embedTitle.value,desc:embedDesc.value,color:embedColor.value,image:embedImage.value};
  } else payload.content=message;

  try {
    const res = await fetch(w.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(res.ok){
      const div=document.createElement('div');
      div.className='webhook-item';
      div.innerHTML=`<span>${message||'(Embed gesendet)'}</span>
        <button class='small-btn delete-btn'>Löschen</button>`;
      messagesDiv.prepend(div);

      if(saveMessageCheckbox.checked){
        savedMessages.push({content:message,embed:embedData});
        localStorage.setItem('savedMessages',JSON.stringify(savedMessages));
        renderSavedMessages();
      }

      messageInput.value=''; embedTitle.value=''; embedDesc.value=''; embedColor.value=''; embedImage.value=''; saveMessageCheckbox.checked=false;
    } else alert('Fehler beim Senden!');
  } catch(e){
    alert('Fehler beim Senden! '+e);
  }
};

// ---------- Delete Sent Messages ----------
messagesDiv.addEventListener('click',async e=>{
  if(e.target.classList.contains('delete-btn')){
    e.target.parentElement.remove();
  }
});

// ---------- Export Saved Messages ----------
exportMessagesBtn.onclick = ()=>{
    
    
  const blob = new Blob([JSON.stringify(savedMessages,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download='saved_messages.json'; a.click();
  URL.revokeObjectURL(url);
};
                              
// ---------- Initial Load ----------
if(webhooks.length>0){
  setupDiv.style.display='none';
  mainDiv.style.display='block';
  updateWebhookSelect();
  renderSavedMessages();
} else renderWebhooks();
// ---------- UI ----------
proceedBtn.addEventListener("click", () => {

if (warningContainer.style.display === "block") {
  warningContainer.style.display = "none";
  setupDiv.style.display = "block"
  renderWebhooks();
}

})

discardBtn.addEventListener("click", () => {

if (warningContainer.style.display === "block") {
  warningContainer.style.display = "none";
  mainDiv.style.display = "block";
  renderSavedMessages();
}

})





backToSetupBtn.addEventListener("click", () => {
  mainDiv.style.display = "none";
  warningContainer.style.display = "block";
});
