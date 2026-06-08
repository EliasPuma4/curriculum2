const $ = (id) => document.getElementById(id);

const campos = ["nombre","cargo","correo","telefono","ubicacion","linkedin","perfil","experiencia","educacion","habilidades","extras"];

function texto(id, fallback){ return $(id).value.trim() || fallback; }

function actualizarCV(){
  $("pNombre").textContent = texto("nombre","Tu Nombre Completo");
  $("pCargo").textContent = texto("cargo","Profesión o cargo deseado");
  $("pCorreo").textContent = texto("correo","Correo electrónico");
  $("pTelefono").textContent = texto("telefono","Teléfono");
  $("pUbicacion").textContent = texto("ubicacion","Ciudad / País");
  $("pLinkedin").textContent = texto("linkedin","LinkedIn / Portafolio");
  $("pPerfil").textContent = texto("perfil","Resumen profesional.");
  $("pExperiencia").textContent = texto("experiencia","Experiencia laboral principal.");
  $("pEducacion").textContent = texto("educacion","Formación académica principal.");
  $("pExtras").textContent = texto("extras","Idiomas o certificaciones.");

  const habilidades = texto("habilidades","Responsabilidad, comunicación, trabajo en equipo")
    .split(",").map(h=>h.trim()).filter(Boolean);

  $("pHabilidades").innerHTML = "";
  habilidades.forEach(h=>{
    const li = document.createElement("li");
    li.textContent = h;
    $("pHabilidades").appendChild(li);
  });
}

campos.forEach(id => $(id).addEventListener("input", actualizarCV));
$("btnActualizar").addEventListener("click", actualizarCV);

document.querySelectorAll(".modelo-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".modelo-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const cv = $("cvPreview");
    cv.classList.remove("modelo1","modelo2","modelo3");
    cv.classList.add(btn.dataset.modelo);
  });
});

$("btnGaleria").addEventListener("click", () => $("fotoGaleria").click());
$("btnCamara").addEventListener("click", () => $("fotoCamara").click());

$("fotoGaleria").addEventListener("change", manejarFoto);
$("fotoCamara").addEventListener("change", manejarFoto);

function manejarFoto(){
  const file = this.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => abrirRecorte(e.target.result);
  reader.readAsDataURL(file);
}

const cropModal = $("cropModal");
const cropCanvas = $("cropCanvas");
const ctx = cropCanvas.getContext("2d");
const zoomRange = $("zoomRange");

let cropImg = new Image();
let scale = 1, posX = 0, posY = 0, isDragging = false, startX = 0, startY = 0;

function abrirRecorte(src){
  cropImg = new Image();
  cropImg.onload = ()=>{
    scale = Math.max(cropCanvas.width / cropImg.width, cropCanvas.height / cropImg.height);
    zoomRange.value = 1;
    posX = (cropCanvas.width - cropImg.width * scale) / 2;
    posY = (cropCanvas.height - cropImg.height * scale) / 2;
    cropModal.classList.remove("hidden");
    dibujarCrop();
  };
  cropImg.src = src;
}

function dibujarCrop(){
  ctx.clearRect(0,0,cropCanvas.width,cropCanvas.height);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0,0,cropCanvas.width,cropCanvas.height);
  ctx.drawImage(cropImg,posX,posY,cropImg.width*scale,cropImg.height*scale);
}

zoomRange.addEventListener("input",()=>{
  const baseScale = Math.max(cropCanvas.width / cropImg.width, cropCanvas.height / cropImg.height);
  const previousScale = scale;
  scale = baseScale * parseFloat(zoomRange.value);
  const centerX = cropCanvas.width / 2;
  const centerY = cropCanvas.height / 2;
  posX = centerX - (centerX - posX) * (scale / previousScale);
  posY = centerY - (centerY - posY) * (scale / previousScale);
  dibujarCrop();
});

function getPointer(e){
  const rect = cropCanvas.getBoundingClientRect();
  const touch = e.touches ? e.touches[0] : e;
  return {
    x:(touch.clientX - rect.left) * (cropCanvas.width / rect.width),
    y:(touch.clientY - rect.top) * (cropCanvas.height / rect.height)
  };
}

function iniciarArrastre(e){
  e.preventDefault();
  isDragging = true;
  const p = getPointer(e);
  startX = p.x - posX;
  startY = p.y - posY;
}

function moverArrastre(e){
  if(!isDragging) return;
  e.preventDefault();
  const p = getPointer(e);
  posX = p.x - startX;
  posY = p.y - startY;
  dibujarCrop();
}

function terminarArrastre(){ isDragging = false; }

cropCanvas.addEventListener("mousedown", iniciarArrastre);
cropCanvas.addEventListener("mousemove", moverArrastre);
window.addEventListener("mouseup", terminarArrastre);
cropCanvas.addEventListener("touchstart", iniciarArrastre, {passive:false});
cropCanvas.addEventListener("touchmove", moverArrastre, {passive:false});
window.addEventListener("touchend", terminarArrastre);

$("cancelCrop").addEventListener("click",()=>{
  cropModal.classList.add("hidden");
  $("fotoGaleria").value = "";
  $("fotoCamara").value = "";
});

$("applyCrop").addEventListener("click",()=>{
  const output = document.createElement("canvas");

  /* Foto más liviana: 220 x 220 en lugar de 500 x 500 */
  output.width = 220;
  output.height = 220;

  const octx = output.getContext("2d");
  octx.fillStyle = "#ffffff";
  octx.fillRect(0, 0, output.width, output.height);

  octx.save();
  octx.beginPath();
  octx.arc(110,110,110,0,Math.PI*2);
  octx.clip();

  const circleSize = 260;
  const sourceX = (cropCanvas.width - circleSize) / 2;
  const sourceY = (cropCanvas.height - circleSize) / 2;

  octx.drawImage(cropCanvas, sourceX, sourceY, circleSize, circleSize, 0, 0, 220, 220);
  octx.restore();

  /* JPEG comprimido para reducir peso */
  $("previewFoto").src = output.toDataURL("image/jpeg", 0.75);
  $("previewFoto").classList.remove("hidden");
  $("placeholderFoto").classList.add("hidden");
  cropModal.classList.add("hidden");
});

$("btnPDF").addEventListener("click", async ()=>{
  const mensaje = $("mensaje");

  if(!window.html2canvas || !window.jspdf){
    mensaje.textContent = "No cargaron las librerías del PDF. Revisa tu conexión a internet.";
    return;
  }

  actualizarCV();
  const boton = $("btnPDF");
  boton.disabled = true;
  boton.textContent = "Generando PDF...";
  mensaje.textContent = "Preparando PDF ligero...";

  try{
    const cv = $("cvPreview");
    const originalTransform = cv.style.transform;
    cv.style.transform = "scale(1)";
    await new Promise(resolve=>setTimeout(resolve,200));

    /* scale: 1 reduce mucho el peso del PDF */
    const canvas = await html2canvas(cv,{
      scale:1,
      useCORS:true,
      backgroundColor:"#ffffff",
      scrollX:0,
      scrollY:0,
      windowWidth:cv.scrollWidth,
      windowHeight:cv.scrollHeight
    });

    /* JPEG comprimido en vez de PNG pesado */
    const imgData = canvas.toDataURL("image/jpeg", 0.68);
    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
      orientation:"portrait",
      unit:"mm",
      format:"letter",
      compress:true
    });

    pdf.addImage(imgData,"JPEG",0,0,215.9,279.4,undefined,"FAST");

    const nombreArchivo = texto("nombre","curriculum")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/\s+/g,"-")
      .replace(/[^a-z0-9\-]/gi,"");

    pdf.save(`${nombreArchivo}-cv-carta-ligero.pdf`);
    cv.style.transform = originalTransform;
    mensaje.textContent = "PDF descargado correctamente. Archivo optimizado.";
  }catch(error){
    console.error(error);
    mensaje.textContent = "No se pudo generar el PDF. Prueba desde GitHub Pages o Live Server.";
  }finally{
    boton.disabled = false;
    boton.textContent = "Descargar PDF ligero";
  }
});

actualizarCV();
