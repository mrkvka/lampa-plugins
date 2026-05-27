(function () {
  'use strict';

  if (window.plugin_lampa_swarm_ready) return;

  function startPlugin() {
    window.plugin_lampa_swarm_ready = true;

    var api_host = 'http://192.168.1.236:3000';

    Lampa.Manifest.plugins = {
      type: 'extension',
      version: '1.0.1',
      name: 'Lampa Swarm',
      description: 'Живые пиры из TorrServer',
    };

    function fetchSwarm(hash, cb) {
      fetch(api_host + '/api/v1/swarm?hash=' + encodeURIComponent(hash), { method: 'GET' })
        .then(function (r) { return r.json(); })
        .then(function (data) { cb(null, data); })
        .catch(function (e) { cb(e, null); });
    }

    function patchSeedLabels() {
      document.querySelectorAll('.torrent-item__seeds').forEach(function (el) {
        if (el.dataset.patched) return;
        el.dataset.patched = '1';
        el.title = 'По данным трекера';
        var orig = el.textContent.trim();
        if (orig && orig.indexOf('★') === -1) el.textContent = orig + ' ★';
      });
    }

    function showLivePeers(hash) {
      fetchSwarm(hash, function (err, data) {
        if (err || !data || data.torrent_status === 'not_in_torrserver') return;
        var c = data.connected_peers != null ? data.connected_peers : '?';
        var t = data.total_peers != null ? data.total_peers : '?';
        var s = data.seeds != null ? data.seeds : '?';
        var text = 'TorrServer: ' + c + ' / ' + t + ' (сиды ' + s + ')';
        if (Lampa.Notice && Lampa.Notice.show) Lampa.Notice.show({ text: text, time: 5000 });
        else if (Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show(text);
      });
    }

    Lampa.Listener.follow('activity', function (e) {
      if (e.component === 'torrents' && e.type === 'render') setTimeout(patchSeedLabels, 400);
    });

    Lampa.Player.listener.follow('start', function (data) {
      if (data.torrent_hash) showLivePeers(data.torrent_hash);
    });
  }

  if (window.Lampa && window.appready) startPlugin();
  else if (window.Lampa) {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') startPlugin();
    });
  } else {
    document.addEventListener('lampa', startPlugin);
    setTimeout(function () {
      if (window.Lampa) startPlugin();
    }, 3000);
  }
})();
