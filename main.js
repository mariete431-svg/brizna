/* Brizna · comportamiento suave de la web (la página se ve entera sin esto) */
(function () {
  "use strict";
  var TEL = document.body.getAttribute("data-tel") || "";
  var calma = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var wa = function (msg) { return "https://wa.me/" + TEL + "?text=" + encodeURIComponent(msg); };

  /* Barra: se marca al hacer scroll */
  var nav = $("#nav");
  function onScroll() { if (nav) nav.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* Menú móvil: se cierra al elegir */
  var menu = $(".menu");
  if (menu) $$(".menu-panel a").forEach(function (a) { a.addEventListener("click", function () { menu.removeAttribute("open"); }); });

  /* Aparición suave */
  var rv = $$(".rv");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  /* Texto que se ilumina palabra a palabra */
  var decl = $("[data-palabras]");
  if (decl) {
    var palabras = decl.textContent.trim().split(/\s+/);
    decl.setAttribute("aria-label", decl.textContent.trim());
    decl.innerHTML = palabras.map(function (p) { return '<span class="w" aria-hidden="true">' + p + "</span>"; }).join(" ");
    var ws = $$(".w", decl), tick = false;
    var pinta = function () {
      tick = false;
      var r = decl.getBoundingClientRect(), vh = window.innerHeight;
      var p = calma ? 1 : (vh * 0.8 - r.top) / (r.height + vh * 0.25);
      p = Math.max(0, Math.min(1, p));
      var n = Math.round(p * ws.length);
      ws.forEach(function (w, i) { w.classList.toggle("on", i < n); });
    };
    window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(pinta); } }, { passive: true });
    window.addEventListener("resize", pinta); pinta();
  }

  /* Vídeos: solo suenan a la vista (mudos) y se paran fuera de pantalla */
  var vids = $$("video");
  var ahorro = navigator.connection && navigator.connection.saveData;
  function reproduce(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  if (calma || ahorro) { vids.forEach(function (v) { v.pause(); v.removeAttribute("autoplay"); }); }
  else if ("IntersectionObserver" in window) {
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { if (v.preload === "none") v.preload = "auto"; reproduce(v); } else v.pause();
      });
    }, { threshold: 0.45 });
    vids.forEach(function (v) { vo.observe(v); });
  } else vids.forEach(function (v) { if (v.hasAttribute("autoplay")) reproduce(v); });

  /* Galería del proceso: flechas */
  var gal = $("#galeria");
  if (gal) {
    var paso = function () { var p = $(".paso", gal); return p ? p.getBoundingClientRect().width + 18 : 300; };
    var pv = $("#gal-prev"), nx = $("#gal-next");
    if (pv) pv.addEventListener("click", function () { gal.scrollBy({ left: -paso(), behavior: calma ? "auto" : "smooth" }); });
    if (nx) nx.addEventListener("click", function () { gal.scrollBy({ left: paso(), behavior: calma ? "auto" : "smooth" }); });
  }

  /* Crea tu jabón */
  var fc = $("#form-crea");
  if (fc) {
    var val = function (n) { var e = fc.querySelector('input[name="' + n + '"]:checked'); return e ? e.value : ""; };
    var ingr = $$('input[name="ingr"]', fc);
    var lista = $("#res-lista"), nombre = $("#etq-nombre"), det = $("#etq-det"), bt = $("#crea-pedir");
    var baja = function (t) { return t.charAt(0).toLowerCase() + t.slice(1); };
    var pintaCrea = function () {
      var sel = ingr.filter(function (i) { return i.checked; }).map(function (i) { return i.value; });
      ingr.forEach(function (i) { i.disabled = !i.checked && sel.length >= 3; });
      var buscas = val("buscas"), aroma = val("aroma"), forma = val("forma");
      var cant = fc.elements.cant.value, nota = fc.elements.nota.value.trim();
      var titulo = sel.length ? "Jabón de " + sel.map(baja).join(", ").replace(/,([^,]*)$/, " y$1") : "Jabón " + baja(buscas);
      nombre.textContent = titulo;
      det.textContent = forma + " · " + (aroma === "Sin aroma" ? "sin aroma" : "aroma a " + baja(aroma));
      var filas = [["Busca", buscas], ["Ingredientes", sel.length ? sel.join(", ") : "A elegir con Adriana"], ["Aroma", aroma], ["Forma", forma], ["Cantidad", cant]];
      if (nota) filas.push(["Nota", nota]);
      lista.innerHTML = "";
      filas.forEach(function (f) {
        var li = document.createElement("li"), a = document.createElement("span"), b = document.createElement("span");
        a.textContent = f[0]; b.textContent = f[1]; li.appendChild(a); li.appendChild(b); lista.appendChild(li);
      });
      var msg = "Hola Adriana, me gustaría un jabón a mi gusto:\n- Busco: " + buscas + "\n- Ingredientes: " + (sel.length ? sel.join(", ") : "te lo dejo a ti") + "\n- Aroma: " + aroma + "\n- Forma: " + forma + "\n- Cantidad: " + cant + (nota ? "\n- Nota: " + nota : "") + "\n¿Es posible? ¿Cuánto costaría?";
      bt.href = wa(msg);
    };
    fc.addEventListener("input", pintaCrea); fc.addEventListener("change", pintaCrea);
    fc.addEventListener("submit", function (e) { e.preventDefault(); });
    pintaCrea();
  }

  /* Cita de asesoramiento */
  var fcita = $("#form-cita");
  if (fcita) {
    var d = new Date(); d.setDate(d.getDate() + 1);
    var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    fcita.elements.dia.min = iso; fcita.elements.dia.value = iso;
    fcita.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = fcita.elements, p = f.dia.value.split("-");
      var fecha = p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) : f.dia.value;
      var canal = fcita.querySelector('input[name="canal"]:checked').value, fr = fcita.querySelector('input[name="franja"]:checked').value;
      window.location.href = wa("Hola Adriana, soy " + f.nombre.value.trim() + ". Me gustaría pedir una cita de asesoramiento sobre: " + f.tema.value + ".\nMe viene bien el " + fecha + ", por la " + fr + ". Prefiero " + canal + ".\n¿Me confirmas el día y la hora?");
    });
  }

  /* Reseñas: se guardan y se leen en Supabase (sin pasar por WhatsApp) */
  var SB = "https://uaojfcqpdngoqpjrmttx.supabase.co", KEY = "sb_publishable_ZB2XOPmn8io8Dd92r2JzLw_QlrTTI5q";
  var cab = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  /* Contenido que Adriana gestiona desde su panel (productos, aviso, enlaces, feed) */
  function wapedir(n) { return wa("Hola Adriana, me gustaría pedir: " + n + ". ¿Está disponible?"); }
  function foto(f, pos, alt) { return f ? '<img src="' + esc(f) + '" alt="' + esc(alt) + '" loading="lazy" style="object-position:' + esc(pos || "50% 50%") + '">' : ""; }
  function boton(p, extra) { return p.disponible === false ? '<span class="agotado">Agotado</span>' : '<a class="pedir' + (extra || "") + '" aria-label="Pedir ' + esc(p.nombre) + '" href="' + wapedir(p.nombre) + '">Pedir</a>'; }
  function precio(p) { return p.precio ? '<span class="precio">' + esc(p.precio) + ' €</span>' : ""; }
  function tarjeta(p) { return '<article class="prod in"><div class="prod-foto">' + foto(p.foto, p.posicion, p.nombre) + '</div><h4>' + esc(p.nombre) + '</h4><p class="det">' + esc(p.detalle) + '</p><div class="prod-pie">' + precio(p) + boton(p) + '</div></article>'; }
  function destacado(p) {
    var f2 = p.foto2 ? '<div class="dest-foto dest-foto2">' + foto(p.foto2, "50% 50%", p.nombre + " (etiqueta)") + '</div>' : "";
    return '<article class="dest in' + (p.foto2 ? " dest-doble" : "") + '"><div class="dest-fotos"><div class="dest-foto">' + foto(p.foto, p.posicion, p.nombre) + '</div>' + f2 + '</div><div class="dest-txt"><span class="nueva">Novedad</span><h3>' + esc(p.nombre) + '</h3><p>' + esc(p.detalle) + '</p><div class="dest-pie">' + precio(p) + boton(p, " pedir-grande") + '</div></div></article>';
  }
  var IDS = { "Jabones": "jabones", "Bálsamos": "balsamos", "Sales de baño": "sales" };
  function idDe(t) { return IDS[t] || "t-" + t.toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
  function pintarProductos(lista) {
    if (!lista || !lista.length) return;
    var nov = lista.filter(function (p) { return p.novedad; }), resto = lista.filter(function (p) { return !p.novedad; });
    var nb = $("#novedades"); if (nb) nb.innerHTML = nov.map(destacado).join("");
    var orden = ["Jabones", "Bálsamos", "Sales de baño"], g = {};
    resto.forEach(function (p) { (g[p.tipo] = g[p.tipo] || []).push(p); if (orden.indexOf(p.tipo) < 0) orden.push(p.tipo); });
    var cat = $(".catalogo");
    if (cat) cat.innerHTML = orden.filter(function (k) { return g[k]; }).map(function (k) {
      return '<h3 class="tipo" id="' + idDe(k) + '">' + esc(k) + '</h3><section class="productos" aria-label="' + esc(k) + '">' + g[k].map(tarjeta).join("") + '</section>';
    }).join("");
    var chips = $(".chips");
    if (chips) chips.innerHTML = (nov.length ? '<a href="#novedades">Novedades</a>' : "") + orden.filter(function (k) { return g[k]; }).map(function (k) { return '<a href="#' + idDe(k) + '">' + esc(k) + '</a>'; }).join("");
    var sel = $('#form-resena select[name="producto"]');
    if (sel) sel.innerHTML = "<option>Varios productos</option>" + lista.map(function (p) { return "<option>" + esc(p.nombre) + "</option>"; }).join("");
  }
  function pintarAjustes(a) {
    if (!a) return;
    var av = $("#aviso");
    if (av && a.aviso_activo && a.aviso_texto) { av.textContent = a.aviso_texto; av.hidden = false; }
    var gv = $("#google-vivo");
    if (gv && !$(".google") && (a.google_resena || a.google_perfil)) {
      gv.innerHTML = '<div class="google"><div><b>También en Google</b><p>Si ya nos conoces, ayúdanos con una reseña. Así nos encuentra más gente.</p></div><div class="google-btn">' + (a.google_resena ? '<a class="ver" href="' + esc(a.google_resena) + '" rel="noopener" target="_blank">Escribir reseña en Google</a>' : "") + (a.google_perfil ? '<a class="ver2" href="' + esc(a.google_perfil) + '" rel="noopener" target="_blank">Ver la ficha de Brizna</a>' : "") + '</div></div>';
    }
    var fw = $(".feed-wrap");
    if (fw && a.instagram) { window.__ig = a.instagram; if (!$(".feed-link", fw)) fw.insertAdjacentHTML("beforeend", '<p class="feed-link"><a class="ver2 oscuro" href="' + esc(a.instagram) + '" rel="noopener" target="_blank">Seguir en Instagram</a></p>'); }
  }
  function pintarFeed(lista) {
    var fw = $(".feed-wrap"); if (!fw || !lista || !lista.length) return;
    var ig = window.__ig;
    fw.innerHTML = '<div class="feed">' + lista.slice(0, 6).map(function (p) {
      var cuerpo = '<img src="' + esc(p.foto) + '" alt="' + esc(p.texto || "Publicación de Brizna") + '" loading="lazy" width="540" height="540">' + (p.texto ? '<span class="feed-txt">' + esc(p.texto) + '</span>' : "");
      return p.enlace ? '<a class="feed-item in" href="' + esc(p.enlace) + '" rel="noopener" target="_blank">' + cuerpo + '</a>' : '<div class="feed-item in">' + cuerpo + '</div>';
    }).join("") + '</div>' + (ig ? '<p class="feed-link"><a class="ver2 oscuro" href="' + esc(ig) + '" rel="noopener" target="_blank">Seguir en Instagram</a></p>' : "");
  }
  function leer(tabla, q) { return fetch(SB + "/rest/v1/" + tabla + "?" + q, { headers: cab }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  if (window.fetch) {
    leer("brizna_ajustes", "select=*&id=eq.1").then(function (r) { pintarAjustes(r && r[0]); }).then(function () { return leer("brizna_feed", "select=*&order=orden.asc,creado.desc&limit=6"); }).then(pintarFeed);
    leer("brizna_productos", "select=*&order=orden.asc,creado.asc").then(pintarProductos);
  }
  function pintar(lista) {
    var box = $("#res-vivas"); if (!box || !lista.length) return;
    box.innerHTML = lista.map(function (r) {
      var n = Math.max(1, Math.min(5, r.estrellas | 0));
      return '<figure class="resena"><div class="estrellas" aria-label="' + n + ' de 5 estrellas">' + new Array(n + 1).join("★") + new Array(6 - n).join("☆") + '</div><blockquote>' + esc(r.texto) + '</blockquote><figcaption><b>' + esc(r.nombre) + '</b>' + (r.producto && r.producto !== "Varios productos" ? " · " + esc(r.producto) : "") + '</figcaption></figure>';
    }).join("");
    box.hidden = false;
    var v = document.querySelector("#resenas .vacio"); if (v) v.hidden = true;
  }
  function cargar() {
    if (!window.fetch) return;
    fetch(SB + "/rest/v1/brizna_resenas?select=nombre,producto,estrellas,texto&order=creada.desc&limit=30", { headers: cab })
      .then(function (r) { return r.ok ? r.json() : []; }).then(pintar).catch(function () {});
  }
  cargar();
  var fres = $("#form-resena");
  if (fres) {
    var msg = $("#res-msg"), btn = fres.querySelector('button[type="submit"]');
    var textos = {
      publicada: "¡Gracias! Tu reseña ya está en la web.",
      guardada: "¡Gracias por contárnoslo! Adriana lo tendrá muy en cuenta.",
      enlaces: "Por favor, quita los enlaces o números largos de tu reseña.",
      lenguaje: "Por favor, escribe tu opinión sin palabras ofensivas.",
      largo: "Tu opinión debe tener entre 15 y 400 letras.",
      repetido: "Esa reseña ya está enviada o tiene letras repetidas.",
      limite: "Has enviado ya varias reseñas hoy. Inténtalo mañana.",
      nombre: "Pon tu nombre (entre 2 y 40 letras).",
      datos: "Revisa los datos e inténtalo otra vez."
    };
    fres.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = fres.elements, n = parseInt(fres.querySelector('input[name="estrellas"]:checked').value, 10);
      btn.disabled = true; msg.textContent = "Enviando…";
      fetch(SB + "/rest/v1/rpc/enviar_resena_brizna", {
        method: "POST", headers: cab,
        body: JSON.stringify({ p_nombre: f.nombre.value, p_producto: f.producto.value, p_estrellas: n, p_texto: f.texto.value, p_web: f.web.value })
      }).then(function (r) { return r.ok ? r.json() : "error"; }).then(function (res) {
        if (res === "ok" || res === "publicada" || res === "guardada") {
          msg.textContent = textos[res === "ok" ? "guardada" : res];
          fres.reset(); if (res === "publicada") { cargar(); }
        } else { msg.textContent = textos[res] || "No se ha podido enviar. Inténtalo en un rato."; }
        setTimeout(function () { btn.disabled = false; }, 3000);
      }).catch(function () { msg.textContent = "No se ha podido enviar. Inténtalo en un rato."; btn.disabled = false; });
    });
  }
})();
