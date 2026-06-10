/* JECA Jewelry — panier partagé (localStorage). Aucune dépendance. */
(function () {
  var KEY = 'jeca_cart', SHIPKEY = 'jeca_ship';

  // Transporteurs pertinents pour un bijou (petit colis de valeur)
  var CARRIERS = {
    colissimo: { label: 'Colissimo Domicile', note: 'Suivi + remise contre signature + assurance · 2–3 j', price: 5.90, freeFrom: 79 },
    relais:    { label: 'Mondial Relay (point relais)', note: 'Économique et discret · 3–5 j', price: 3.90, freeFrom: null },
    chrono:    { label: 'Chronopost Express 24 h', note: 'Livraison le lendemain · suivi détaillé', price: 12.90, freeFrom: null }
  };
  var DEFAULT_SHIP = 'colissimo';

  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function write(c) { localStorage.setItem(KEY, JSON.stringify(c)); paintCount(); }
  function getShip() { return localStorage.getItem(SHIPKEY) || DEFAULT_SHIP; }
  function setShip(v) { localStorage.setItem(SHIPKEY, v); }
  function count() { return read().reduce(function (n, i) { return n + (i.qty || 1); }, 0); }
  function euro(n) { return n.toFixed(2).replace('.', ',') + ' €'; }
  function keyOf(i) { return i.name + '|' + (i.finition || '') + '|' + (i.plan || ''); }

  function add(item) {
    var c = read(), ex = c.find(function (i) { return keyOf(i) === keyOf(item); });
    if (ex) ex.qty = (ex.qty || 1) + (item.qty || 1);
    else c.push(Object.assign({ qty: 1 }, item));
    write(c); toast('Article ajouté au panier'); render();
  }
  function removeAt(i) { var c = read(); c.splice(i, 1); write(c); render(); }
  function setQty(i, q) { var c = read(); if (c[i]) { c[i].qty = Math.max(1, q); write(c); render(); } }
  function clear() { localStorage.removeItem(KEY); paintCount(); render(); }

  // Compteur dans la nav : "Panier" si vide, "Panier (n)" sinon
  function paintCount() {
    var n = count();
    document.querySelectorAll('.cart-link').forEach(function (a) {
      a.textContent = n > 0 ? 'Panier (' + n + ')' : 'Panier';
    });
  }

  // Petit toast de confirmation
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'jeca-toast'; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 2200);
  }

  function shipCost(subtotal, code) {
    var c = CARRIERS[code]; if (!c) return 0;
    if (c.freeFrom != null && subtotal >= c.freeFrom) return 0;
    return c.price;
  }

  // Rendu de la page panier (si #cart-app présent)
  function render() {
    var app = document.getElementById('cart-app');
    if (!app) return;
    var c = read();

    if (!c.length) {
      app.innerHTML =
        '<div class="empty-cart">' +
          '<h2>Votre panier est vide</h2>' +
          '<p class="muted">Découvrez nos bijoux connectés de géolocalisation pour enfants.</p>' +
          '<a class="btn" href="bracelets.html">Découvrir nos bijoux</a>' +
        '</div>';
      return;
    }

    var bijoux = 0, abo = 0, lignes = '';
    c.forEach(function (it, i) {
      var p = (it.price || 0) * (it.qty || 1);
      bijoux += p; abo += (it.planPrice || 0) * (it.qty || 1);
      lignes +=
        '<tr>' +
          '<td><div class="it">' +
            '<span class="mini"><img src="' + (it.img || 'img/canva-bracelet-argent.png') + '" alt="' + it.name + '"></span>' +
            '<div><b>' + it.name + '</b><br><span class="muted" style="font-size:13px">' + (it.cat || 'Bijou connecté · enfant 4–12 ans') + '</span>' +
            (it.plan ? '<br><span class="muted" style="font-size:12px">Abonnement ' + it.plan + '</span>' : '') + '</div>' +
          '</div></td>' +
          '<td>' + (it.finition ? '<span class="dot ' + it.finition + '"></span> ' + (it.finition === 'or' ? 'Or' : 'Argent') : '—') + '</td>' +
          '<td><div class="qtybox"><button data-q="-" data-i="' + i + '">−</button><span>' + (it.qty || 1) + '</span><button data-q="+" data-i="' + i + '">+</button></div></td>' +
          '<td>' + euro(p) + '</td>' +
          '<td><button class="rm" data-rm="' + i + '" title="Retirer">✕</button></td>' +
        '</tr>';
    });

    var ship = getShip(), liv = shipCost(bijoux, ship);
    var total = bijoux + abo + liv;

    var ships = Object.keys(CARRIERS).map(function (code) {
      var cr = CARRIERS[code], cost = shipCost(bijoux, code);
      var label = cost === 0 ? 'Offerte' : euro(cost);
      return '<label class="ship' + (code === ship ? ' sel' : '') + '">' +
        '<input type="radio" name="ship" value="' + code + '"' + (code === ship ? ' checked' : '') + '>' +
        '<span class="s-main"><b>' + cr.label + '</b><small>' + cr.note + '</small></span>' +
        '<span class="s-price">' + label + '</span></label>';
    }).join('');

    app.innerHTML =
      '<div class="cart-grid">' +
        '<div>' +
          '<table class="cart"><thead><tr><th>Article</th><th>Finition</th><th>Qté</th><th>Prix</th><th></th></tr></thead>' +
            '<tbody>' + lignes + '</tbody></table>' +
          '<div class="cart-foot">' +
            '<a href="bracelets.html" class="muted" style="font-size:14px">← Continuer mes achats</a>' +
            '<button class="link-del" id="clearcart">Vider le panier</button>' +
          '</div>' +
          '<div class="ship-block"><div class="ship-title">Mode de livraison</div>' + ships + '</div>' +
        '</div>' +
        '<aside class="summary">' +
          '<h3 style="margin-bottom:14px">Récapitulatif</h3>' +
          '<div class="row"><span>Bijou(x)</span><span>' + euro(bijoux) + '</span></div>' +
          (abo ? '<div class="row"><span>Abonnement (1er mois)</span><span>' + euro(abo) + '</span></div>' : '') +
          '<div class="row"><span>Livraison (' + CARRIERS[ship].label + ')</span><span>' + (liv === 0 ? 'Offerte' : euro(liv)) + '</span></div>' +
          '<div class="row total"><span>Total aujourd\'hui</span><span>' + euro(total) + '</span></div>' +
          (abo ? '<p class="muted" style="font-size:13px;margin:12px 0 18px">Puis ' + euro(abo) + '/mois, résiliable à tout moment. Paiement en 3× sans frais disponible.</p>' : '<p class="muted" style="font-size:13px;margin:12px 0 18px">Paiement en 3× sans frais disponible.</p>') +
          '<a class="btn" href="https://buy.stripe.com/test_dRm7sDapS9Di0O8b1Q1ck00" target="_blank" rel="noopener" style="width:100%;text-align:center">Procéder au paiement</a>' +
          '<p class="muted" style="font-size:11px;text-align:center;margin-top:8px">Paiement sécurisé Stripe · mode test (carte 4242 4242 4242 4242)</p>' +
          '<div class="trust-line"><span>Paiement sécurisé</span><span>Données en France</span></div>' +
        '</aside>' +
      '</div>';

    // listeners
    app.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { removeAt(+b.dataset.rm); }; });
    app.querySelectorAll('[data-q]').forEach(function (b) {
      b.onclick = function () { var i = +b.dataset.i, c = read(); var q = (c[i].qty || 1) + (b.dataset.q === '+' ? 1 : -1); setQty(i, q); };
    });
    var clr = document.getElementById('clearcart'); if (clr) clr.onclick = clear;
    app.querySelectorAll('input[name="ship"]').forEach(function (r) { r.onchange = function () { setShip(r.value); render(); }; });
  }

  window.JECA = { add: add, removeAt: removeAt, clear: clear, read: read, count: count, render: render, toast: toast };
  document.addEventListener('DOMContentLoaded', function () {
    paintCount(); render();
    document.querySelectorAll('[data-add]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); try { add(JSON.parse(b.getAttribute('data-add'))); } catch (err) {} });
    });
  });
})();
