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
    if (window.__marcarPedir) window.__marcarPedir();
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


  /* Cestas: fotos que se deslizan (puntos y flechas) */
  $$(".carru").forEach(function (c) {
    var pista = $(".carru-pista", c), puntos = $$(".puntos i", c), aviso = $(".desliza", c);
    if (!pista || !puntos.length) return;
    var ir = function (d) { pista.scrollBy({ left: d * pista.clientWidth, behavior: calma ? "auto" : "smooth" }); };
    var at = $(".atras", c), al = $(".alante", c);
    if (at) at.addEventListener("click", function () { ir(-1); });
    if (al) al.addEventListener("click", function () { ir(1); });
    pista.addEventListener("scroll", function () {
      var n = Math.round(pista.scrollLeft / pista.clientWidth);
      puntos.forEach(function (p, i) { p.classList.toggle("on", i === n); });
      if (aviso && n > 0) aviso.hidden = true;
    }, { passive: true });
  });

  /* Copos de nieve en Navidad (decoración: no tapan ni bloquean nada) */
  if (document.body.getAttribute("data-navidad") === "si" && !calma) {
    var nieve = document.createElement("div"); nieve.className = "nieve"; nieve.setAttribute("aria-hidden", "true");
    var cuantos = window.innerWidth < 640 ? 24 : 42, copos = "";
    for (var c = 0; c < cuantos; c++) {
      var tam = (3 + Math.random() * 4.5).toFixed(1), dur = (10 + Math.random() * 12).toFixed(1);
      copos += '<span class="copo" style="left:' + (Math.random() * 100).toFixed(1) + '%;width:' + tam + 'px;height:' + tam + 'px;--t:' + dur + 's;--d:-' + (Math.random() * dur).toFixed(1) + 's;--x:' + Math.round(Math.random() * 70 - 35) + 'px;opacity:' + (0.75 + Math.random() * 0.25).toFixed(2) + '"></span>';
    }
    nieve.innerHTML = copos; document.body.appendChild(nieve);

    /* Trineo de Papá Noel: cruza la pantalla a medida que bajas */
    var trineo = document.createElement("div");
    trineo.className = "trineo"; trineo.setAttribute("aria-hidden", "true");
    var reno = function (x) {
      return '<g transform="translate(' + x + ',0)"><g class="pata-a"><path d="M10 46 L2 58 M14 46 L8 60"/></g><g class="pata-b"><path d="M30 46 L40 57 M34 45 L44 54"/></g>' +
        '<ellipse cx="22" cy="42" rx="16" ry="7" fill="#B98B62"/><path d="M33 38 Q40 30 42 24 L48 25 Q44 34 37 44 Z" fill="#B98B62"/>' +
        '<ellipse cx="47" cy="23" rx="7" ry="4.5" fill="#B98B62"/><circle cx="54" cy="23" r="2" fill="#E2483D"/><circle cx="46" cy="21.5" r="1" fill="#241E3B"/>' +
        '<path d="M43 19 Q40 10 44 5 M42 13 L37 9 M47 19 Q48 11 54 8 M49 13 L53 14" stroke="#E8D3B0" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>';
    };
    trineo.innerHTML = '<svg viewBox="0 0 300 80" xmlns="http://www.w3.org/2000/svg">' +
      '<g class="estela"><circle cx="-8" cy="62" r="2.2"/><circle cx="-24" cy="56" r="1.6"/><circle cx="-40" cy="64" r="1.2"/><circle cx="-56" cy="58" r="1"/></g>' +
      '<path d="M100 44 Q150 30 168 36 M100 44 Q200 26 248 36" stroke="#E8C66A" stroke-width="1.4" fill="none"/>' +
      '<g stroke="#B98B62" stroke-width="3" stroke-linecap="round" fill="none">' + reno(130) + reno(210) + '</g>' +
      '<circle cx="24" cy="36" r="10" fill="#9C6B43"/>' +
      '<circle cx="46" cy="38" r="11" fill="#E0503F"/><circle cx="48" cy="24" r="6.5" fill="#F2D3B8"/><path d="M42 26 Q48 36 54 26 Z" fill="#fff"/>' +
      '<path d="M41 22 L55 21 L60 12 Z" fill="#E0503F"/><circle cx="61" cy="11" r="2.6" fill="#fff"/><rect x="40" y="20" width="16" height="3" rx="1.5" fill="#fff"/>' +
      '<path d="M8 62 Q4 40 20 40 L30 42 Q34 54 50 54 L84 54 Q92 54 94 44 L100 42 Q100 64 84 64 Z" fill="#C8433A"/>' +
      '<path d="M2 70 H90 Q102 70 104 60" stroke="#E8C66A" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M22 64 V70 M74 64 V70" stroke="#E8C66A" stroke-width="2.5"/>' +
      '</svg>';
    document.body.appendChild(trineo);
    /* Baja solo, despacio y en zigzag, como paseando por una ladera.
       Al hacer scroll solo coge un poquito de velocidad, sin tirones. */
    var TRAMOS = 5, SEG_TRAMO = 16;                        /* 5 cruces de lado a lado, 16 s cada uno */
    var pos = 0, impulso = 0, giro = 1, antes = 0, ultimoY = window.scrollY;
    window.addEventListener("scroll", function () {
      var d = Math.abs(window.scrollY - ultimoY); ultimoY = window.scrollY;
      impulso = Math.min(0.12, impulso + d / (window.innerHeight * 40));
    }, { passive: true });
    var paso = function (ahora) {
      var dt = antes ? Math.min(0.1, (ahora - antes) / 1000) : 0; antes = ahora;
      impulso *= Math.pow(0.4, dt);                         /* el empujón se va apagando suave */
      pos += (1 / SEG_TRAMO + impulso) * dt;
      if (pos >= TRAMOS) pos -= TRAMOS;                     /* al llegar abajo vuelve a empezar arriba */
      var vw = window.innerWidth, vh = window.innerHeight, ancho = trineo.offsetWidth || 200, alto = trineo.offsetHeight || 70;
      var n = Math.floor(pos), t = pos - n, suave = t * t * (3 - 2 * t);
      var izq = 8, der = vw - ancho - 8, alaDerecha = n % 2 === 0;
      var arriba = vh * 0.1, abajo = vh * 0.62 - alto, tramoAlto = (abajo - arriba) / TRAMOS;
      var x = alaDerecha ? izq + suave * (der - izq) : der - suave * (der - izq);
      var y = arriba + (n + suave) * tramoAlto + Math.sin(ahora / 700) * 3;
      giro += ((alaDerecha ? 1 : -1) - giro) * Math.min(1, dt * 3);
      var r = (alaDerecha ? 1 : -1) * 3 * Math.sin(Math.PI * t);   /* se inclina un poco a mitad de cada cruce */
      var visible = pos < 0.15 ? pos / 0.15 : pos > TRAMOS - 0.15 ? (TRAMOS - pos) / 0.15 : 1;
      trineo.style.opacity = visible.toFixed(2);
      trineo.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0) rotate(" + r.toFixed(2) + "deg) scaleX(" + giro.toFixed(3) + ")";
      requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  /* Carrito: se añaden varios productos y se manda todo junto por WhatsApp */
  var CLAVE = "brizna-pedido", carro = [];
  try { carro = JSON.parse(localStorage.getItem(CLAVE) || "[]") || []; } catch (e) { carro = []; }
  var guardar = function () { try { localStorage.setItem(CLAVE, JSON.stringify(carro)); } catch (e) {} };
  var euros = function (n) { return n.toFixed(2).replace(".", ",") + " €"; };
  var bolsa = document.createElement("button");
  bolsa.type = "button"; bolsa.className = "bolsa"; bolsa.hidden = true;
  bolsa.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg><span>Mi pedido</span><span class="num">0</span>';
  var fondo = document.createElement("div");
  fondo.className = "carro-fondo"; fondo.hidden = true;
  fondo.innerHTML = '<div class="carro" role="dialog" aria-modal="true" aria-labelledby="carro-t"><div class="carro-cab"><h2 id="carro-t">Mi pedido</h2><button type="button" class="carro-x" aria-label="Cerrar">×</button></div><ul class="carro-lista"></ul><div class="carro-pie"><div class="carro-total"><span>Total aproximado</span><span class="carro-suma"></span></div><p class="carro-nota"></p><a class="ver ancho carro-enviar" href="#">Enviar pedido a Adriana</a><button type="button" class="carro-vaciar">Vaciar pedido</button></div></div>';
  document.body.appendChild(bolsa); document.body.appendChild(fondo);
  var clista = $(".carro-lista", fondo), suma = $(".carro-suma", fondo), cnota = $(".carro-nota", fondo), enviar = $(".carro-enviar", fondo);

  function mensaje() {
    var total = 0, consultar = false;
    var lineas = carro.map(function (it) {
      if (it.p == null) consultar = true; else total += it.p * it.q;
      return "- " + it.q + " x " + it.n + (it.p == null ? " (precio a consultar)" : " (" + euros(it.p) + ")");
    });
    return "Hola Adriana, me gustaría hacer este pedido:\n" + lineas.join("\n") + (total ? "\nTotal aproximado: " + euros(total) + (consultar ? " + lo que cuesten las cestas" : "") : "") + "\n¿Está todo disponible?";
  }
  function pintaCarro() {
    var n = 0, total = 0, consultar = false;
    carro.forEach(function (it) { n += it.q; if (it.p == null) consultar = true; else total += it.p * it.q; });
    bolsa.hidden = n === 0; $(".num", bolsa).textContent = n;
    bolsa.setAttribute("aria-label", "Ver mi pedido: " + n + (n === 1 ? " producto" : " productos"));
    clista.innerHTML = carro.length ? carro.map(function (it, i) {
      return '<li><span class="n">' + esc(it.n) + '</span><span class="p">' + (it.p == null ? "Precio a consultar" : euros(it.p) + " / ud.") + '</span><span class="cant"><button type="button" data-menos="' + i + '" aria-label="Quitar uno de ' + esc(it.n) + '">−</button><span>' + it.q + '</span><button type="button" data-mas="' + i + '" aria-label="Añadir otro de ' + esc(it.n) + '">+</button></span></li>';
    }).join("") : '<li class="carro-vacio">Tu pedido está vacío.</li>';
    suma.textContent = euros(total);
    cnota.textContent = (consultar ? "Las cestas tienen precio a consultar. " : "") + "Adriana te confirma el total y la entrega por WhatsApp.";
    enviar.href = carro.length ? wa(mensaje()) : "#";
  }
  function abrir() { fondo.hidden = false; document.body.classList.add("carro-abierto"); $(".carro-x", fondo).focus(); }
  function cerrar() { fondo.hidden = true; document.body.classList.remove("carro-abierto"); if (!bolsa.hidden) bolsa.focus(); }
  bolsa.addEventListener("click", abrir);
  fondo.addEventListener("click", function (e) {
    var t = e.target;
    if (t === fondo || t.closest(".carro-x")) return cerrar();
    if (t.hasAttribute("data-mas")) { carro[+t.getAttribute("data-mas")].q++; }
    else if (t.hasAttribute("data-menos")) { var i = +t.getAttribute("data-menos"); if (--carro[i].q < 1) carro.splice(i, 1); }
    else if (t.closest(".carro-vaciar")) { carro = []; }
    else return;
    guardar(); pintaCarro();
    if (!carro.length) cerrar();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !fondo.hidden) cerrar(); });

  /* Los botones «Pedir» pasan a ser «Añadir» */
  window.__marcarPedir = function () {
    $$("a.pedir").forEach(function (b) {
      if (b.dataset.carro) return;
      var art = b.closest("article"), h = art && art.querySelector("h3, h4");
      b.dataset.carro = "1"; b.textContent = "Añadir";
      if (h) b.setAttribute("aria-label", "Añadir " + h.textContent.trim() + " a mi pedido");
    });
  };
  window.__marcarPedir();
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("a.pedir");
    if (!b) return;
    var art = b.closest("article"), h = art && art.querySelector("h3, h4");
    if (!h) return;
    e.preventDefault();
    var nombre = h.textContent.trim(), pe = art.querySelector(".precio:not(.consultar)");
    var precio = pe ? parseFloat(pe.textContent.replace(/[^\d,.]/g, "").replace(",", ".")) : null;
    if (isNaN(precio)) precio = null;
    var it = carro.filter(function (x) { return x.n === nombre; })[0];
    if (it) it.q++; else carro.push({ n: nombre, p: precio, q: 1 });
    guardar(); pintaCarro();
    b.classList.add("hecho"); b.textContent = "Añadido";
    setTimeout(function () { b.classList.remove("hecho"); b.textContent = "Añadir"; }, 1400);
    bolsa.classList.remove("salta"); void bolsa.offsetWidth; bolsa.classList.add("salta");
  });
  pintaCarro();
})();
