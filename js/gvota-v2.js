/**
 * Micrositio «Guerrero en el extranjero» — comportamiento de la página única.
 * Sin dependencias además de Bootstrap 5 (bootstrap.bundle).
 */
(function () {
    'use strict';

    var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
    var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Animaciones de entrada (mismo efecto que el portal del IEPC: AOS) ----------
     * La página se «va construyendo» al entrar y al desplazarse. Los atributos se agregan aquí y no
     * en el HTML: si el JavaScript no carga, el contenido se muestra normal (nunca queda oculto).
     * Se omite si la persona tiene activado «reducir movimiento» en su sistema.
     */
    if (window.AOS && !reduceMotion) {
        var animar = function (selector, efecto, escalonado, retrasoBase) {
            $$(selector).forEach(function (el) {
                if (el.closest('.modal') || el.hasAttribute('data-aos')) return;
                var retraso = retrasoBase || 0;
                if (escalonado) {
                    // Retraso según su posición entre hermanos del mismo tipo (máx. 400 ms, como el portal)
                    var hermanos = el.parentElement ? $$(':scope > ' + el.tagName, el.parentElement) : [el];
                    retraso += Math.min(hermanos.indexOf(el) * 100, 400);
                }
                el.setAttribute('data-aos', efecto);
                if (retraso) el.setAttribute('data-aos-delay', String(retraso));
            });
        };

        // Inicio
        animar('.gv-banner > .gv-pendiente, .gv-banner > img', 'fade');
        animar('.gv-banner-cta', 'zoom-in', false, 300);
        animar('.gv-registro-lema, .gv-registro-proceso', 'fade-up');
        animar('.gv-registro-caja', 'zoom-in', false, 200);
        animar('.gv-ruta-titulo', 'fade-up');
        animar('.gv-paso', 'zoom-in', true, 100);
        animar('.gv-catzin-voto', 'fade-left', false, 300);
        animar('.gv-btn-cta-doble', 'zoom-in', false, 400);
        // Títulos y elementos comunes
        animar('.gv-titulo, .gv-subtitulo', 'fade-down');
        animar('.gv-cintillo', 'fade-up');
        animar('.gv-burbuja', 'zoom-in', false, 100);
        // ¿Cómo puedo votar?
        animar('.gv-infografia', 'fade-right');
        animar('.gv-video', 'fade-left');
        animar('.gv-catzin-duda .gv-pendiente', 'zoom-in', false, 200);
        animar('.gv-opcion', 'fade-up', false, 100);
        animar('.gv-bloque-paso', 'fade-up');
        animar('.gv-fechas', 'fade-left', false, 200);
        // Punto de encuentro
        animar('.gv-catzin-intro > .gv-pendiente, .gv-catzin-intro > img', 'zoom-in');
        animar('.gv-evento-proximo', 'fade-left', false, 100);
        animar('.gv-evento', 'zoom-in', true);
        // Preguntas frecuentes
        animar('.gv-faq .accordion-item', 'fade-up', true);
        animar('.gv-contacto', 'fade-right', false, 200);
        // Más información
        animar('.gv-panel', 'fade-up');
        animar('.gv-carpeta', 'zoom-in', true, 100);
        animar('.gv-lista-redes > li, .gv-sitios > li', 'fade-up', true);

        var iniciarAnimaciones = function () {
            AOS.init({ duration: 600, easing: 'ease-in-out', once: true, mirror: false, offset: 40 });
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarAnimaciones);
        else iniciarAnimaciones();
        // Recalcula posiciones cuando terminan de cargar imágenes y fuentes
        window.addEventListener('load', function () { AOS.refresh(); });
    }

    /* ---------- Encabezado, menú móvil y botón «subir» ---------- */
    var header = $('.gv-header');
    var subir = $('.gv-subir');
    function alDesplazar() {
        var y = window.scrollY;
        if (header) header.classList.toggle('con-sombra', y > 10);
        if (subir) subir.classList.toggle('visible', y > 600);
    }
    window.addEventListener('scroll', alDesplazar, { passive: true });
    alDesplazar();

    var colapsable = $('#gv-menu-colapsable');
    $$('#gv-menu .nav-link').forEach(function (a) {
        a.addEventListener('click', function () {
            if (colapsable && colapsable.classList.contains('show')) {
                bootstrap.Collapse.getOrCreateInstance(colapsable).hide();
            }
        });
    });

    /* ---------- Aviso para lectores de pantalla en enlaces que abren otra pestaña ---------- */
    var avisoVentana = document.body.getAttribute('data-nueva-ventana');
    if (avisoVentana) {
        $$('a[target="_blank"]').forEach(function (a) {
            if (a.querySelector('.visually-hidden')) return;
            var s = document.createElement('span');
            s.className = 'visually-hidden';
            s.textContent = ' ' + avisoVentana;
            a.appendChild(s);
        });
    }

    /* ---------- Galería de videos: carga diferida y video seleccionado ampliado ---------- */
    $$('[data-gv-videos-diferidos]').forEach(function (cont) {
        var modal = cont.closest('.modal');
        if (!modal) return;
        var figuras = $$('figure', cont);

        // Guarda el reproductor original de cada video para poder restablecerlo (y detenerlo).
        figuras.forEach(function (fig) {
            var t = $('template', fig);
            if (t) fig.setAttribute('data-gv-reproductor', t.innerHTML);
        });

        var restablecer = function (fig) {
            fig.classList.remove('gv-video-activo');
            var actual = $('lite-youtube', fig) || $('template', fig);
            if (actual && $('iframe', fig)) { // solo si se estaba reproduciendo
                var tmp = document.createElement('div');
                tmp.innerHTML = fig.getAttribute('data-gv-reproductor');
                actual.replaceWith(tmp.firstElementChild);
            }
        };

        modal.addEventListener('show.bs.modal', function () {
            $$('template', cont).forEach(function (t) { t.replaceWith(t.content.cloneNode(true)); });
        }, { once: true });

        // Al elegir un video, se amplía al ancho completo; el que estaba ampliado se detiene y regresa a su tamaño.
        cont.addEventListener('click', function (e) {
            var fig = e.target.closest('figure');
            if (!fig || fig.classList.contains('gv-video-activo')) return;
            figuras.forEach(function (otra) { if (otra !== fig) restablecer(otra); });
            fig.classList.add('gv-video-activo');
            requestAnimationFrame(function () {
                fig.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
            });
        });

        // Al cerrar el modal se detiene cualquier video y la galería vuelve a su estado inicial.
        modal.addEventListener('hidden.bs.modal', function () { figuras.forEach(restablecer); });
    });

    /* ---------- Desplazarse a un elemento y resaltarlo ---------- */
    function irA(el) {
        el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        el.classList.remove('gv-resaltado');
        void el.offsetWidth; // reinicia la animación
        el.classList.add('gv-resaltado');
        var foco = el.matches('a, button') ? el : el.querySelector('a, button');
        if (foco) setTimeout(function () { foco.focus({ preventScroll: true }); }, reduceMotion ? 0 : 500);
    }

    /* ---------- Visor de imágenes (infografías, boletines) ---------- */
    var visor = $('#gv-visor');
    var modalPadre = null;
    document.addEventListener('click', function (e) {
        var disparador = e.target.closest('[data-gv-imagen]');
        if (!disparador || !visor) return;
        $('#gv-visor-img').src = disparador.getAttribute('data-gv-imagen');
        $('#gv-visor-img').alt = disparador.getAttribute('data-gv-titulo') || '';
        $('#gv-visor-t').textContent = disparador.getAttribute('data-gv-titulo') || '';

        var padre = disparador.closest('.modal');
        if (padre) {
            // Bootstrap no apila modales: se oculta el modal de origen y se restaura al cerrar el visor.
            modalPadre = padre;
            padre.addEventListener('hidden.bs.modal', function abrirVisor() {
                padre.removeEventListener('hidden.bs.modal', abrirVisor);
                bootstrap.Modal.getOrCreateInstance(visor).show();
            });
            bootstrap.Modal.getInstance(padre).hide();
        } else {
            modalPadre = null;
            bootstrap.Modal.getOrCreateInstance(visor).show();
        }
    });
    if (visor) {
        visor.addEventListener('hidden.bs.modal', function () {
            if (modalPadre) bootstrap.Modal.getOrCreateInstance(modalPadre).show();
            modalPadre = null;
        });
    }

    /* ---------- Buscador interno (RT-07) ---------- */
    var normalizar = function (t) {
        return (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
    };
    var indice = $$('[data-buscable]').map(function (el) {
        var texto = (el.textContent || '').split(avisoVentana || '\u0000').join('').replace(/\s+/g, ' ').trim();
        var tituloEl = el.querySelector('h3, h4, .accordion-button, strong, a');
        var seccion = el.closest('section') || (el.closest('.modal') && document.querySelector('[data-bs-target="#' + el.closest('.modal').id + '"]'));
        var nombreSeccion = '';
        if (seccion && seccion.tagName === 'SECTION') {
            var h2 = seccion.querySelector('h2');
            nombreSeccion = h2 ? h2.textContent.trim() : '';
        } else if (el.closest('.modal')) {
            var t = el.closest('.modal').querySelector('.modal-title');
            nombreSeccion = t ? t.textContent.trim() : '';
        }
        return {
            el: el,
            texto: texto,
            norm: normalizar(texto),
            titulo: (tituloEl ? tituloEl.textContent : texto).split(avisoVentana || '\u0000').join('').replace(/\s+/g, ' ').trim().slice(0, 140),
            seccion: nombreSeccion
        };
    });

    var input = $('#gv-buscar-input');
    var lista = $('#gv-buscar-resultados');
    var estado = $('#gv-buscar-estado');
    var buscador = $('#gv-buscador');

    function fragmento(item, termino) {
        var pos = item.norm.indexOf(termino);
        if (pos < 0) return item.texto.slice(0, 160);
        var ini = Math.max(0, pos - 60);
        return (ini > 0 ? '…' : '') + item.texto.slice(ini, ini + 180) + '…';
    }

    function buscar() {
        var consulta = normalizar(input.value);
        lista.innerHTML = '';
        if (consulta.length < 2) { estado.textContent = ''; return; }
        var terminos = consulta.split(' ');
        var resultados = indice.filter(function (it) {
            return terminos.every(function (t) { return it.norm.indexOf(t) !== -1; });
        }).slice(0, 25);

        estado.textContent = resultados.length
            ? resultados.length + ' ' + estado.getAttribute('data-resultados')
            : estado.getAttribute('data-sin-resultados');

        resultados.forEach(function (it) {
            var li = document.createElement('li');
            var btn = document.createElement('button');
            btn.type = 'button';
            var sec = document.createElement('span'); sec.className = 'gv-res-seccion'; sec.textContent = it.seccion;
            var tit = document.createElement('strong'); tit.textContent = it.titulo;
            var fr = document.createElement('span'); fr.className = 'gv-res-texto'; fr.textContent = fragmento(it, terminos[0]);
            btn.append(sec, tit, fr);
            btn.addEventListener('click', function () { abrirResultado(it.el); });
            li.appendChild(btn);
            lista.appendChild(li);
        });
    }

    function abrirResultado(el) {
        buscador.addEventListener('hidden.bs.modal', function mostrar() {
            buscador.removeEventListener('hidden.bs.modal', mostrar);
            var modal = el.closest('.modal');
            if (modal) {
                bootstrap.Modal.getOrCreateInstance(modal).show();
                return;
            }
            var colapso = el.querySelector('.accordion-collapse');
            if (colapso) bootstrap.Collapse.getOrCreateInstance(colapso, { toggle: false }).show();
            irA(el);
        });
        bootstrap.Modal.getInstance(buscador).hide();
    }

    if (input) {
        var espera;
        input.addEventListener('input', function () { clearTimeout(espera); espera = setTimeout(buscar, 150); });
        buscador.addEventListener('shown.bs.modal', function () { input.focus(); input.select(); });
    }

    /* ---------- Chat con Catzín ---------- */
    var chat = $('.gv-chat');
    if (chat) {
        var ventana = $('#gv-chat-ventana');
        var mensajes = $('#gv-chat-mensajes');
        var form = $('#gv-chat-form');
        var campo = $('#gv-chat-input');
        var ocupado = false;
        var origen = null; // elemento que abrió el chat, para devolverle el foco al cerrar

        var abrirChat = function (abrir) {
            ventana.hidden = !abrir;
            chat.classList.toggle('abierto', abrir);
            $$('[data-gv-abrir-chat]').forEach(function (b) { b.setAttribute('aria-expanded', String(abrir)); });
            if (abrir) campo.focus(); else if (origen) origen.focus();
        };
        $$('[data-gv-abrir-chat]').forEach(function (b) {
            b.setAttribute('aria-controls', 'gv-chat-ventana');
            b.setAttribute('aria-expanded', 'false');
            b.addEventListener('click', function () { origen = b; abrirChat(ventana.hidden); });
        });
        $('[data-gv-cerrar-chat]', chat).addEventListener('click', function () { abrirChat(false); });
        ventana.addEventListener('keydown', function (e) { if (e.key === 'Escape') abrirChat(false); });

        var agregar = function (clase, contenidoHtmlSeguro, textoPlano) {
            var div = document.createElement('div');
            div.className = 'gv-msg ' + clase;
            if (textoPlano !== undefined) div.textContent = textoPlano;
            else div.innerHTML = contenidoHtmlSeguro; // el servidor ya escapa la respuesta del bot
            mensajes.appendChild(div);
            mensajes.scrollTop = mensajes.scrollHeight;
            return div;
        };

        var agregarOpciones = function (opciones) {
            if (!Array.isArray(opciones) || !opciones.length) return;
            var cont = document.createElement('div');
            cont.className = 'gv-msg-opciones';
            opciones.forEach(function (o) {
                if (o.tipo === 'link' && /^https:\/\//.test(o.url || '')) {
                    var a = document.createElement('a');
                    a.href = o.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
                    a.textContent = o.texto;
                    cont.appendChild(a);
                } else if (o.tipo === 'accion') {
                    var b = document.createElement('button');
                    b.type = 'button'; b.textContent = o.texto;
                    b.addEventListener('click', function () { campo.focus(); });
                    cont.appendChild(b);
                }
            });
            mensajes.appendChild(cont);
            mensajes.scrollTop = mensajes.scrollHeight;
        };

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var texto = campo.value.trim();
            if (!texto || ocupado) return;
            ocupado = true;
            agregar('gv-msg-usuario', null, texto);
            campo.value = '';
            var escribiendo = agregar('gv-msg-bot gv-msg-escribiendo', null, chat.getAttribute('data-escribiendo'));

            fetch(chat.getAttribute('data-url'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ mensaje: texto, idioma: chat.getAttribute('data-idioma') })
            })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    escribiendo.remove();
                    if (data && data.respuesta) {
                        agregar('gv-msg-bot', data.respuesta);
                        agregarOpciones(data.opciones);
                    } else {
                        agregar('gv-msg-bot', null, chat.getAttribute('data-error'));
                    }
                })
                .catch(function () {
                    escribiendo.remove();
                    agregar('gv-msg-bot', null, chat.getAttribute('data-error'));
                    campo.value = texto;
                })
                .finally(function () { ocupado = false; });
        });
    }
})();
