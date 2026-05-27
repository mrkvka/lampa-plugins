(function () {
  'use strict';

  var PLUGIN_NAME    = 'Lampa Swarm';
  var PLUGIN_VERSION = '1.0.0';
  var api_host       = 'http://192.168.1.236:3000';

  if (window.Lampa && Lampa.Manifest) {
    Lampa.Manifest.plugins = Lampa.Manifest.plugins || [];
    Lampa.Manifest.plugins.push({ name: PLUGIN_NAME, version: PLUGIN_VERSION, author: 'mrkvka' });
  }

  /* ---------- API ---------- */

  // Получить список всех торрентов которые сейчас в TorrServer
  function fetchSwarmList(cb) {
    fetch(api_host + '/api/v1/swarm', { method: 'GET' })
      .then(function (r) { return r.json(); })
      .then(function (data) { cb(null, data); })
      .catch(function (e) { cb(e, null); });
  }

  // Получить пиры конкретного торрента по hash
  function fetchSwarm(hash, cb) {
    fetch(api_host + '/api/v1/swarm?hash=' + encodeURIComponent(hash), { method: 'GET' })
      .then(function (r) { return r.json(); })
      .then(function (data) { cb(null, data); })
      .catch(function (e) { cb(e, null); });
  }

  /* ---------- UI ---------- */

  // Дописываем «(трекер)» к полю сидов в списке торрентов
  function patchSeedLabels() {
    document.querySelectorAll('.torrent-item__seeds, [class*="torrent"][class*="seed"]').forEach(function (el) {
      if (el.dataset.patched) return;
      el.dataset.patched = '1';
      el.title = 'Данные трекера — могут быть завышены';
      el.style.opacity = '0.7';
      var orig = el.textContent.trim();
      if (orig) el.textContent = orig + ' ★';
    });
  }

  // Показать уведомление с живыми пирами после выбора торрента
  function showLivePeers(hash) {
    fetchSwarm(hash, function (err, data) {
      if (err || !data) return;
      var connected = data.connected_peers != null ? data.connected_peers : '?';
      var total     = data.total_peers     != null ? data.total_peers     : '?';
      var seeds     = data.seeds           != null ? data.seeds           : '?';
      Lampa.Noty.show(
        'TorrServer: подключено <b>' + connected + '</b> / в рое <b>' + total + '</b> (сиды: ' + seeds + ')'
      );
    });
  }

  /* ---------- Хуки Lampa ---------- */

  // Патчим подписи в списке торрентов
  Lampa.Listener.follow('activity', function (e) {
    if (e.component === 'torrents' && e.type === 'render') {
      setTimeout(patchSeedLabels, 500);
    }
  });

  // Показываем живые пиры когда пользователь выбрал торрент для просмотра
  Lampa.Listener.follow('torrent_file', function (e) {
    if (e.type === 'open' && e.element && e.element.MagnetUri) {
      var match = e.element.MagnetUri.match(/btih:([a-fA-F0-9]{40})/i);
      if (match) showLivePeers(match[1].toLowerCase());
    }
  });

  // Живые пиры когда стрим уже стартовал
  Lampa.Player.listener.follow('start', function (data) {
    if (data.torrent_hash) showLivePeers(data.torrent_hash);
  });

})();
