/**
 * ArbanTV Resumable Upload Client
 * Usage: include this script, then use ArbanUpload.init({ apiBase, getUserId }) and ArbanUpload.upload(file, { onProgress, onPause, onResume, onComplete, onError })
 */
(function (global) {
    function noop() {}
  
    function ArbanUpload(options) {
      this.apiBase = (options && options.apiBase) || '';
      this.getUserId = (options && options.getUserId) || function () { return 'anonymous'; };
      this.uploadId = null;
      this.chunkSize = 0;
      this.totalChunks = 0;
      this.paused = false;
      this.cancelled = false;
    }
  
    ArbanUpload.prototype._base = function () {
      var base = this.apiBase.replace(/\/$/, '');
      return base ? base + '/api/uploads' : '/api/uploads';
    };
  
    ArbanUpload.prototype._headers = function (json) {
      var h = { 'X-User-Id': this.getUserId(), 'Accept': 'application/json' };
      if (json) h['Content-Type'] = 'application/json';
      return h;
    };
  
    ArbanUpload.prototype.initSession = function (fileName, fileSize) {
      var self = this;
      var url = this._base() + '/init';
      return fetch(url, {
        method: 'POST',
        headers: this._headers(true),
        body: JSON.stringify({ fileName: fileName, fileSize: fileSize }),
      }).then(function (res) {
        if (!res.ok) return res.json().then(function (e) { throw new Error(e.message || 'Init failed'); });
        return res.json();
      }).then(function (data) {
        self.uploadId = data.sessionId || data.uploadId;
        self.chunkSize = data.chunkSize;
        self.totalChunks = data.totalChunks;
        return data;
      });
    };
  
    ArbanUpload.prototype.getStatus = function () {
      return fetch(this._base() + '/' + this.uploadId + '/status', { headers: this._headers() })
        .then(function (res) {
          if (!res.ok) throw new Error('Status failed');
          return res.json();
        });
    };
  
    ArbanUpload.prototype.uploadChunk = function (file, index) {
      var start = index * this.chunkSize;
      var end = Math.min(start + this.chunkSize, file.size);
      var blob = file.slice(start, end);
      var form = new FormData();
      form.append('chunk', blob);
      form.append('chunkIndex', String(index));
  
      return fetch(this._base() + '/' + this.uploadId + '/chunk', {
        method: 'POST',
        headers: this._headers(),
        body: form,
      }).then(function (res) {
        if (!res.ok) return res.json().then(function (e) { throw new Error(e.message || 'Chunk failed'); });
        return res.json();
      });
    };
  
    ArbanUpload.prototype.upload = function (file, callbacks) {
      var self = this;
      var onProgress = (callbacks && callbacks.onProgress) || noop;
      var onComplete = (callbacks && callbacks.onComplete) || noop;
      var onError = (callbacks && callbacks.onError) || noop;
      var onPause = (callbacks && callbacks.onPause) || noop;
      var onResume = (callbacks && callbacks.onResume) || noop;
  
      function run() {
        return self.initSession(file.name, file.size)
          .then(function () { return self.getStatus(); })
          .then(function (status) {
            var uploaded = new Set((status.uploadedChunkIndices || status.uploadedChunks || []).map(Number));
            var total = status.totalChunks || self.totalChunks;
  
            function next(i) {
              if (self.cancelled) return Promise.reject(new Error('Cancelled'));
              while (self.paused) {
                return new Promise(function (r) { setTimeout(r, 100); }).then(function () { return next(i); });
              }
              if (uploaded.has(i)) {
                if (i + 1 >= total) return complete();
                return next(i + 1);
              }
              return self.uploadChunk(file, i).then(function () {
                uploaded.add(i);
                onProgress({ loaded: uploaded.size, total: total, percent: Math.round((uploaded.size / total) * 100) });
                if (i + 1 >= total) return complete();
                return next(i + 1);
              });
            }
  
            function complete() {
              return fetch(self._base() + '/' + self.uploadId + '/complete', {
                method: 'POST',
                headers: self._headers(true),
              }).then(function (res) {
                if (!res.ok) return res.json().then(function (e) { throw new Error(e.message || 'Complete failed'); });
                return res.json();
              }).then(onComplete);
            }
  
            return next(0);
          })
          .catch(onError);
      }
  
      return run();
    };
  
    ArbanUpload.prototype.pause = function () { this.paused = true; };
    ArbanUpload.prototype.resume = function () { this.paused = false; };
    ArbanUpload.prototype.cancel = function () {
      this.cancelled = true;
      this.paused = false;
      if (this.uploadId) {
        fetch(this._base() + '/' + this.uploadId, { method: 'DELETE', headers: this._headers() }).catch(function () {});
      }
    };
  
    global.ArbanUpload = {
      init: function (options) {
        return new ArbanUpload(options);
      },
    };
  })(typeof window !== 'undefined' ? window : this);