let _ctx = null;
let _analyser = null;
let _source = null;

export function getAnalyser(audioElement) {
  if (_analyser) return _analyser;
  if (!audioElement) return null;
  try {
    _ctx = _ctx ?? new (window.AudioContext || window.webkitAudioContext)();
    if (!_source) {
      _source = _ctx.createMediaElementSource(audioElement);
      _analyser = _ctx.createAnalyser();
      _analyser.fftSize = 256;
      _source.connect(_analyser);
      _analyser.connect(_ctx.destination);
    }
    return _analyser;
  } catch {
    return _analyser;
  }
}
